const fs = require('fs');
const FILE = 'apps/cxapp/web/src/pages/framework-app-workspace-page.tsx';
let f = fs.readFileSync(FILE, 'utf8');

// 1. Add TaskWorkspaceSection import if missing, then add CrmWorkspaceSection import
if (!f.includes('CrmWorkspaceSection')) {
  f = f.replace(
    `import { TaskWorkspaceSection } from "@task/web/src/workspace-sections"`,
    `import { TaskWorkspaceSection } from "@task/web/src/workspace-sections"\nimport { CrmWorkspaceSection } from "@crm/web/src/workspace-sections"`
  );

  // Fallback: add after FrappeWorkspaceSection if task import wasn't found
  if (!f.includes('CrmWorkspaceSection')) {
    f = f.replace(
      `import { FrappeWorkspaceSection } from "@frappe/web/src/workspace-sections"`,
      `import { FrappeWorkspaceSection } from "@frappe/web/src/workspace-sections"\nimport { CrmWorkspaceSection } from "@crm/web/src/workspace-sections"`
    );
  }
}

// 2. Add taskWorkspaceContent and crmWorkspaceContent, maintain chain
if (!f.includes('crmWorkspaceContent')) {
  f = f.replace(
    `  const taskWorkspaceContent =
    app.id === "task" ? <TaskWorkspaceSection sectionId={sectionId} /> : null
  const customWorkspaceContent =
    coreWorkspaceContent ??
    billingWorkspaceContent ??
    demoWorkspaceContent ??
    ecommerceWorkspaceContent ??
    frappeWorkspaceContent ??
    taskWorkspaceContent`,
    `  const taskWorkspaceContent =
    app.id === "task" ? <TaskWorkspaceSection sectionId={sectionId} /> : null
  const crmWorkspaceContent =
    app.id === "crm" ? <CrmWorkspaceSection sectionId={sectionId} /> : null
  const customWorkspaceContent =
    coreWorkspaceContent ??
    billingWorkspaceContent ??
    demoWorkspaceContent ??
    ecommerceWorkspaceContent ??
    frappeWorkspaceContent ??
    taskWorkspaceContent ??
    crmWorkspaceContent`
  );
}

// 3. Add crm to hideWorkspaceHero
if (!f.includes('app.id === "crm" &&')) {
  f = f.replace(
    `    (
      app.id === "task" &&
      [
        "overview",
        "kanban",
        "routines",
        "templates",
        "performance",
      ].includes(sectionId ?? "overview")
    ) ||`,
    `    (
      app.id === "task" &&
      [
        "overview",
        "kanban",
        "routines",
        "templates",
        "performance",
      ].includes(sectionId ?? "overview")
    ) ||
    (
      app.id === "crm" &&
      [
        "leads",
        "cold-calls",
      ].includes(sectionId ?? "leads")
    ) ||`
  );
}

fs.writeFileSync(FILE, f);
console.log('Done: CrmWorkspaceSection wired into framework page.');
