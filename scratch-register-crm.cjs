const fs = require('fs');
const REGISTRY_FILE = 'apps/cxapp/web/src/desk/desk-registry.ts';
let registry = fs.readFileSync(REGISTRY_FILE, 'utf8');

registry = registry.replace(
  `import { taskWorkspaceItems } from "@task/shared"`,
  `import { taskWorkspaceItems } from "@task/shared"\nimport { crmWorkspaceItems } from "@crm/shared"`
);

// Add CRM Icon and Route
registry = registry.replace(
  `task: Workflow,`,
  `task: Workflow,\n  crm: Users,`
);

registry = registry.replace(
  `import {`,
  `import { Users, PhoneCall, Link2, BookOpen, UserPlus, FileText, Share2, MessageSquare, Plus, CheckCircle, Clock } from "lucide-react"\nimport {`
);

registry = registry.replace(
  `if (app.id === "task") {`,
  `if (app.id === "crm") {
    const crmWorkspaceIconMap: Record<string, any> = {
      leads: Users,
      "cold-calls": PhoneCall,
    }

    return [
      ...crmWorkspaceItems.map((item) => ({
        id: \`\${app.id}-\${item.id}\`,
        name: item.name,
        route: item.route,
        summary: item.summary,
        icon: crmWorkspaceIconMap[item.id] ?? Blocks,
      })),
      ...createTechnicalWorkspaceModules(app, root),
    ]
  }

  if (app.id === "task") {`
);

registry = registry.replace(
  `app.id === "task"`,
  `app.id === "crm"
        ? [
            {
              id: \`\${app.id}-sales\`,
              label: "Sales",
              shared: false,
              items: modules.filter((item) =>
                [
                  \`/dashboard/apps/\${app.id}\`,
                  \`/dashboard/apps/\${app.id}/leads\`,
                  \`/dashboard/apps/\${app.id}/cold-calls\`,
                ].includes(item.route)
              ),
            },
            {
              id: \`\${app.id}-workspace\`,
              label: "Workspace",
              shared: true,
              items: modules.filter((item) =>
                [
                  \`/dashboard/apps/\${app.id}/backend\`,
                  \`/dashboard/apps/\${app.id}/structure\`,
                  \`/dashboard/apps/\${app.id}/web\`,
                  \`/dashboard/apps/\${app.id}/api\`,
                  \`/dashboard/apps/\${app.id}/database\`,
                ].includes(item.route)
              ),
            },
          ]
      : app.id === "task"`
);

fs.writeFileSync(REGISTRY_FILE, registry);
