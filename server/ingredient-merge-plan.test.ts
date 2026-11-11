import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIngredientMergePlan, type IngredientRow } from "./ingredient-merge-plan";

const row = (id: string, extra: Record<string, unknown> = {}): IngredientRow => ({
  id, name: "Cukier", unit: "kg", cost_per_unit: "4.0000", current_stock: "2.000",
  allergens: ["milk", "nuts"], supplier: null, category_id: "category-a",
  created_at: new Date("2026-01-01"), user_id: "creator-a", ...extra,
});

test("audit-only copies merge deterministically; stock is not summed", () => {
  const a = row("a"), b = row("b", { user_id: "other", created_at: new Date("2026-02-01") });
  const plan = buildIngredientMergePlan([b, a]);
  assert.deepEqual(plan.groups, [{ name: "Cukier", targetId: "a", sourceIds: ["b"] }]);
  assert.equal(plan.removedCount, 1);
  assert.deepEqual(plan.manualIds, []);
  assert.equal(plan.version, buildIngredientMergePlan([a, b]).version);
  assert.equal(a.current_stock, "2.000");
});

test("all business differences remain manual, including unknown future fields", () => {
  for (const extra of [
    { unit: "g" }, { cost_per_unit: "5.0000" }, { current_stock: "3.000" },
    { allergens: [] }, { supplier: "X" }, { category_id: "category-b" },
    { protein_per_100g: "2.00" }, { expiry_date: new Date() }, { future_field: true },
  ]) {
    const plan = buildIngredientMergePlan([row("a"), row("b", extra)]);
    assert.equal(plan.removedCount, 0, JSON.stringify(extra));
    assert.deepEqual(plan.manualIds, ["a", "b"]);
  }
});

test("safe subgroup merges but its differing sibling remains manual", () => {
  const plan = buildIngredientMergePlan([row("a"), row("b"), row("c", { cost_per_unit: "9.0000" })]);
  assert.equal(plan.removedCount, 1);
  assert.deepEqual(plan.manualIds, ["a", "c"]);
});

test("normalizes names and allergen order, never different ingredient names", () => {
  const plan = buildIngredientMergePlan([row("a"), row("b", { name: " cukier ", allergens: ["nuts", "milk"] }), row("c", { name: "Sól" })]);
  assert.equal(plan.removedCount, 1);
  assert.equal(plan.groups[0].targetId, "a");
});

test("metadata edits or added copies invalidate the preview", () => {
  const original = buildIngredientMergePlan([row("a"), row("b")]);
  assert.notEqual(original.version, buildIngredientMergePlan([row("a"), row("b", { current_stock: "1.000" })]).version);
  assert.notEqual(original.version, buildIngredientMergePlan([row("a"), row("b"), row("c")]).version);
});
