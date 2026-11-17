#!/usr/bin/env node
/**
 * Verify the paired API + Next.js teacher concept page in a local, isolated
 * development environment. No credentials or production writes.
 *
 * Run with CONCEPT_DOCUMENTATION_REQUIRE_API=1 on the web server; then the
 * page cannot silently fall back to the legacy multi-request preview.
 */
import assert from "node:assert/strict";

const api = (process.env.CONCEPT_API_VERIFY_URL ?? "http://127.0.0.1:8094").replace(/\/$/, "");
const web = (process.env.CONCEPT_WEB_VERIFY_URL ?? "http://127.0.0.1:3040").replace(/\/$/, "");
const concept = process.env.CONCEPT_VERIFY_SLUG ?? "array";
const depth = Number(process.env.CONCEPT_VERIFY_DEPTH ?? "3");

if (!/^[a-z0-9-]+$/.test(concept) || !Number.isInteger(depth) || depth < 1 || depth > 5) {
  throw new Error("Expected a simple concept slug and depth from 1 to 5");
}

const fetchText = async (url) => {
  const start = performance.now();
  const response = await fetch(url, {
    headers: { Accept: "application/json, text/html" },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  assert.equal(response.status, 200, `HTTP ${response.status}: ${url}\n${text.slice(0, 160)}`);
  return { text, milliseconds: Math.round(performance.now() - start) };
};

const fromApi = await fetchText(
  `${api}/v1/concepts/${encodeURIComponent(concept)}/documentation/?depth=${depth}`,
);
const document = JSON.parse(fromApi.text);
assert.equal(document.contract_version, "legacy-concept-documentation@1");
assert.equal(document.concept.slug, concept);
assert.equal(document.traversal.depth, depth);
assert.equal(document.source.is_peer_reviewed, false);
assert.equal(document.source.is_published_v2, false);
assert(Array.isArray(document.graph.nodes));
assert(Array.isArray(document.graph.edges));
const direct = new Map(document.asserted_statements.map((edge) => [edge.id, edge]));
const directClassTypes = [...new Set(document.asserted_statements
  .filter((edge) => edge.source === concept && edge.predicate === "subtype_of" && edge.target !== concept)
  .map((edge) => edge.target))];
if (directClassTypes.length >= 2) {
  assert(document.class_conditions, "Missing necessary class conditions from direct facts");
  assert.equal(document.class_conditions.kind, "necessary_class_condition");
  assert.equal(document.class_conditions.expression.op, "subsumption");
  assert.equal(document.class_conditions.expression.right.op, "intersection");
  assert.equal(document.class_conditions.expression.left.slug, concept);
  assert.equal(document.class_conditions.equivalence_established, false);
  assert.equal(document.class_conditions.source_semantics_verified, false);
  for (const id of document.class_conditions.assertion_ids) {
    const edge = direct.get(id);
    assert(edge && edge.source === concept && edge.predicate === "subtype_of",
      "Class condition does not refer to a direct subtype record");
  }
} else {
  assert.equal(document.class_conditions, null);
}

for (const inference of document.derived_statements) {
  assert.equal(inference.rule, "subtype_of_transitivity");
  assert(inference.premise_ids.length > 1);
  let current = inference.subject;
  for (const uuid of inference.premise_ids) {
    const premise = direct.get(uuid);
    assert(premise, `Proof references a missing assertion ${uuid}`);
    assert.equal(premise.source, current, `Noncontinuous proof at ${uuid}`);
    assert.equal(premise.predicate, "subtype_of");
    current = premise.target;
  }
  assert.equal(current, inference.target);
  const proof = inference.proof;
  assert(proof, "API inference must include typed proof steps");
  assert.equal(proof.format, "provisional-subtype-trace@1");
  assert.equal(proof.scope, "provisional_legacy_graph");
  assert.equal(proof.scope_origin, "assumed_not_in_source");
  assert.equal(proof.source_semantics_verified, false);
  assert.equal(proof.is_formal_proof_certificate, false);
  assert.equal(proof.may_publish, false);
  assert.equal(proof.rule_application_checked, true);
  assert.equal(proof.steps.length, inference.premise_ids.length * 2 - 1);
  const byStep = new Map(proof.steps.map((step) => [step.id, step]));
  for (let i = 0; i < inference.premise_ids.length; i++) {
    const hypothesis = byStep.get(`h${i + 1}`);
    const original = direct.get(inference.premise_ids[i]);
    assert.equal(hypothesis?.kind, "recorded_premise");
    assert.equal(hypothesis?.assertion_id, original.id);
    assert.equal(hypothesis?.subject, original.source);
    assert.equal(hypothesis?.target, original.target);
  }
  for (let i = 1; i < inference.premise_ids.length; i++) {
    const step = byStep.get(`s${i}`);
    assert.equal(step?.kind, "derived_step");
    assert.equal(step?.rule, "subtype_of_transitivity");
    assert.deepEqual(step?.depends_on, [i === 1 ? "h1" : `s${i - 1}`, `h${i + 1}`]);
    assert.equal(step?.assertion_id, null);
    assert.equal(step?.subject, inference.subject);
    assert.equal(step?.target, direct.get(inference.premise_ids[i]).target);
  }
  assert.equal(proof.conclusion_step_id, `s${inference.premise_ids.length - 1}`);
  const formal = inference.formal_rule;
  assert.equal(formal.kind, "conditional_rule_formula");
  assert.equal(formal.expression.op, "implies");
  assert.equal(formal.expression.left.op, "and");
  assert.equal(formal.expression.right.op, "subsumption");
  assert.equal(formal.expression.left.args.length, inference.premise_ids.length);
  assert.deepEqual(formal.assertion_ids, inference.premise_ids);
  assert.equal(formal.equivalence_established, false);
  assert.equal(formal.source_semantics_verified, false);
}

const fromWeb = await fetchText(
  `${web}/concepts/${encodeURIComponent(concept)}?depth=${depth}`,
);
assert(fromWeb.text.includes("Concept graph"), "Web page lacks its graph");
assert(fromWeb.text.includes("Observations"), "Web page lacks the recorded facts");
assert(fromWeb.text.includes("⊑"), "Web page lacks class-subsumption notation");
assert(fromWeb.text.includes("Graph-derived documentation is temporarily unavailable") === false);
assert(fromWeb.text.includes("Definition 01") === Boolean(document.characterization));
if (document.class_conditions) {
  assert(fromWeb.text.includes("⊓"), "Class intersection missing in rendered page");
  assert(fromWeb.text.includes("Necessary class conditions"), "Necessary-conditions label missing");
}
for (const directStatement of document.asserted_statements.filter(
  (edge) => edge.source === concept || edge.target === concept,
)) {
  assert(
    fromWeb.text.includes(directStatement.id.slice(0, 8)),
    `Missing source UUID on rendered page: ${directStatement.id}`,
  );
}
if (document.derived_statements.length) {
  assert(fromWeb.text.includes("Proposition"), "Derived propositions not rendered");
  const htmlWithoutReactComments = fromWeb.text.replace(/<!--.*?-->/g, "");
  assert(htmlWithoutReactComments.includes("Proof 01"), "Ordered proof section missing");
  assert(fromWeb.text.includes("h1"), "Hypothesis step identifier not rendered");
  assert(fromWeb.text.includes("transitivity"), "Derivation rule missing from proof");
  assert(fromWeb.text.includes("Conditional implication"), "Formal conditional label missing");
  assert(fromWeb.text.includes("⇒"), "Implication operator missing");
  assert(fromWeb.text.includes("∧"), "Propositional conjunction operator missing");
  assert(fromWeb.text.includes("scientific scope not independently established"),
    "Provisional source-scope disclosure missing");
}

console.log(JSON.stringify({
  result: "PASS",
  concept,
  depth,
  realApi: { ms: fromApi.milliseconds, nodes: document.graph.nodes.length,
    recordedEdges: document.graph.edges.length,
    derivedStatements: document.derived_statements.length,
    truncated: document.traversal.truncated },
  web: { ms: fromWeb.milliseconds, documented: true, symbolicNotation: true },
}, null, 2));
