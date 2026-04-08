const fs = require('fs');
const FILE = 'apps/cxapp/web/src/pages/framework-app-workspace-page.tsx';

// Read raw, normalize ALL line endings to \n for searching, keep original for restore
let raw = fs.readFileSync(FILE, 'utf8');
let f = raw.replace(/\r\n/g, '\n');

// Verify the import is already there — add TaskWorkspaceSection if missing
if (!f.includes('TaskWorkspaceSection')) {
  f = f.replace(
    'import { CrmWorkspaceSection } from "@crm/web/src/workspace-sections"',
    'import { TaskWorkspaceSection } from "@task/web/src/workspace-sections"\nimport { CrmWorkspaceSection } from "@crm/web/src/workspace-sections"'
  );
}

// 1. Inject task + crm into the content chain
const OLD_CHAIN = `  const frappeWorkspaceContent =
    app.id === "frappe" ? <FrappeWorkspaceSection sectionId={sectionId} /> : null
  const customWorkspaceContent =
    coreWorkspaceContent ??
    billingWorkspaceContent ??
    demoWorkspaceContent ??
    ecommerceWorkspaceContent ??
    frappeWorkspaceContent`;

const NEW_CHAIN = `  const frappeWorkspaceContent =
    app.id === "frappe" ? <FrappeWorkspaceSection sectionId={sectionId} /> : null
  const taskWorkspaceContent =
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
    crmWorkspaceContent`;

if (!f.includes('taskWorkspaceContent')) {
  if (f.includes(OLD_CHAIN)) {
    f = f.replace(OLD_CHAIN, NEW_CHAIN);
    console.log('✓ Content chain patched');
  } else {
    console.error('✗ Content chain target NOT FOUND');
  }
} else {
  console.log('✓ Content chain already patched');
}

// 2. Inject task + crm into hideWorkspaceHero
const OLD_HIDE = `    ) ||
    (
      app.id === "billing" &&`;

const NEW_HIDE = `    ) ||
    (
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
    ) ||
    (
      app.id === "billing" &&`;

if (!f.includes('app.id === "task" &&')) {
  const idx = f.indexOf(OLD_HIDE);
  if (idx !== -1) {
    f = f.slice(0, idx) + NEW_HIDE + f.slice(idx + OLD_HIDE.length);
    console.log('✓ hideWorkspaceHero patched');
  } else {
    console.error('✗ hideWorkspaceHero target NOT FOUND');
  }
} else {
  console.log('✓ hideWorkspaceHero already patched');
}

// Restore CRLF for consistency with the original file
fs.writeFileSync(FILE, f.replace(/\n/g, '\r\n'));
console.log('Done.');
