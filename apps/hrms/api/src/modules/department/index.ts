export { departmentModule } from "./department.module.js";
export {
  departmentMigrations,
  migrateDepartmentDatabase,
  rollbackDepartmentDatabase
} from "./department.migration.js";
export { seedDepartmentPermissions } from "./department.seed.js";
export type {
  DepartmentActivity,
  DepartmentContext,
  DepartmentDatabase,
  DepartmentFilters,
  DepartmentInput,
  DepartmentRecord
} from "./department.types.js";
