import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Mascot } from "../src/blocks/mascot/index";

test("mascot renders an accessible boop button with both sprite sheets mounted", () => {
  const html = renderToStaticMarkup(
    createElement(Mascot, {
      directions: "/mascots/fox-directions.webp",
      label: "workspace mascot",
      reactions: "/mascots/fox-reactions.webp",
      size: 168,
    }),
  );

  assert.match(html, /aria-label="Boop the workspace mascot"/);
  assert.match(html, /fox-directions\.webp/);
  assert.match(html, /fox-reactions\.webp/);
  assert.match(html, /width:168px/);
});
