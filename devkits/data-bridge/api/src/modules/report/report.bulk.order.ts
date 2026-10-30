import { AppError } from "@codexsun/framework/errors";
import type { CommonTableName } from "../import-review/index.js";

export function parentOrder(
  tables: readonly CommonTableName[],
  dependencies: Map<string, string[]>
) {
  const remaining = [...tables];
  const ordered: CommonTableName[] = [];
  while (remaining.length) {
    const index = remaining.findIndex((table) =>
      (dependencies.get(table) ?? []).every((parent) => ordered.includes(parent as CommonTableName))
    );
    if (index < 0)
      throw AppError.validation(
        "Common table dependencies contain a cycle or an unsupported parent. Review the foreign keys before importing."
      );
    ordered.push(remaining.splice(index, 1)[0]!);
  }
  return ordered;
}
