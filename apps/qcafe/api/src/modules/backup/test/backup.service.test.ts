import assert from "node:assert/strict";
import test from "node:test";
import { ActivityRepository } from "../../foundation/repository/activity.repository.js";
import { createQcafePersistence } from "../../foundation/persistence/qcafe-persistence.js";
import { FoundationSetupRepository } from "../../foundation/repository/foundation-setup.repository.js";
import { FoundationSetupService } from "../../foundation/services/foundation-setup.service.js";
import { createQcafeLifecyclePlans } from "../../../qcafe-lifecycle-plans.js";
import { BackupRepository } from "../repository/backup.repository.js";
import { BackupConflictError, BackupService } from "../services/backup.service.js";

const context = { actorId: "owner-1", correlationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" };
const now = () => new Date("2026-09-24T12:00:00.000Z");

async function setup() {
  const persistence = createQcafePersistence(
    { localDatabasePath: ":memory:", mode: "local" },
    createQcafeLifecyclePlans(),
  );
  await persistence.initialize();
  const database = persistence.database();
  const activity = new ActivityRepository(database, now);
  const foundation = new FoundationSetupService(
    new FoundationSetupRepository(database),
    { localDatabasePath: ":memory:", mode: "local" },
    activity,
    now,
  );
  const created = await foundation.createBusiness(
    {
      businessName: "Q Cafe",
      currency: "INR",
      locationCode: "MAIN",
      locationName: "Main outlet",
      timezone: "Asia/Calcutta",
    },
    context,
  );
  const business = created.businesses[0]!;
  const location = business.locations[0]!;
  const backup = new BackupService(new BackupRepository(database), activity, now);
  return { backup, business, location };
}

test("selects an absolute desktop data folder and rejects relative paths", async () => {
  const { backup, business, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  await assert.rejects(backup.selectDataFolder({ ...scope, folderPath: "data/qcafe" }, context), Error);
  const state = await backup.selectDataFolder({ ...scope, folderPath: "C:\\ProgramData\\Codexsun\\Qcafe" }, context);
  assert.equal(state.dataFolders.length, 1);
  assert.equal(state.dataFolders[0]!.folder_path, "C:\\ProgramData\\Codexsun\\Qcafe");
});

test("a tested backup restores while unverified backups stay unrestorable", async () => {
  const { backup, business, location } = await setup();
  const scope = { businessId: business.id, locationId: location.id };
  const schedule = await backup.createSchedule(
    { ...scope, frequency: "daily", name: "Nightly", retainCount: 7 },
    context,
  );
  await assert.rejects(backup.setScheduleActive(schedule.id, false, context), BackupConflictError);
  let state = await backup.recordBackup(
    {
      ...scope,
      checksum: "sha256:abc",
      fileRef: "backups/nightly-1.zip",
      scheduleId: schedule.id,
      sizeBytes: 1024,
      status: "completed",
    },
    context,
  );
  const backupId = state.backups[0]!.id;
  assert.equal(state.backups[0]!.status, "completed");
  await assert.rejects(backup.submitRestoreCheck(backupId, "failed", undefined, context), BackupConflictError);
  state = await backup.submitRestoreCheck(backupId, "failed", "Checksum mismatch on copy", context);
  assert.equal(state.backups[0]!.status, "completed");
  state = await backup.submitRestoreCheck(backupId, "passed", undefined, context);
  assert.equal(state.backups[0]!.status, "verified");
  assert.equal(state.restoreChecks.length, 2);
  const active = await backup.setScheduleActive(schedule.id, false, context);
  assert.equal(active.id, schedule.id);
});
