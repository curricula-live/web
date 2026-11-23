import type { DocumentationStatement, DocumentationDerivation } from "./graph";

export type ConceptRelationProfile = {
  scope: "retrieved_neighborhood_only";
  source_status: "provisional_legacy_graph";
  retrieval_truncated: boolean;
  direct_recorded_relations: number;
  outgoing_recorded_relations: number;
  incoming_recorded_relations: number;
  by_predicate: Record<string, { outgoing: number; incoming: number }>;
  conditional_subtype_inferences: number;
  scientific_completeness_established: false;
};

/**
 * Derive a view-only profile from the exact relations returned by the current
 * neighborhood request. Never imply that retrieved graph bounds are a full
 * ontology/source audit or that the predicates are scientifically reviewed.
 */
export function recordedRelationProfile(
  slug: string,
  edges: DocumentationStatement[],
  derived: DocumentationDerivation[],
  truncated: boolean,
): ConceptRelationProfile {
  const incident = edges.filter((edge) => edge.source === slug || edge.target === slug);
  const outgoing = incident.filter((edge) => edge.source === slug);
  const incoming = incident.filter((edge) => edge.target === slug);
  const names = [...new Set(incident.map((edge) => edge.predicate))].sort();
  const by_predicate: ConceptRelationProfile["by_predicate"] = {};
  for (const predicate of names) {
    by_predicate[predicate] = {
      outgoing: outgoing.filter((edge) => edge.predicate === predicate).length,
      incoming: incoming.filter((edge) => edge.predicate === predicate).length,
    };
  }
  return {
    scope: "retrieved_neighborhood_only",
    source_status: "provisional_legacy_graph",
    retrieval_truncated: truncated,
    direct_recorded_relations: incident.length,
    outgoing_recorded_relations: outgoing.length,
    incoming_recorded_relations: incoming.length,
    by_predicate,
    conditional_subtype_inferences: derived.length,
    scientific_completeness_established: false,
  };
}
