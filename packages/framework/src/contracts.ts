export interface FieldViolation {
  readonly field: string;
  readonly message: string;
}

export interface FrameworkFailure {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
  readonly violations?: readonly FieldViolation[];
}

export type Result<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: FrameworkFailure };

export interface PageRequest {
  readonly cursor?: string;
  readonly limit: number;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor?: string;
}

export interface Command<TInput, TOutput> {
  readonly name: string;
  execute(input: TInput): Promise<Result<TOutput>>;
}

export interface Query<TInput, TOutput> {
  readonly name: string;
  execute(input: TInput): Promise<Result<TOutput>>;
}

export interface DomainEvent<TPayload> {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: string;
  readonly payload: TPayload;
  readonly correlationId?: string;
}

export function success<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function failure(error: FrameworkFailure): Result<never> {
  return { ok: false, error };
}
