import type { ColumnType } from 'kysely'

type DatabaseTimestamp = ColumnType<Date, Date | string, Date | string>

export interface EventOutboxTable {
  correlation_id: string | null
  event_id: string
  event_type: string
  event_version: string
  occurred_at: DatabaseTimestamp
  payload_json: string
  publisher_id: string
}

export interface EventInboxTable {
  attempts: number
  consumer_id: string
  event_id: string
  last_failure: string | null
  lease_expires_at: DatabaseTimestamp | null
  next_attempt_at: DatabaseTimestamp | null
  processed_at: DatabaseTimestamp | null
  state: string
  updated_at: DatabaseTimestamp
}

export interface EventRuntimeDatabaseSchema {
  platform_event_inbox: EventInboxTable
  platform_event_outbox: EventOutboxTable
}
