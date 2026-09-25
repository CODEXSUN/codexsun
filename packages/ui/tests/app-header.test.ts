import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppHeader } from "../src/blocks/app-header/index";

test("app header renders each public arrangement with dynamic content", () => {
  const examples = [
    createElement(AppHeader, {
      breadcrumbs: [{ label: "Workspace" }, { label: "Enquiry" }],
      primaryAction: { label: "New enquiry" },
      variant: "breadcrumb-actions",
    }),
    createElement(AppHeader, {
      filter: createElement("span", null, "Filter"),
      primaryAction: { label: "New enquiry" },
      title: "Enquiry",
      variant: "title-actions",
    }),
    createElement(AppHeader, {
      copyValue: "@codexsun/ui/blocks/app-header",
      resourceLabel: "apps/crm/web/src/enquiry.tsx",
      title: "Enquiry",
      variant: "resource-actions",
    }),
  ];

  const html = examples.map((example) => renderToStaticMarkup(example)).join("");
  assert.match(html, /data-variant="breadcrumb-actions"/);
  assert.match(html, /data-variant="title-actions"/);
  assert.match(html, /data-variant="resource-actions"/);
  assert.match(html, /New enquiry/);
  assert.match(html, /apps\/crm\/web\/src\/enquiry\.tsx/);
  assert.match(html, /Copy resource/);
});
