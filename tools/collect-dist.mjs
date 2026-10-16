#!/usr/bin/env node

import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const rootDist = join(root, "dist");

mkdirSync(rootDist, { recursive: true });
const zetroAgentDist = join(rootDist, "apps", "zetro", "agent");
mkdirSync(zetroAgentDist, { recursive: true });
for (const file of readdirSync(zetroAgentDist))
  if (file.toUpperCase() === "SKILLS.MD" && file !== "SKILLS.md")
    rmSync(join(zetroAgentDist, file));
copyFileSync(join(root, "apps", "zetro", "agent", "SKILLS.md"), join(zetroAgentDist, "SKILLS.md"));

console.log(`Collected build output in ${rootDist}`);
