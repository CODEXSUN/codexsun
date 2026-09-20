import type { DomainEvent, Result } from "./contracts.js";

export interface CapabilityContext {
  readonly correlationId: string;
  readonly actorId?: string;
  readonly tenantId?: string;
}

export interface DeliveryReceipt {
  readonly providerId: string;
  readonly acceptedAt: string;
  readonly externalId?: string;
}

export interface EmailMessage {
  readonly to: readonly string[];
  readonly subject: string;
  readonly text?: string;
  readonly html?: string;
  readonly templateId?: string;
  readonly templateData?: Readonly<Record<string, unknown>>;
  readonly idempotencyKey: string;
}

export interface EmailProvider {
  send(message: EmailMessage, context: CapabilityContext): Promise<Result<DeliveryReceipt>>;
}

export interface SmsMessage {
  readonly to: string;
  readonly text: string;
  readonly idempotencyKey: string;
}

export interface SmsProvider {
  send(message: SmsMessage, context: CapabilityContext): Promise<Result<DeliveryReceipt>>;
}

export interface MessengerMessage {
  readonly recipient: string;
  readonly text: string;
  readonly attachments?: readonly ObjectReference[];
  readonly idempotencyKey: string;
}

export interface MessengerProvider {
  send(message: MessengerMessage, context: CapabilityContext): Promise<Result<DeliveryReceipt>>;
}

export interface ChatMessage {
  readonly conversationId: string;
  readonly messageId: string;
  readonly senderId: string;
  readonly text: string;
  readonly sentAt: string;
  readonly attachments?: readonly ObjectReference[];
}

export interface RealtimeChatProvider {
  publish(message: ChatMessage, context: CapabilityContext): Promise<Result<void>>;
}

export interface PrintRequest {
  readonly jobId: string;
  readonly document: ObjectReference;
  readonly printerId?: string;
  readonly copies: number;
  readonly options?: Readonly<Record<string, string | number | boolean>>;
}

export interface PrintProvider {
  submit(request: PrintRequest, context: CapabilityContext): Promise<Result<DeliveryReceipt>>;
}

export interface ObjectReference {
  readonly id: string;
  readonly owner: string;
  readonly visibility: "private" | "public";
  readonly mediaType: string;
  readonly byteLength: number;
  readonly checksum?: string;
}

export interface ObjectStorageProvider {
  put(input: { readonly key: string; readonly mediaType: string; readonly bytes: Uint8Array }, context: CapabilityContext): Promise<Result<ObjectReference>>;
  get(reference: ObjectReference, context: CapabilityContext): Promise<Result<Uint8Array>>;
  delete(reference: ObjectReference, context: CapabilityContext): Promise<Result<void>>;
}

export interface SearchRequest {
  readonly query: string;
  readonly cursor?: string;
  readonly limit: number;
  readonly filters?: Readonly<Record<string, string | number | boolean>>;
}

export interface SearchHit<T = Readonly<Record<string, unknown>>> {
  readonly id: string;
  readonly score?: number;
  readonly document: T;
}

export interface SearchProvider {
  search<T>(request: SearchRequest, context: CapabilityContext): Promise<Result<{ readonly hits: readonly SearchHit<T>[]; readonly nextCursor?: string }>>;
  index<T>(id: string, document: T, context: CapabilityContext): Promise<Result<void>>;
  remove(id: string, context: CapabilityContext): Promise<Result<void>>;
}

export interface WebhookRequest {
  readonly id: string;
  readonly event: DomainEvent<unknown>;
  readonly targetId: string;
  readonly idempotencyKey: string;
}

export interface WebhookProvider {
  deliver(request: WebhookRequest, context: CapabilityContext): Promise<Result<DeliveryReceipt>>;
}

export interface DataExchangeProvider {
  import(input: { readonly format: "csv" | "json"; readonly source: ObjectReference; readonly mappingId: string }, context: CapabilityContext): Promise<Result<{ readonly accepted: number; readonly rejected: number; readonly jobId?: string }>>;
  export(input: { readonly format: "csv" | "json"; readonly queryId: string }, context: CapabilityContext): Promise<Result<ObjectReference>>;
}

export interface WorkflowTransition<State extends string, Event extends string> {
  readonly event: Event;
  readonly from: State;
  readonly to: State;
  readonly permission?: string;
}

export type WorkflowTransitionDecision<State extends string, Event extends string> =
  | { readonly allowed: true; readonly transition: WorkflowTransition<State, Event> }
  | { readonly allowed: false; readonly reason: "unknown-transition" | "permission-required" };

export function evaluateWorkflowTransition<State extends string, Event extends string>(input: {
  readonly state: State;
  readonly event: Event;
  readonly transitions: readonly WorkflowTransition<State, Event>[];
  readonly permissions?: ReadonlySet<string>;
}): WorkflowTransitionDecision<State, Event> {
  const transition = input.transitions.find((item) => item.from === input.state && item.event === input.event);
  if (!transition) return { allowed: false, reason: "unknown-transition" };
  if (transition.permission && !input.permissions?.has(transition.permission)) {
    return { allowed: false, reason: "permission-required" };
  }
  return { allowed: true, transition };
}

export interface LocalizationProvider {
  translate(key: string, locale: string, values?: Readonly<Record<string, string | number>>): string;
}

export interface SecretProvider {
  resolve(reference: string): Promise<string | undefined>;
}

export interface TenantContext {
  readonly tenantId: string;
  readonly tenantKey: string;
}

export interface TenantResolver {
  resolve(input: { readonly host?: string; readonly requestedTenant?: string; readonly actorId?: string }): Promise<Result<TenantContext | undefined>>;
}
