import assert from "node:assert/strict";
import { isAtlasConcept, rankAtlasConcepts } from "../lib/ontology/search.ts";
const prefix = "https://curricula.live/knowledge/computing/";
const node = (id, kind, label, extra = {}) => ({ id: prefix + id, kind, label, labelRo: null, module: "source-reviewed", aliases: [], ...extra });
const stack = node("concept/stack", "abstractConcept", "Stack ADT", { labelRo: "Stivă" });
const pop = node("concept/pop", "operation", "Stack pop");
const rows = [
  node("overlay/1", "learningOutcome", "Understand · Stack ADT"),
  node("overlay/2", "learningOutcome", "Stack ADT"),
  node("overlay/3", "competency", "Use · Stack ADT"),
  node("overlay/4", "educationalRequirement", "Stack ADT"),
  node("overlay/5", "knowledgeArea", "Stack ADT"),
  node("concept/incorrect-kind", "learningOutcome", "Stack ADT"),
  node("overlay/incorrect-namespace", "abstractConcept", "Stack ADT"),
  node("concept/unknown-kind", "unknown", "Stack ADT"),
  stack, pop,
];
assert.deepEqual(rankAtlasConcepts(rows, "stack"), [stack, pop]);
assert.deepEqual(rankAtlasConcepts(rows, "stack", 1), [stack]);
assert.deepEqual(rankAtlasConcepts(rows, "stiva"), [stack]);
assert.deepEqual(rankAtlasConcepts(rows, "understand"), []);
assert.deepEqual(rankAtlasConcepts(rows, "  "), []);
assert.ok(isAtlasConcept(node("concept/readability", "property", "Understandability")));
assert.equal(isAtlasConcept(rows[0]), false);
console.log("Verified Atlas concept/curriculum boundary, ranking, limits and Romanian matching.");
