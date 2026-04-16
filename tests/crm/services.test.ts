import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  assignCrmTask,
  createCrmFollowUpTask,
  getCrmOverviewMetrics,
  listCrmAuditEvents,
  listCrmFollowUpTasks,
  listCrmReminders,
  listCrmTaskAssignments,
  updateCrmReminder,
  updateCrmTaskStatus,
} from "../../apps/crm/src/services/crm-follow-up-service.js"
import { getCrmCustomer360Board } from "../../apps/crm/src/services/crm-customer-360-service.js"
import { getCrmScoreboard } from "../../apps/crm/src/services/crm-scoreboard-service.js"
import { createLead, registerInteraction } from "../../apps/crm/src/services/crm-repository.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

test("CRM follow-up workflow persists assignment history, reminder lifecycle, completion, and audit history", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-crm-services-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const leadId = await createLead(runtime.primary, {
        company_name: "Northwind Labs",
        contact_name: "Asha Raman",
        phone: "+91 9999999999",
        source: "Cold Call",
      })

      const interactionId = await registerInteraction(runtime.primary, {
        lead_id: leadId,
        type: "Cold Call",
        summary: "Customer requested a product callback and pricing note.",
        requires_followup: true,
      })
      const dueAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      const reminderAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      const taskResult = await createCrmFollowUpTask(runtime.primary, {
        leadId,
        interactionId,
        title: "Call customer back with pricing details",
        assigneeUserId: "user-crm-agent",
        assigneeName: "CRM Agent",
        dueAt,
        reminderAt,
        createdByUserId: "user-admin",
        actor: {
          userId: "user-admin",
          displayName: "Admin User",
        },
      })

      let tasks = await listCrmFollowUpTasks(runtime.primary, { leadId })
      let assignments = await listCrmTaskAssignments(runtime.primary, { leadId })
      let reminders = await listCrmReminders(runtime.primary, { leadId })
      let auditEvents = await listCrmAuditEvents(runtime.primary, { leadId })
      const initialMetrics = await getCrmOverviewMetrics(runtime.primary)

      assert.equal(tasks.length, 1)
      assert.equal(tasks[0]?.status, "open")
      assert.equal(assignments.length, 1)
      assert.equal(assignments[0]?.to_assignee_user_id, "user-crm-agent")
      assert.equal(reminders.length, 1)
      assert.equal(reminders[0]?.status, "pending")
      assert.equal(auditEvents.some((item) => item.action === "crm_task_created"), true)
      assert.equal(initialMetrics.totalLeads >= 1, true)
      assert.equal(initialMetrics.openTasks >= 1, true)

      await assignCrmTask(runtime.primary, {
        crmTaskId: taskResult.crmTaskId,
        assigneeUserId: "user-crm-manager",
        assigneeName: "CRM Manager",
        reason: "Escalated callback coverage",
        actor: {
          userId: "user-admin",
          displayName: "Admin User",
        },
      })

      await updateCrmTaskStatus(runtime.primary, {
        crmTaskId: taskResult.crmTaskId,
        status: "completed",
        actor: {
          userId: "user-crm-agent",
          displayName: "CRM Agent",
        },
      })

      await updateCrmReminder(runtime.primary, {
        reminderId: taskResult.reminderId!,
        status: "completed",
        actor: {
          userId: "user-crm-agent",
          displayName: "CRM Agent",
        },
      })

      tasks = await listCrmFollowUpTasks(runtime.primary, { leadId })
      assignments = await listCrmTaskAssignments(runtime.primary, { leadId })
      reminders = await listCrmReminders(runtime.primary, { leadId })
      auditEvents = await listCrmAuditEvents(runtime.primary, { leadId })
      const finalMetrics = await getCrmOverviewMetrics(runtime.primary)
      const customer360 = await getCrmCustomer360Board(runtime.primary, { leadId })
      const scoreboard = await getCrmScoreboard(runtime.primary)
      const leadScore = scoreboard.leadScores.find((item) => item.leadId === leadId)
      const managerScore = scoreboard.ownerLeaderboard.find(
        (item) => item.ownerKey === "user-crm-manager"
      )

      assert.equal(tasks[0]?.status, "completed")
      assert.equal(tasks[0]?.assignee_user_id, "user-crm-manager")
      assert.equal(assignments.length, 2)
      assert.equal(assignments[0]?.to_assignee_user_id, "user-crm-manager")
      assert.equal(assignments[0]?.from_assignee_user_id, "user-crm-agent")
      assert.equal(reminders[0]?.status, "completed")
      assert.equal(auditEvents.some((item) => item.action === "crm_task_reassigned"), true)
      assert.equal(auditEvents.some((item) => item.action === "crm_task_completed"), true)
      assert.equal(finalMetrics.completedTasks >= 1, true)
      assert.equal(customer360.selectedLead?.lead_id, leadId)
      assert.equal(customer360.interactions.length, 1)
      assert.equal(customer360.followUpTasks.length, 1)
      assert.equal(customer360.assignments.length, 2)
      assert.equal(customer360.metrics.completedTaskCount, 1)
      assert.equal(customer360.metrics.interactionCount, 1)
      assert.ok(leadScore)
      assert.equal(leadScore.interactionCount, 1)
      assert.equal(leadScore.completedTaskCount, 1)
      assert.equal(leadScore.overdueReminderCount, 0)
      assert.equal(leadScore.reasons.some((item) => item.includes("Pipeline status")), true)
      assert.ok(managerScore)
      assert.equal(managerScore.completedTaskCount >= 1, true)
      assert.equal(scoreboard.summary.rankedLeadCount >= 1, true)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
