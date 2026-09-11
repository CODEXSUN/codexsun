import type {
  PlatformDurableEvent,
  PlatformDurableEventConsumer,
  PlatformDurableEventDelivery,
  PlatformDurableEventStore,
  PlatformDurableEventWriter,
} from '@codexsun/platform-core-api'
import { sql, type Transaction } from 'kysely'
import type { Database, DatabaseSchema } from '../../database.js'

const leaseMilliseconds = 30_000

/** MariaDB storage for a shared outbox and consumer-specific idempotent inboxes. */
export class MariaDbDurableEventStore
  implements PlatformDurableEventStore, PlatformDurableEventWriter<unknown>
{
  constructor(private readonly database: Database) {}

  async append(transaction: unknown, event: PlatformDurableEvent): Promise<void> {
    await (transaction as Transaction<DatabaseSchema>)
      .insertInto('platform_event_outbox')
      .values({
        correlation_id: event.correlationId ?? null,
        event_id: event.eventId,
        event_type: event.eventType,
        event_version: event.version,
        occurred_at: new Date(event.occurredAt),
        payload_json: JSON.stringify(event.payload),
        publisher_id: event.publisherId,
      })
      .execute()
  }

  async claim(
    consumer: PlatformDurableEventConsumer,
    now: Date,
  ): Promise<PlatformDurableEventDelivery | undefined> {
    return this.database.transaction().execute(async (transaction) => {
      await this.recoverExpiredIn(transaction, now)
      const existing = await this.findClaimable(transaction, consumer, now)
      const candidate = existing ?? (await this.createInboxForNewEvent(transaction, consumer, now))
      if (!candidate) return undefined

      const claimed = await transaction
        .updateTable('platform_event_inbox')
        .set({
          attempts: candidate.attempts + 1,
          lease_expires_at: new Date(now.getTime() + leaseMilliseconds),
          state: 'processing',
          updated_at: now,
        })
        .where('consumer_id', '=', consumer.consumerId)
        .where('event_id', '=', candidate.eventId)
        .where('state', '=', 'pending')
        .executeTakeFirst()
      if (Number(claimed.numUpdatedRows) !== 1) return undefined
      return {
        attempts: candidate.attempts + 1,
        consumerId: consumer.consumerId,
        event: candidate.event,
        state: 'processing',
      }
    })
  }

  async complete(delivery: PlatformDurableEventDelivery, completedAt: Date): Promise<void> {
    await this.database
      .updateTable('platform_event_inbox')
      .set({
        lease_expires_at: null,
        processed_at: completedAt,
        state: 'completed',
        updated_at: completedAt,
      })
      .where('consumer_id', '=', delivery.consumerId)
      .where('event_id', '=', delivery.event.eventId)
      .where('state', '=', 'processing')
      .execute()
  }

  async fail(
    delivery: PlatformDurableEventDelivery,
    failure: Error,
    nextAttemptAt: Date | undefined,
  ): Promise<void> {
    const now = new Date()
    await this.database
      .updateTable('platform_event_inbox')
      .set({
        last_failure: failure.message.slice(0, 512),
        lease_expires_at: null,
        next_attempt_at: nextAttemptAt ?? null,
        state: nextAttemptAt ? 'pending' : 'failed',
        updated_at: now,
      })
      .where('consumer_id', '=', delivery.consumerId)
      .where('event_id', '=', delivery.event.eventId)
      .where('state', '=', 'processing')
      .execute()
  }

  async recoverExpired(now: Date): Promise<void> {
    await this.database
      .transaction()
      .execute((transaction) => this.recoverExpiredIn(transaction, now))
  }

  private async recoverExpiredIn(
    transaction: Transaction<DatabaseSchema>,
    now: Date,
  ): Promise<void> {
    await transaction
      .updateTable('platform_event_inbox')
      .set({ lease_expires_at: null, next_attempt_at: now, state: 'pending', updated_at: now })
      .where('state', '=', 'processing')
      .where('lease_expires_at', '<=', now)
      .execute()
  }

  private async findClaimable(
    transaction: Transaction<DatabaseSchema>,
    consumer: PlatformDurableEventConsumer,
    now: Date,
  ): Promise<ClaimableDelivery | undefined> {
    const row = await transaction
      .selectFrom('platform_event_inbox as inbox')
      .innerJoin('platform_event_outbox as outbox', 'outbox.event_id', 'inbox.event_id')
      .select([
        'inbox.attempts',
        'outbox.correlation_id',
        'outbox.event_id',
        'outbox.event_type',
        'outbox.event_version',
        'outbox.occurred_at',
        'outbox.payload_json',
        'outbox.publisher_id',
      ])
      .where('inbox.consumer_id', '=', consumer.consumerId)
      .where('inbox.state', '=', 'pending')
      .where((expression) =>
        expression.or([
          expression('inbox.next_attempt_at', 'is', null),
          expression('inbox.next_attempt_at', '<=', now),
        ]),
      )
      .where('outbox.event_type', 'in', consumer.eventTypes)
      .orderBy('outbox.occurred_at')
      .limit(1)
      .forUpdate()
      .executeTakeFirst()
    return row ? mapClaimable(row) : undefined
  }

  private async createInboxForNewEvent(
    transaction: Transaction<DatabaseSchema>,
    consumer: PlatformDurableEventConsumer,
    now: Date,
  ): Promise<ClaimableDelivery | undefined> {
    const outbox = await transaction
      .selectFrom('platform_event_outbox as outbox')
      .selectAll('outbox')
      .where('outbox.event_type', 'in', consumer.eventTypes)
      .where((expression) =>
        expression.not(
          expression.exists(
            expression
              .selectFrom('platform_event_inbox as inbox')
              .select(sql`1`.as('exists'))
              .whereRef('inbox.event_id', '=', 'outbox.event_id')
              .where('inbox.consumer_id', '=', consumer.consumerId),
          ),
        ),
      )
      .orderBy('outbox.occurred_at')
      .limit(1)
      .forUpdate()
      .executeTakeFirst()
    if (!outbox) return undefined

    await transaction
      .insertInto('platform_event_inbox')
      .values({
        attempts: 0,
        consumer_id: consumer.consumerId,
        event_id: outbox.event_id,
        last_failure: null,
        lease_expires_at: null,
        next_attempt_at: now,
        processed_at: null,
        state: 'pending',
        updated_at: now,
      })
      .onDuplicateKeyUpdate({ event_id: sql`event_id` })
      .execute()
    return { attempts: 0, event: mapEvent(outbox), eventId: outbox.event_id }
  }
}

interface ClaimableDelivery {
  attempts: number
  event: PlatformDurableEvent
  eventId: string
}

function mapClaimable(value: {
  attempts: number
  correlation_id: string | null
  event_id: string
  event_type: string
  event_version: string
  occurred_at: Date
  payload_json: string
  publisher_id: string
}): ClaimableDelivery {
  return { attempts: value.attempts, event: mapEvent(value), eventId: value.event_id }
}

function mapEvent(value: {
  correlation_id: string | null
  event_id: string
  event_type: string
  event_version: string
  occurred_at: Date
  payload_json: string
  publisher_id: string
}): PlatformDurableEvent {
  return {
    ...(value.correlation_id ? { correlationId: value.correlation_id } : {}),
    eventId: value.event_id,
    eventType: value.event_type,
    occurredAt: value.occurred_at.toISOString(),
    payload: JSON.parse(value.payload_json) as unknown,
    publisherId: value.publisher_id,
    version: value.event_version,
  }
}
