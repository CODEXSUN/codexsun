import { describe, it } from "node:test";
import {
  AppError,
  TaskNotFoundError,
  TaskInvalidStateError,
  TaskVerificationFailedError,
  SecurityError,
  BoundaryViolationError,
  MemoryError,
  SkillNotFoundError,
  CapabilityError,
  ErrorCode,
  isAppError,
} from "./error-handler.js";
import assert from "node:assert";

describe("Error Handler", () => {
  describe("AppError", () => {
    it("should create basic AppError", () => {
      const error = new AppError(ErrorCode.INTERNAL_SERVER_ERROR, "Test error");
      assert.strictEqual(error instanceof AppError, true);
      assert.strictEqual(error.code, ErrorCode.INTERNAL_SERVER_ERROR);
      assert.strictEqual(error.message, "Test error");
      assert.strictEqual(error.statusCode, 500);
    });

    it("should create AppError with custom status code", () => {
      const error = new AppError(ErrorCode.NOT_FOUND, "Not found", 404);
      assert.strictEqual(error.statusCode, 404);
    });

    it("should create AppError with details", () => {
      const details = { userId: "123", action: "delete" };
      const error = new AppError(ErrorCode.FORBIDDEN, "Access denied", 403, details);
      assert.deepStrictEqual(error.details, details);
    });
  });

  describe("Domain-specific errors", () => {
    it("should create TaskNotFoundError", () => {
      const error = new TaskNotFoundError("task-123");
      assert.strictEqual(error.code, ErrorCode.TASK_NOT_FOUND);
      assert.strictEqual(error.statusCode, 404);
      assert.strictEqual(error.message.includes("task-123"), true);
      assert.strictEqual(error.details?.taskId, "task-123");
    });

    it("should create TaskInvalidStateError", () => {
      const error = new TaskInvalidStateError("task-123", "completed", "in_progress");
      assert.strictEqual(error.code, ErrorCode.TASK_INVALID_STATE);
      assert.strictEqual(error.statusCode, 400);
      assert.strictEqual(error.details?.currentState, "completed");
      assert.strictEqual(error.details?.expectedState, "in_progress");
    });

    it("should create TaskVerificationFailedError", () => {
      const error = new TaskVerificationFailedError("task-123", ["test1", "test2"]);
      assert.strictEqual(error.code, ErrorCode.TASK_VERIFICATION_FAILED);
      assert.strictEqual(error.statusCode, 400);
      assert.deepStrictEqual(error.details?.failedChecks, ["test1", "test2"]);
    });

    it("should create SecurityError", () => {
      const error = new SecurityError("Unauthorized access");
      assert.strictEqual(error.code, ErrorCode.SECURITY_ERROR);
      assert.strictEqual(error.statusCode, 403);
      assert.strictEqual(error.message, "Unauthorized access");
    });

    it("should create BoundaryViolationError", () => {
      const error = new BoundaryViolationError("/etc/passwd", "/workspace");
      assert.strictEqual(error.code, ErrorCode.BOUNDARY_VIOLATION);
      assert.strictEqual(error.statusCode, 403);
      assert.strictEqual(error.details?.targetPath, "/etc/passwd");
      assert.strictEqual(error.details?.repositoryRoot, "/workspace");
    });

    it("should create MemoryError", () => {
      const error = new MemoryError("Memory operation failed");
      assert.strictEqual(error.code, ErrorCode.MEMORY_ERROR);
      assert.strictEqual(error.statusCode, 500);
    });

    it("should create SkillNotFoundError", () => {
      const error = new SkillNotFoundError("missing-skill");
      assert.strictEqual(error.code, ErrorCode.SKILL_NOT_FOUND);
      assert.strictEqual(error.statusCode, 404);
      assert.strictEqual(error.details?.skillName, "missing-skill");
    });

    it("should create CapabilityError", () => {
      const error = new CapabilityError("web-search", "Network timeout");
      assert.strictEqual(error.code, ErrorCode.CAPABILITY_ERROR);
      assert.strictEqual(error.statusCode, 500);
      assert.strictEqual(error.details?.capabilityId, "web-search");
    });
  });

  describe("isAppError", () => {
    it("should identify AppError instances", () => {
      const error = new AppError(ErrorCode.INTERNAL_SERVER_ERROR, "Test");
      assert.strictEqual(isAppError(error), true);
    });

    it("should identify domain-specific errors", () => {
      const error = new TaskNotFoundError("task-123");
      assert.strictEqual(isAppError(error), true);
    });

    it("should reject regular Error instances", () => {
      const error = new Error("Regular error");
      assert.strictEqual(isAppError(error), false);
    });

    it("should reject non-Error values", () => {
      assert.strictEqual(isAppError("string"), false);
      assert.strictEqual(isAppError(123), false);
      assert.strictEqual(isAppError(null), false);
      assert.strictEqual(isAppError(undefined), false);
    });
  });

  describe("ErrorCode enum", () => {
    it("should have all expected error codes", () => {
      assert.strictEqual(ErrorCode.INTERNAL_SERVER_ERROR !== undefined, true);
      assert.strictEqual(ErrorCode.BAD_REQUEST !== undefined, true);
      assert.strictEqual(ErrorCode.UNAUTHORIZED !== undefined, true);
      assert.strictEqual(ErrorCode.FORBIDDEN !== undefined, true);
      assert.strictEqual(ErrorCode.NOT_FOUND !== undefined, true);
      assert.strictEqual(ErrorCode.CONFLICT !== undefined, true);
      assert.strictEqual(ErrorCode.TASK_NOT_FOUND !== undefined, true);
      assert.strictEqual(ErrorCode.TASK_INVALID_STATE !== undefined, true);
      assert.strictEqual(ErrorCode.TASK_VERIFICATION_FAILED !== undefined, true);
      assert.strictEqual(ErrorCode.MEMORY_ERROR !== undefined, true);
      assert.strictEqual(ErrorCode.SKILL_NOT_FOUND !== undefined, true);
      assert.strictEqual(ErrorCode.SKILL_INVALID_FORMAT !== undefined, true);
      assert.strictEqual(ErrorCode.CAPABILITY_ERROR !== undefined, true);
      assert.strictEqual(ErrorCode.CAPABILITY_NOT_AVAILABLE !== undefined, true);
      assert.strictEqual(ErrorCode.SECURITY_ERROR !== undefined, true);
      assert.strictEqual(ErrorCode.BOUNDARY_VIOLATION !== undefined, true);
      assert.strictEqual(ErrorCode.LEARNING_ERROR !== undefined, true);
      assert.strictEqual(ErrorCode.HEURISTIC_NOT_FOUND !== undefined, true);
    });
  });
});
