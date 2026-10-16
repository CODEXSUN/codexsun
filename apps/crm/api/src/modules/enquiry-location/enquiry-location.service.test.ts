import assert from "node:assert/strict";
import { test } from "node:test";
import { EnquiryLocationService } from "./enquiry-location.service.js";
import type { EnquiryLocationRepository } from "./enquiry-location.repository.js";

const enquiry = { assignedUserId: 12, createdBy: "creator@example.com" };

test("assigned user can save multiple location captures for one enquiry", async () => {
  const saved: number[] = [];
  const repository = {
    create: async (id: number) => {
      saved.push(id);
      return { id: saved.length };
    }
  } as unknown as EnquiryLocationRepository;
  const service = new EnquiryLocationService(repository, "worker@example.com", 12, false);
  const input = {
    latitude: 13.0827,
    longitude: 80.2707,
    accuracyMeters: 8,
    capturedAt: "2026-10-14T12:00:00.000Z"
  };

  await service.create(40, 5, enquiry, input);
  await service.create(40, 5, enquiry, { ...input, latitude: 13.0828 });

  assert.deepEqual(saved, [40, 40]);
});

test("an unassigned user cannot log an enquiry location", async () => {
  const repository = {
    create: async () => assert.fail("must not write")
  } as unknown as EnquiryLocationRepository;
  const service = new EnquiryLocationService(repository, "other@example.com", 13, false);

  await assert.rejects(
    service.create(40, 5, enquiry, {
      latitude: 13.0827,
      longitude: 80.2707,
      accuracyMeters: null,
      capturedAt: "2026-10-14T12:00:00.000Z"
    }),
    /assigned to you/i
  );
});
