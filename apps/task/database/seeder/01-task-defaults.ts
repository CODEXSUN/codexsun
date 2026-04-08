import { replaceJsonStoreRecords } from "../../../framework/src/runtime/database/process/json-store.js"
import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"

import { defaultTaskBoards, defaultTaskBoardStages, defaultTaskTemplates } from "../../src/data/task-seed.js"

import { taskTableNames } from "../table-names.js"

export const taskDefaultsSeeder = defineDatabaseSeeder({
  id: "task:foundation:01-task-defaults",
  appId: "task",
  moduleKey: "foundation",
  name: "Seed task application baseline defaults",
  order: 10,
  run: async ({ database }) => {
    // 1. Seed Boards
    await replaceJsonStoreRecords(
      database,
      taskTableNames.boards,
      defaultTaskBoards.map((board, i) => ({
        id: board.id,
        moduleKey: "operations",
        sortOrder: i,
        payload: board,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
      }))
    )

    // 2. Seed Kanban Stages (Columns)
    await replaceJsonStoreRecords(
      database,
      taskTableNames.boardStages,
      defaultTaskBoardStages.map((stage, i) => ({
        id: stage.id,
        moduleKey: "operations",
        sortOrder: i * 10,
        payload: stage,
        createdAt: stage.createdAt,
        updatedAt: stage.updatedAt,
      }))
    )

    // 3. Seed Execution Templates
    await replaceJsonStoreRecords(
      database,
      taskTableNames.templates,
      defaultTaskTemplates.map((template, i) => ({
        id: template.id,
        moduleKey: "operations",
        sortOrder: i * 10,
        payload: template,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      }))
    )
  },
})
