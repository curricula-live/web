#!/usr/bin/env node
/** Runtime regression tests for typed formal-notation operators.
 *
 * Run with Node.js >=22.18:
 *   node --experimental-strip-types scripts/verify-formal-notation.mjs
 * This is syntax testing, NOT scientific review or theorem certification.
 */
import assert from "node:assert/strict";
import {
  renderFormalExpression, recordedNecessaryConditions, recordedTransitivityFormula,
} from "../lib/api/formal-notation.ts";

const c = (slug) => ({ op: "concept", slug });
const sub = (left, right) => ({ op: "subsumption", left: c(left), right: c(right) });

assert.equal(
  renderFormalExpression({
    op: "subsumption",
    left: c("array"),
    right: { op: "intersection", args: [c("collection"), c("data-structure")] },
  }),
  "array ⊑ (collection ⊓ data structure)",
);
assert.equal(
  renderFormalExpression({
    op: "subsumption",
    left: c("array"),
    right: { op: "union", args: [c("list"), c("sequence")] },
  }),
  "array ⊑ (list ⊔ sequence)",
);
assert.equal(
  renderFormalExpression({
    op: "class_equivalence",
    left: c("A"),
    right: {
      op: "intersection", args: [
        c("B"), { op: "exists", predicate: "uses", filler: c("C") },
      ],
    },
  }),
  "A ≡ (B ⊓ ∃uses.C)",
);
assert.equal(
  renderFormalExpression({
    op: "subsumption",
    left: c("A"),
    right: { op: "forall", predicate: "accessed_by", filler: c("Index") },
  }),
  "A ⊑ ∀accessed_by.Index",
);
assert.equal(
  renderFormalExpression({ op: "not", arg: { op: "and", args: [sub("A", "B"), sub("B", "C")] } }),
  "¬(A ⊑ B ∧ B ⊑ C)",
);
assert.equal(
  renderFormalExpression({
    op: "iff",
    left: { op: "or", args: [sub("A", "B"), sub("C", "D")] },
    right: { op: "implies", left: sub("A", "B"), right: sub("C", "D") },
  }),
  "(A ⊑ B ∨ C ⊑ D) ⇔ ((A ⊑ B) ⇒ (C ⊑ D))",
);

const edges = [
  { id: "uuid-1", source: "array", predicate: "subtype_of", target: "collection" },
  { id: "uuid-2", source: "array", predicate: "subtype_of", target: "data-structure" },
  { id: "uuid-3", source: "array", predicate: "uses", target: "index" },
  { id: "uuid-4", source: "collection", predicate: "subtype_of", target: "data" },
];
const condition = recordedNecessaryConditions("array", edges);
assert.equal(condition?.equivalence_established, false);
assert.deepEqual(condition?.assertion_ids, ["uuid-1", "uuid-2"]);
assert.equal(
  renderFormalExpression(condition.expression),
  "array ⊑ (collection ⊓ data structure)",
);
assert.equal(recordedNecessaryConditions("index", edges), null);

const inference = recordedTransitivityFormula("array", "data", ["uuid-1", "uuid-4"], edges);
assert.equal(inference.expression.op, "implies");
assert.equal(inference.source_semantics_verified, false);
assert.equal(inference.equivalence_established, false);
assert.deepEqual(inference.assertion_ids, ["uuid-1", "uuid-4"]);
assert.equal(
  renderFormalExpression(inference.expression),
  "(array ⊑ collection ∧ collection ⊑ data) ⇒ (array ⊑ data)",
);
assert.throws(() => recordedTransitivityFormula("array", "index", ["uuid-1", "uuid-3"], edges));
assert.throws(() => recordedTransitivityFormula("array", "data", ["uuid-4", "uuid-1"], edges));
console.log("PASS: typed syntax and evidence-linked formal notation (12 assertions)");
