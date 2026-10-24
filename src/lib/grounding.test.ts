import assert from "node:assert/strict";
import { test } from "node:test";
import { groundDraft, type DraftMarket } from "./grounding";
import type { QlooEntity } from "./qloo";

const entity = (id: string, name: string): QlooEntity => ({
  id,
  name,
  type: "urn:entity:artist",
  affinity: 0.8,
  popularity: null,
  tags: [],
});

const seen = new Map([["A1", entity("A1", "Known Artist")]]);

const draft = (entityId: string): DraftMarket => ({
  city: "Tokyo",
  language: "English",
  copy: "copy",
  back_translation: null,
  references: [{ phrase: "like Known Artist", entity_id: entityId, why: "ranks high" }],
  flags: [],
});

test("accepts references Qloo returned and attaches entity details", () => {
  const out = groundDraft([draft("A1")], seen);
  assert.equal(out.ok, true);
  if (out.ok) assert.equal(out.markets[0].references[0].entity.name, "Known Artist");
});

test("rejects references Qloo never returned", () => {
  const out = groundDraft([draft("MADE_UP")], seen);
  assert.equal(out.ok, false);
  if (!out.ok) assert.match(out.unknown[0], /MADE_UP/);
});

test("rejects the whole draft if any market has an unknown reference", () => {
  const out = groundDraft([draft("A1"), { ...draft("NOPE"), city: "Austin" }], seen);
  assert.equal(out.ok, false);
  if (!out.ok) assert.deepEqual(out.unknown, ['Austin: "like Known Artist" (NOPE)']);
});

test("accepts a market with no references", () => {
  const out = groundDraft([{ ...draft("A1"), references: [] }], new Map());
  assert.equal(out.ok, true);
});
