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
}

const fromWeb = await fetchText(
  `${web}/concepts/${encodeURIComponent(concept)}?depth=${depth}`,
);
assert(fromWeb.text.includes("Concept graph"), "Web page lacks its graph");
assert(fromWeb.text.includes("Observations"), "Web page lacks the recorded facts");
assert(fromWeb.text.includes("⊆"), "Web page lacks symbolic subtype notation");
assert(fromWeb.text.includes("Graph-derived documentation is temporarily unavailable") === false);
assert(fromWeb.text.includes("Definition 01") === Boolean(document.characterization));
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
