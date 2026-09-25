import type { FastifyError, FastifyRequest, FastifyReply } from "fastify";

export enum ErrorCode {
  // General errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  
  // Domain-specific errors
  TASK_NOT_FOUND = "TASK_NOT_FOUND",
  TASK_INVALID_STATE = "TASK_INVALID_STATE",
  TASK_VERIFICATION_FAILED = "TASK_VERIFICATION_FAILED",
  
  MEMORY_ERROR = "MEMORY_ERROR",
  SKILL_NOT_FOUND = "SKILL_NOT_FOUND",
  SKILL_INVALID_FORMAT = "SKILL_INVALID_FORMAT",
  
  CAPABILITY_ERROR = "CAPABILITY_ERROR",
  CAPABILITY_NOT_AVAILABLE = "CAPABILITY_NOT_AVAILABLE",
  
  SECURITY_ERROR = "SECURITY_ERROR",
  BOUNDARY_VIOLATION = "BOUNDARY_VIOLATION",
  
  LEARNING_ERROR = "LEARNING_ERROR",
  HEURISTIC_NOT_FOUND = "HEURISTIC_NOT_FOUND",
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class TaskNotFoundError extends AppError {
  constructor(taskId: string) {
    super(
      ErrorCode.TASK_NOT_FOUND,
      `Task ${taskId} was not found.`,
      404,
      { taskId }
    );
  }
}

export class TaskInvalidStateError extends AppError {
  constructor(taskId: string, currentState: string, expectedState: string) {
    super(
      ErrorCode.TASK_INVALID_STATE,
      `Task ${taskId} is in ${currentState} state, expected ${expectedState}.`,
      400,
      { taskId, currentState, expectedState }
    );
  }
}

export class TaskVerificationFailedError extends AppError {
  constructor(taskId: string, failedChecks: string[]) {
    super(
      ErrorCode.TASK_VERIFICATION_FAILED,
      `Task ${taskId} verification failed with ${failedChecks.length} failed checks.`,
      400,
      { taskId, failedChecks }
    );
  }
}

export class SecurityError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      ErrorCode.SECURITY_ERROR,
      message,
      403,
      details
    );
  }
}

export class BoundaryViolationError extends SecurityError {
  constructor(targetPath: string, repositoryRoot: string) {
    super(
      `Security Exception: Access outside repository boundary prohibited for path '${targetPath}'.`,
      { targetPath, repositoryRoot }
    );
    this.code = ErrorCode.BOUNDARY_VIOLATION;
  }
}

export class MemoryError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(
      ErrorCode.MEMORY_ERROR,
      message,
      500,
      details
    );
  }
}

export class SkillNotFoundError extends AppError {
  constructor(skillName: string) {
    super(
      ErrorCode.SKILL_NOT_FOUND,
      `Skill '${skillName}' not found in catalog.`,
      404,
      { skillName }
    );
  }
}

export class CapabilityError extends AppError {
  constructor(capabilityId: string, message: string) {
    super(
      ErrorCode.CAPABILITY_ERROR,
      `Capability ${capabilityId} error: ${message}`,
      500,
      { capabilityId }
    );
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Log the error
  request.log.error(error, `Error processing request: ${request.method} ${request.url}`);

  // Handle known application errors
  if (isAppError(error)) {
    reply.code(error.statusCode).send({
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
    return;
  }

  // Handle Fastify validation errors
  if (error.validation) {
    reply.code(400).send({
      error: "Validation failed",
      code: ErrorCode.BAD_REQUEST,
      details: { validation: error.validation },
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
    return;
  }

  // Handle other Fastify errors
  if (error.statusCode) {
    reply.code(error.statusCode).send({
      error: error.message || "An error occurred",
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
    return;
  }

  // Default error response
  reply.code(500).send({
    error: "Internal server error",
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
  });
}

export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return (...args: Parameters<T>) => {
    return Promise.resolve(fn(...args)).catch((error) => {
      // If it's not already an AppError, convert it
      if (!isAppError(error)) {
        if (error instanceof Error) {
          throw new AppError(
            ErrorCode.INTERNAL_SERVER_ERROR,
            error.message,
            500,
            { originalError: error.name }
          );
        }
        throw new AppError(
          ErrorCode.INTERNAL_SERVER_ERROR,
          "An unexpected error occurred",
          500
        );
      }
      throw error;
    });
  };
}
