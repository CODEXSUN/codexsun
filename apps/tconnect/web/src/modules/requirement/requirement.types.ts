import type { z } from "zod";
import type { requirementInput } from "./requirement.schema";
export type RequirementInput = z.infer<typeof requirementInput>;
export type Requirement = RequirementInput & { uuid: string; createdAt: string };
