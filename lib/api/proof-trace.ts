import type { DocumentationProof, DocumentationStatement } from "./graph";

/**
 * Match the API's bounded, provisional subtype witness format.
 * Used only by the temporary preview fallback while production API is 404.
 * Matching graph edges is a rule-path check, NOT a scientific scope review.
 */
export function buildProvisionalSubtypeTrace(
  subject: string,
  target: string,
  premiseIds: string[],
  edges: DocumentationStatement[],
): DocumentationProof {
  const indexed = new Map(edges.map((edge) => [edge.id, edge]));
  if (indexed.size !== edges.length || premiseIds.length < 2 || new Set(premiseIds).size !== premiseIds.length) {
    throw new Error("Duplicate assertion or insufficient subtype premises");
  }

  const steps: DocumentationProof["steps"] = [];
  let current = subject;
  const visited = new Set([subject]);
  for (let index = 0; index < premiseIds.length; index++) {
    const id = premiseIds[index];
    const edge = indexed.get(id);
    if (!edge || edge.predicate !== "subtype_of" || edge.source !== current || visited.has(edge.target)) {
      throw new Error("Noncontinuous, cyclic or non-subtype premise");
    }
    visited.add(edge.target);
    steps.push({
      id: `h${index + 1}`,
      kind: "recorded_premise",
      rule: "recorded_subtype",
      subject: edge.source,
      predicate: "subtype_of",
      target: edge.target,
      assertion_id: id,
      depends_on: [],
    });
    current = edge.target;
  }
  if (current !== target || subject === target) {
    throw new Error("Subtype proof target mismatch");
  }

  for (let index = 1; index < premiseIds.length; index++) {
    const next = indexed.get(premiseIds[index]);
    if (!next) throw new Error("Missing recorded edge");
    steps.push({
      id: `s${index}`,
      kind: "derived_step",
      rule: "subtype_of_transitivity",
      subject,
      predicate: "subtype_of",
      target: next.target,
      assertion_id: null,
      depends_on: [index === 1 ? "h1" : `s${index - 1}`, `h${index + 1}`],
    });
  }

  return {
    format: "provisional-subtype-trace@1",
    scope: "provisional_legacy_graph",
    scope_origin: "assumed_not_in_source",
    rule_application_checked: true,
    source_semantics_verified: false,
    is_formal_proof_certificate: false,
    may_publish: false,
    conclusion_step_id: `s${premiseIds.length - 1}`,
    steps,
  };
}
