import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import Fastify from "fastify";
import { createPool } from "mysql2";
import { createConnection } from "mysql2/promise";
import { Kysely, MysqlDialect, sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { loadEnv } from "@codexsun/framework/env";
import { z } from "zod";
import { employeeModule } from "./employee.module.js";
import { migrateEmployeeDatabase } from "./employee.migration.js";
import { countEmployeeUserReferences, EmployeeRepository } from "./employee.repository.js";
import { seedEmployeePermissions } from "./employee.seed.js";
import { EmployeeService } from "./employee.service.js";
import { attendanceModule } from "../attendance/attendance.module.js";
import { migrateAttendanceDatabase } from "../attendance/attendance.migration.js";
import { AttendanceRepository } from "../attendance/attendance.repository.js";
import { seedAttendancePermissions } from "../attendance/attendance.seed.js";
import { AttendanceService } from "../attendance/attendance.service.js";
import type {
  AttendanceDatabase,
  AttendanceInput,
  AttendancePermissionDatabase
} from "../attendance/attendance.types.js";
import { departmentModule } from "../department/department.module.js";
import { migrateDepartmentDatabase } from "../department/department.migration.js";
import { DepartmentRepository } from "../department/department.repository.js";
import { seedDepartmentPermissions } from "../department/department.seed.js";
import { DepartmentService } from "../department/department.service.js";
import type {
  DepartmentDatabase,
  DepartmentInput,
  DepartmentPermissionDatabase
} from "../department/department.types.js";
import { designationModule } from "../designation/designation.module.js";
import { migrateDesignationDatabase } from "../designation/designation.migration.js";
import { DesignationRepository } from "../designation/designation.repository.js";
import { seedDesignationPermissions } from "../designation/designation.seed.js";
import { DesignationService } from "../designation/designation.service.js";
import type {
  DesignationDatabase,
  DesignationInput,
  DesignationPermissionDatabase
} from "../designation/designation.types.js";
import type {
  EmployeeDatabase,
  EmployeeInput,
  EmployeePermissionDatabase
} from "./employee.types.js";

const env = loadEnv(
  z.object({
    NODE_ENV: z.literal("development"),
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive(),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1)
  })
);
assert.equal(env.NODE_ENV, "development", "Employee E2E only runs in development.");
const suffix = randomBytes(5).toString("hex");
const names = [`codexsun_dev_hrms_${suffix}_a`, `codexsun_dev_hrms_${suffix}_b`];
const options = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD
};
const admin = await createConnection(options);
const databases: Kysely<EmployeeDatabase & EmployeePermissionDatabase>[] = [];
const createdNames: string[] = [];
const app = Fastify();
const input: EmployeeInput = {
  employeeCode: "EMP-001",
  name: "Employee test",
  email: "employee@example.test",
  phone: "",
  department: "Support",
  designation: "Executive",
  joiningDate: "2026-10-13",
  userId: 1,
  notes: "Test record",
  status: "active"
};
try {
  for (const name of names) {
    assert.match(name, /^codexsun_dev_hrms_[0-9a-f]{10}_[ab]$/);
    await admin.query(
      `CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    createdNames.push(name);
    const database = open(name);
    databases.push(database);
    await sql
      .raw(
        "CREATE TABLE app_users (id INT NOT NULL PRIMARY KEY,name VARCHAR(180),email VARCHAR(180),status VARCHAR(24))"
      )
      .execute(database);
    await sql
      .raw(
        "INSERT INTO app_users VALUES (1,'Active user','active@example.test','active'),(2,'Inactive user','inactive@example.test','inactive'),(3,'Other user','other@example.test','active')"
      )
      .execute(database);
    await sql
      .raw("CREATE TABLE app_roles (id INT PRIMARY KEY,`key` VARCHAR(80) UNIQUE)")
      .execute(database);
    await sql.raw("INSERT INTO app_roles VALUES (1,'admin')").execute(database);
    await sql
      .raw(
        "CREATE TABLE app_permissions (id INT AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) UNIQUE,`key` VARCHAR(180) UNIQUE,label VARCHAR(191),description VARCHAR(255),status VARCHAR(24),is_protected BOOLEAN)"
      )
      .execute(database);
    await sql
      .raw(
        "CREATE TABLE app_role_permissions (id INT AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) UNIQUE,role_id INT,permission_id INT,status VARCHAR(24),is_protected BOOLEAN,UNIQUE(role_id,permission_id))"
      )
      .execute(database);
    await migrateEmployeeDatabase(database);
    await migrateEmployeeDatabase(database);
    await seedEmployeePermissions(database);
    await migrateAttendanceDatabase(database as unknown as Kysely<AttendanceDatabase>);
    await migrateAttendanceDatabase(database as unknown as Kysely<AttendanceDatabase>);
    await seedAttendancePermissions(database as unknown as Kysely<AttendancePermissionDatabase>);
    await seedAttendancePermissions(database as unknown as Kysely<AttendancePermissionDatabase>);
    await migrateDepartmentDatabase(database as unknown as Kysely<DepartmentDatabase>);
    await migrateDepartmentDatabase(database as unknown as Kysely<DepartmentDatabase>);
    await seedDepartmentPermissions(database as unknown as Kysely<DepartmentPermissionDatabase>);
    await seedDepartmentPermissions(database as unknown as Kysely<DepartmentPermissionDatabase>);
    await migrateDesignationDatabase(database as unknown as Kysely<DesignationDatabase>);
    await migrateDesignationDatabase(database as unknown as Kysely<DesignationDatabase>);
    await seedDesignationPermissions(database as unknown as Kysely<DesignationPermissionDatabase>);
    await seedDesignationPermissions(database as unknown as Kysely<DesignationPermissionDatabase>);
    await sql`UPDATE app_permissions SET status='inactive' WHERE \`key\`='hrms.employee.delete'`.execute(
      database
    );
    await sql`UPDATE app_role_permissions SET status='inactive' WHERE permission_id=(SELECT id FROM app_permissions WHERE \`key\`='hrms.employee.update')`.execute(
      database
    );
    await seedEmployeePermissions(database);
    const permissions = await sql<{
      status: string;
    }>`SELECT status FROM app_permissions WHERE \`key\`='hrms.employee.delete'`.execute(database);
    assert.equal(permissions.rows[0]?.status, "inactive");
    const grants = await sql<{
      status: string;
    }>`SELECT status FROM app_role_permissions WHERE permission_id=(SELECT id FROM app_permissions WHERE \`key\`='hrms.employee.update')`.execute(
      database
    );
    assert.equal(grants.rows[0]?.status, "inactive");
    await sql`UPDATE app_permissions SET status='active'`.execute(database);
    await sql`UPDATE app_role_permissions SET status='active'`.execute(database);
  }
  const database = databases[0]!;
  const users = userAdapter(database);
  const service = new EmployeeService(new EmployeeRepository(database), users);
  const created = await service.create(
    { ...input, employeeCode: " emp-001 " },
    "admin@example.test"
  );
  assert.match(created.id, /^[0-9a-f]{8}$/);
  assert.equal(created.employeeCode, "EMP-001");
  assert.equal(created.userName, "Active user");
  assert.equal(created.joiningDate, "2026-10-13");
  await assert.rejects(
    service.create({ ...input, userId: null }, "admin@example.test"),
    /code already exists/
  );
  await assert.rejects(
    service.create({ ...input, employeeCode: "EMP-002" }, "admin@example.test"),
    /already mapped/
  );
  await assert.rejects(
    service.create({ ...input, employeeCode: "EMP-002", userId: 999 }, "admin@example.test"),
    /this tenant/
  );
  await assert.rejects(
    service.create({ ...input, employeeCode: "EMP-002", userId: 2 }, "admin@example.test"),
    /active user/
  );
  const attendanceOwner = await service.create(
    { ...input, employeeCode: "EMP-002", userId: null },
    "admin@example.test"
  );
  await service.create({ ...input, employeeCode: "EMP-003", userId: null }, "admin@example.test");
  assert.equal(await countEmployeeUserReferences(database, 1), 1);
  const other = new EmployeeService(
    new EmployeeRepository(databases[1]!),
    userAdapter(databases[1]!)
  );
  await assert.rejects(other.get(created.id), /not found/);
  const otherEmployee = await other.create(input, "other@example.test");
  assert.equal((await other.list({})).length, 1);

  const attendanceDatabase = database as unknown as Kysely<AttendanceDatabase>;
  const attendanceRepository = new AttendanceRepository(attendanceDatabase);
  const attendanceService = new AttendanceService(attendanceRepository);
  const attendanceInput: AttendanceInput = {
    employeeId: attendanceOwner.id,
    workDate: await attendanceRepository.today(),
    status: "present",
    checkIn: "09:00",
    checkOut: "17:00",
    notes: "E2E attendance"
  };
  const attendanceRecord = await attendanceService.create(attendanceInput, "admin@example.test");
  await assert.rejects(
    attendanceService.create(attendanceInput, "admin@example.test"),
    /already recorded/
  );
  const otherAttendance = new AttendanceService(
    new AttendanceRepository(databases[1]! as unknown as Kysely<AttendanceDatabase>)
  );
  assert.equal((await otherAttendance.list({})).length, 0);
  const otherAttendanceRecord = await otherAttendance.create(
    { ...attendanceInput, employeeId: otherEmployee.id },
    "other@example.test"
  );
  await assert.rejects(otherAttendance.get(attendanceRecord.id), /not found/);
  assert.equal((await otherAttendance.list({})).length, 1);

  const departmentDatabase = database as unknown as Kysely<DepartmentDatabase>;
  const departmentService = new DepartmentService(new DepartmentRepository(departmentDatabase));
  const departmentInput: DepartmentInput = {
    name: " Operations ",
    description: "E2E department",
    status: "active"
  };
  const department = await departmentService.create(departmentInput, "admin@example.test");
  assert.equal(department.name, "Operations");
  await assert.rejects(
    departmentService.create({ ...departmentInput, name: "Operations" }, "admin@example.test"),
    /already exists/
  );
  const otherDepartmentService = new DepartmentService(
    new DepartmentRepository(databases[1]! as unknown as Kysely<DepartmentDatabase>)
  );
  assert.equal((await otherDepartmentService.list({})).length, 0);
  const otherDepartment = await otherDepartmentService.create(
    { ...departmentInput, name: "Operations" },
    "other@example.test"
  );
  const designationDatabase = database as unknown as Kysely<DesignationDatabase>;
  const designationService = new DesignationService(new DesignationRepository(designationDatabase));
  const designationInput: DesignationInput = {
    name: " Team Lead ",
    description: "E2E designation",
    status: "active"
  };
  const designation = await designationService.create(designationInput, "admin@example.test");
  assert.equal(designation.name, "Team Lead");
  await assert.rejects(
    designationService.create({ ...designationInput, name: "Team Lead" }, "admin@example.test"),
    /already exists/
  );
  const otherDesignationService = new DesignationService(
    new DesignationRepository(databases[1]! as unknown as Kysely<DesignationDatabase>)
  );
  assert.equal((await otherDesignationService.list({})).length, 0);
  const otherDesignation = await otherDesignationService.create(
    { ...designationInput, name: "Team Lead" },
    "other@example.test"
  );
  const races = await Promise.allSettled(
    ["EMP-RACE-A", "EMP-RACE-B"].map((employeeCode) =>
      service.create({ ...input, employeeCode, userId: 3 }, "admin@example.test")
    )
  );
  assert.equal(races.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(races.filter((result) => result.status === "rejected").length, 1);
  await service.update(created.id, { ...input, name: "Updated employee" }, "admin@example.test");
  await service.setStatus(created.id, "inactive", "admin@example.test");
  assert.equal((await service.get(created.id)).status, "inactive");
  await service.setStatus(created.id, "active", "admin@example.test");
  await service.remove(created.id, "admin@example.test");
  assert.equal((await service.list({ deleted: true })).length, 1);
  await assert.rejects(service.update(created.id, input, "admin@example.test"), /Restore/);
  await assert.rejects(
    service.create({ ...input, userId: null }, "admin@example.test"),
    /code already exists/
  );
  assert.equal(await countEmployeeUserReferences(database, 1), 1);
  await service.restore(created.id, "admin@example.test");
  assert.equal((await service.get(created.id)).status, "inactive");
  await assert.rejects(
    service.forceDelete(created.id, "admin@example.test"),
    /before permanent deletion/
  );

  let authenticated = false;
  let allowed = false;
  await employeeModule.register(app, async () => {
    if (!authenticated) throw AppError.unauthorized("Login required.");
    return {
      database,
      actorEmail: "admin@example.test",
      users,
      authorize: async () => {
        if (!allowed) throw AppError.forbidden("Permission denied.");
      }
    };
  });
  let attendanceAuthenticated = false;
  let attendanceAllowed = false;
  let departmentAuthenticated = false;
  let departmentAllowed = false;
  let designationAuthenticated = false;
  let designationAllowed = false;
  await attendanceModule.register(app, async () => ({
    database: attendanceDatabase,
    actorEmail: "admin@example.test",
    authorize: async () => {
      if (!attendanceAuthenticated) throw AppError.unauthorized("Login required.");
      if (!attendanceAllowed) throw AppError.forbidden("Permission denied.");
    }
  }));
  await departmentModule.register(app, async () => ({
    database: departmentDatabase,
    actorEmail: "admin@example.test",
    authorize: async () => {
      if (!departmentAuthenticated) throw AppError.unauthorized("Login required.");
      if (!departmentAllowed) throw AppError.forbidden("Permission denied.");
    }
  }));
  await designationModule.register(app, async () => ({
    database: designationDatabase,
    actorEmail: "admin@example.test",
    authorize: async () => {
      if (!designationAuthenticated) throw AppError.unauthorized("Login required.");
      if (!designationAllowed) throw AppError.forbidden("Permission denied.");
    }
  }));
  const routes = [
    { method: "GET", url: "/hrms/employees" },
    { method: "GET", url: "/hrms/employees/users" },
    { method: "GET", url: `/hrms/employees/${created.id}` },
    { method: "GET", url: `/hrms/employees/${created.id}/activity` },
    { method: "POST", url: "/hrms/employees", payload: input },
    { method: "PUT", url: `/hrms/employees/${created.id}`, payload: input },
    { method: "POST", url: `/hrms/employees/${created.id}/status`, payload: { status: "active" } },
    { method: "POST", url: `/hrms/employees/${created.id}/restore` },
    { method: "DELETE", url: `/hrms/employees/${created.id}` },
    { method: "DELETE", url: `/hrms/employees/${created.id}/force` }
  ] as const;
  for (const route of routes) assert.equal((await app.inject(route)).statusCode, 401);
  authenticated = true;
  for (const route of routes) assert.equal((await app.inject(route)).statusCode, 403);
  allowed = true;
  assert.equal(
    (
      await app.inject({
        method: "POST",
        url: "/hrms/employees",
        payload: { ...input, employeeCode: "", userId: null }
      })
    ).statusCode,
    400
  );
  const read = await app.inject({ method: "GET", url: `/hrms/employees/${created.id}` });
  assert.equal(read.statusCode, 200, read.body);
  assert.equal(read.json().data.userId, 1);

  const attendanceRoutes = [
    { method: "GET", url: "/hrms/attendance" },
    { method: "GET", url: "/hrms/attendance/employees" },
    { method: "GET", url: "/hrms/attendance/overview" },
    { method: "GET", url: `/hrms/attendance/${attendanceRecord.id}` },
    { method: "POST", url: "/hrms/attendance", payload: attendanceInput },
    { method: "PUT", url: `/hrms/attendance/${attendanceRecord.id}`, payload: attendanceInput },
    { method: "DELETE", url: `/hrms/attendance/${attendanceRecord.id}` },
    { method: "POST", url: `/hrms/attendance/${attendanceRecord.id}/restore` }
  ] as const;
  const departmentRoutes = [
    { method: "GET", url: "/hrms/departments" },
    { method: "GET", url: `/hrms/departments/${department.id}` },
    { method: "GET", url: `/hrms/departments/${department.id}/activity` },
    { method: "POST", url: "/hrms/departments", payload: departmentInput },
    { method: "PUT", url: `/hrms/departments/${department.id}`, payload: departmentInput },
    {
      method: "POST",
      url: `/hrms/departments/${department.id}/status`,
      payload: { status: "active" }
    },
    { method: "DELETE", url: `/hrms/departments/${department.id}` },
    { method: "POST", url: `/hrms/departments/${department.id}/restore` },
    { method: "DELETE", url: `/hrms/departments/${department.id}/force` }
  ] as const;
  const designationRoutes = [
    { method: "GET", url: "/hrms/designations" },
    { method: "GET", url: `/hrms/designations/${designation.id}` },
    { method: "GET", url: `/hrms/designations/${designation.id}/activity` },
    { method: "POST", url: "/hrms/designations", payload: designationInput },
    { method: "PUT", url: `/hrms/designations/${designation.id}`, payload: designationInput },
    {
      method: "POST",
      url: `/hrms/designations/${designation.id}/status`,
      payload: { status: "inactive" }
    },
    { method: "DELETE", url: `/hrms/designations/${designation.id}` },
    { method: "POST", url: `/hrms/designations/${designation.id}/restore` },
    { method: "DELETE", url: `/hrms/designations/${designation.id}/force` }
  ] as const;
  for (const route of attendanceRoutes) assert.equal((await app.inject(route)).statusCode, 401);
  attendanceAuthenticated = true;
  for (const route of attendanceRoutes) assert.equal((await app.inject(route)).statusCode, 403);
  attendanceAllowed = true;
  const futureDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const futureAttendance = await app.inject({
    method: "POST",
    url: "/hrms/attendance",
    payload: { ...attendanceInput, workDate: futureDate }
  });
  assert.equal(futureAttendance.statusCode, 400);
  const attendanceRead = await app.inject({
    method: "GET",
    url: `/hrms/attendance/${attendanceRecord.id}`
  });
  assert.equal(attendanceRead.statusCode, 200, attendanceRead.body);
  const attendanceDuplicate = await app.inject({
    method: "POST",
    url: "/hrms/attendance",
    payload: attendanceInput
  });
  assert.equal(attendanceDuplicate.statusCode, 409);
  const removedAttendance = await app.inject({
    method: "DELETE",
    url: `/hrms/attendance/${attendanceRecord.id}`
  });
  assert.equal(removedAttendance.statusCode, 200, removedAttendance.body);
  const restoredAttendance = await app.inject({
    method: "POST",
    url: `/hrms/attendance/${attendanceRecord.id}/restore`
  });
  assert.equal(restoredAttendance.statusCode, 200, restoredAttendance.body);
  for (const route of departmentRoutes) assert.equal((await app.inject(route)).statusCode, 401);
  departmentAuthenticated = true;
  for (const route of departmentRoutes) assert.equal((await app.inject(route)).statusCode, 403);
  departmentAllowed = true;
  for (const route of designationRoutes) assert.equal((await app.inject(route)).statusCode, 401);
  designationAuthenticated = true;
  for (const route of designationRoutes) assert.equal((await app.inject(route)).statusCode, 403);
  designationAllowed = true;
  const departmentRead = await app.inject({
    method: "GET",
    url: `/hrms/departments/${department.id}`
  });
  assert.equal(departmentRead.statusCode, 200, departmentRead.body);
  assert.equal(departmentRead.json().data.name, "Operations");
  const departmentInvalid = await app.inject({
    method: "POST",
    url: "/hrms/departments",
    payload: { ...departmentInput, name: " " }
  });
  assert.equal(departmentInvalid.statusCode, 400);
  const departmentUpdate = await app.inject({
    method: "PUT",
    url: `/hrms/departments/${department.id}`,
    payload: { ...departmentInput, name: "Operations and Support", description: "Updated" }
  });
  assert.equal(departmentUpdate.statusCode, 200, departmentUpdate.body);
  const departmentDelete = await app.inject({
    method: "DELETE",
    url: `/hrms/departments/${department.id}`
  });
  assert.equal(departmentDelete.statusCode, 200, departmentDelete.body);
  const departmentRestore = await app.inject({
    method: "POST",
    url: `/hrms/departments/${department.id}/restore`
  });
  assert.equal(departmentRestore.statusCode, 200, departmentRestore.body);
  const departmentForForceDelete = await departmentService.create(
    { ...departmentInput, name: "Temporary" },
    "admin@example.test"
  );
  await departmentService.remove(departmentForForceDelete.id, "admin@example.test");
  await departmentService.forceDelete(departmentForForceDelete.id, "admin@example.test");
  assert.ok(
    (await departmentService.activity(departmentForForceDelete.id)).some(
      (item) => item.action === "force-deleted"
    )
  );
  const designationRead = await app.inject({
    method: "GET",
    url: `/hrms/designations/${designation.id}`
  });
  assert.equal(designationRead.statusCode, 200, designationRead.body);
  assert.equal(designationRead.json().data.name, "Team Lead");
  const designationInvalid = await app.inject({
    method: "POST",
    url: "/hrms/designations",
    payload: { ...designationInput, name: " " }
  });
  assert.equal(designationInvalid.statusCode, 400);
  const designationDuplicate = await app.inject({
    method: "POST",
    url: "/hrms/designations",
    payload: { ...designationInput, name: "Team Lead" }
  });
  assert.equal(designationDuplicate.statusCode, 409);
  const designationInactive = await app.inject({
    method: "POST",
    url: `/hrms/designations/${designation.id}/status`,
    payload: { status: "inactive" }
  });
  assert.equal(designationInactive.statusCode, 200, designationInactive.body);
  const designationUpdate = await app.inject({
    method: "PUT",
    url: `/hrms/designations/${designation.id}`,
    payload: { ...designationInput, name: "Senior Team Lead", status: "inactive" }
  });
  assert.equal(designationUpdate.statusCode, 200, designationUpdate.body);
  const designationActive = await app.inject({
    method: "POST",
    url: `/hrms/designations/${designation.id}/status`,
    payload: { status: "active" }
  });
  assert.equal(designationActive.statusCode, 200, designationActive.body);
  const designationDelete = await app.inject({
    method: "DELETE",
    url: `/hrms/designations/${designation.id}`
  });
  assert.equal(designationDelete.statusCode, 200, designationDelete.body);
  const designationRestore = await app.inject({
    method: "POST",
    url: `/hrms/designations/${designation.id}/restore`
  });
  assert.equal(designationRestore.statusCode, 200, designationRestore.body);
  const designationForForceDelete = await designationService.create(
    { ...designationInput, name: "Temporary title" },
    "admin@example.test"
  );
  await designationService.remove(designationForForceDelete.id, "admin@example.test");
  await designationService.forceDelete(designationForForceDelete.id, "admin@example.test");
  assert.ok(
    (await designationService.activity(designationForForceDelete.id)).some(
      (item) => item.action === "force-deleted"
    )
  );
  await service.remove(created.id, "admin@example.test");
  await service.forceDelete(created.id, "admin@example.test");
  assert.equal(await countEmployeeUserReferences(database, 1), 0);
  assert.ok((await service.activity(created.id)).some((event) => event.action === "force-deleted"));
  const persisted = await service.create(
    { ...input, employeeCode: "EMP-PERSIST" },
    "admin@example.test"
  );
  await database.destroy();
  const reopened = open(names[0]!);
  databases[0] = reopened;
  await migrateEmployeeDatabase(reopened);
  await migrateAttendanceDatabase(reopened as unknown as Kysely<AttendanceDatabase>);
  await migrateDepartmentDatabase(reopened as unknown as Kysely<DepartmentDatabase>);
  await migrateDesignationDatabase(reopened as unknown as Kysely<DesignationDatabase>);
  const persistedService = new EmployeeService(
    new EmployeeRepository(reopened),
    userAdapter(reopened)
  );
  assert.equal((await persistedService.get(persisted.id)).employeeCode, "EMP-PERSIST");
  assert.equal(
    (
      await new AttendanceService(
        new AttendanceRepository(reopened as unknown as Kysely<AttendanceDatabase>)
      ).get(attendanceRecord.id)
    ).employeeId,
    attendanceOwner.id
  );
  const persistedDepartmentService = new DepartmentService(
    new DepartmentRepository(reopened as unknown as Kysely<DepartmentDatabase>)
  );
  assert.equal(
    (await persistedDepartmentService.get(department.id)).name,
    "Operations and Support"
  );
  assert.equal((await otherDepartmentService.get(otherDepartment.id)).name, "Operations");
  const persistedDesignationService = new DesignationService(
    new DesignationRepository(reopened as unknown as Kysely<DesignationDatabase>)
  );
  assert.equal((await persistedDesignationService.get(designation.id)).name, "Senior Team Lead");
  assert.equal((await otherDesignationService.get(otherDesignation.id)).name, "Team Lead");
  assert.equal((await otherAttendance.get(otherAttendanceRecord.id)).employeeId, otherEmployee.id);
  console.log(
    "HRMS live database tests passed: employee, attendance, department, and designation migrations; repeat permission seeding; validation; duplicate handling; tenant isolation; API permission gates; lifecycle; audit; and persistence after reconnect."
  );
} finally {
  await app.close();
  for (const database of databases) await database.destroy();
  for (const name of createdNames) {
    assert.match(name, /^codexsun_dev_hrms_[0-9a-f]{10}_[ab]$/);
    await admin.query(`DROP DATABASE \`${name}\``);
  }
  await admin.end();
}
function open(name: string) {
  return new Kysely<EmployeeDatabase & EmployeePermissionDatabase>({
    dialect: new MysqlDialect({ pool: createPool({ ...options, database: name }) })
  });
}
function userAdapter(database: Kysely<EmployeeDatabase>) {
  return {
    list: async () =>
      (
        await sql<{
          id: number;
          name: string;
          email: string;
          status: string;
        }>`SELECT id,name,email,status FROM app_users ORDER BY name`.execute(database)
      ).rows,
    find: async (id: number) =>
      (
        await sql<{
          id: number;
          name: string;
          email: string;
          status: string;
        }>`SELECT id,name,email,status FROM app_users WHERE id=${id}`.execute(database)
      ).rows[0] ?? null
  };
}
