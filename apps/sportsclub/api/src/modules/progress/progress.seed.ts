import type { Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { ProgressRepository } from "./progress.repository.js";

export async function seedProgressModule(db: Kysely<SportsclubDatabase>) {
  const repository = new ProgressRepository(db);
  const existing = await repository.listByMember("d0010001");
  if (existing.length === 0) {
    await repository.save(
      "f0020001",
      {
        memberUuid: "d0010001",
        masterUuid: "b0010001",
        programUuid: "a0010001",
        stageLevel: "Stage 1 — Fundamental Kaalvari & Basic Rotations",
        score: 95,
        assessment:
          "Demonstrates strong discipline, balance, and clean forward/reverse stick rotation.",
        privateNotes: "Ready for double-stick introductory drills next term.",
        status: "passed",
        revision: 0
      },
      "veerapandian@tenkasisports.test"
    );
  }
}
