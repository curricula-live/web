import { buildProvisionalSubtypeTrace } from "./proof-trace";
import { recordedNecessaryConditions, recordedTransitivityFormula } from "./formal-notation";
import type { FormalProjection } from "./formal-notation";
import { recordedRelationProfile } from "./relation-profile";
import type { ConceptRelationProfile } from "./relation-profile";

const API_BASE_URL = (process.env.API_BASE_URL ?? "https://api.curricula.live").replace(
  /\/$/,
  "",
);

export type SearchCategory = "all" | "concepts" | "connections";

export type ConceptSummary = {
  slug: string;
};

export type RelationSummary = {
  id: string;
  source: string;
  type: string;
  target: string;
};

export type SearchResponse = {
  query: string;
  results: {
    concepts?: ConceptSummary[];
    connections?: RelationSummary[];
  };
};

export type ConceptDetail = {
  slug: string;
};

export type ConceptNeighborhood = {
  concept: ConceptSummary;
  outgoing: RelationSummary[];
  incoming: RelationSummary[];
};

export type DocumentationStatement = {
  id: string;
  source: string;
  predicate: string;
  target: string;
  text: string;
  hop: number;
  status: "provisional_legacy_graph";
};

export type DocumentationProofStep = {
  id: string;
  kind: "recorded_premise" | "derived_step";
  rule: "recorded_subtype" | "subtype_of_transitivity";
  subject: string;
  predicate: "subtype_of";
  target: string;
  assertion_id: string | null;
  depends_on: string[];
};

export type DocumentationProof = {
  format: "provisional-subtype-trace@1";
  scope: "provisional_legacy_graph";
  scope_origin: "assumed_not_in_source";
  rule_application_checked: true;
  source_semantics_verified: false;
  is_formal_proof_certificate: false;
  may_publish: false;
  conclusion_step_id: string;
  steps: DocumentationProofStep[];
};

export type DocumentationDerivation = {
  subject: string;
  predicate: "subtype_of";
  target: string;
  text: string;
  rule: "subtype_of_transitivity";
  premise_ids: string[];
  proof: DocumentationProof;
  formal_rule: FormalProjection;
  status: "conditional_provisional_inference";
};

export type ConceptDocumentation = {
  contract_version: "legacy-concept-documentation@1";
  concept: { slug: string; label: string };
  source: {
    kind: "legacy_concept_relation_tables";
    status: "provisional_legacy_graph";
    is_published_v2: false;
    is_peer_reviewed: false;
    description: string;
  };
  traversal: {
    depth: number;
    max_depth: number;
    max_nodes: number;
    max_edges: number;
    truncated: boolean;
  };
  graph: {
    nodes: { slug: string; label: string; hop: number }[];
    edges: DocumentationStatement[];
  };
  characterization: {
    text: string;
    assertion_ids: string[];
    status: "provisional_legacy_graph";
    method: "direct_conjunctive_assertions";
  } | null;
  asserted_statements: DocumentationStatement[];
  class_conditions: FormalProjection | null;
  derived_statements: DocumentationDerivation[];
  relation_profile: ConceptRelationProfile;
  derivation_policy: {
    implemented_rules: string[];
    rule_description: string;
    conditional_on_premises: true;
    is_formal_proof_certificate: false;
    uses_implies_prerequisite: false;
    uses_implies_indexed_access: false;
  };
};

export class GraphApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GraphApiError";
    this.status = status;
  }
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new GraphApiError(`Graph API request failed with ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

export function searchGraph(query: string, category: SearchCategory = "all") {
  const params = new URLSearchParams({
    q: query,
    category,
  });

  return getJson<SearchResponse>(`/v1/search/?${params.toString()}`);
}

export function getConceptDirectory() {
  return getJson<{ results: ConceptSummary[] }>("/v1/concepts/");
}

export function getConcept(slug: string) {
  return getJson<ConceptDetail>(`/v1/concepts/${encodeURIComponent(slug)}/`);
}

export function getConceptNeighborhood(slug: string) {
  return getJson<ConceptNeighborhood>(
    `/v1/concepts/${encodeURIComponent(slug)}/neighborhood/`,
  );
}

export type ScholarlySource = {
  id: string; version: string; publisher: string; url: string;
  license: string; sha256: string; retrieved_on: string;
};
export type ScholarlyMapping = {
  canonical_slug: string; canonical_uuid: string; node_id: string; relation: string;
  review: { reviewer: string; date: string; rationale: string };
  references: { document_sha256: string; locator: string }[];
};
export type ScholarlyNode = {
  id: string; label: string; kind: string; parents: string[]; locator: string;
  mapping_status: string; mappings: ScholarlyMapping[]; source: ScholarlySource;
  core?: string; grade_band?: string; practices?: string[];
};
export type ScholarlyEvidence = {
  kind: "mapping" | "definition"; source: ScholarlySource;
  evidence: ScholarlyMapping & { id?: string; text?: string; author?: string; license?: string; revision?: number };
};
export type BoundedResults<T> = { count: number; limit: number; offset: number; next_offset: number | null; results: T[] };
export function getScholarlySources() {
  return getJson<BoundedResults<{ source_id: string; version: string; source: ScholarlySource; completeness: string }>>("/v1/scholarly/sources/");
}
export function getScholarlyNodes(source: string, version: string, parent = "", offset = "0", node?: string) {
  const query = new URLSearchParams({ parent, offset });
  if (node) query.set("node", node);
  return getJson<BoundedResults<ScholarlyNode>>(`/v1/scholarly/sources/${encodeURIComponent(source)}/${encodeURIComponent(version)}/nodes/?${query}`);
}
export function getConceptEvidence(slug: string) {
  return getJson<BoundedResults<ScholarlyEvidence>>(`/v1/concepts/${encodeURIComponent(slug)}/evidence/`);
}

/**
 * Temporary migration bridge for a frontend preview that still reads the
 * production legacy /neighborhood/ endpoint. The canonical implementation
 * lives in curricula-live/api; remove this bridge when both deployments share
 * the documentation route. Nothing here imports archived V1 as reviewed V2.
 */
async function legacyNeighborhoodDocumentation(slug: string, depth: number): Promise<ConceptDocumentation> {
  const MAX_NODES = 80;
  const MAX_EDGES = 160;
  const MAX_FETCHES = 48;
  const CONCURRENCY = 8;
  const distances = new Map<string, number>([[slug, 0]]);
  const queue: string[] = [slug];
  const seen = new Set<string>();
  const edges: DocumentationStatement[] = [];
  let truncated = false;

  const label = (value: string) =>
    value.replaceAll("-", " ").replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());
  const article = (value: string) => /^[aeiou]/i.test(value) ? "an" : "a";
  const phrase = (source: string, predicate: string, target: string): string => {
    const left = label(source);
    const right = label(target).toLowerCase();
    if (predicate === "subtype_of") return `${left} is ${article(right)} ${right}.`;
    if (predicate === "part_of") return `${left} is part of ${right}.`;
    if (predicate === "uses") return `${left} uses ${right}.`;
    if (predicate === "prerequisite_of") return `${left} is a recorded prerequisite of ${right}.`;
    return `${left} —${predicate}→ ${label(target)}.`;
  };

  // Parallel batches replace the original one-request-per-neighbor waterfall.
  // Keep a strict fetch budget: five-hop graphs must never trigger hundreds
  // of requests against the public production neighborhood endpoint.
  let expanded = 0;
  for (let index = 0; index < queue.length;) {
    const batch = queue.slice(index, index + CONCURRENCY);
    index += batch.length;
    const frontier = batch.filter((node) => (distances.get(node) ?? 0) < depth);
    const available = Math.max(0, MAX_FETCHES - expanded);
    if (frontier.length > available) truncated = true;
    const eligible = frontier.slice(0, available);
    if (!eligible.length) continue;
    expanded += eligible.length;

    const neighborhoods = await Promise.all(eligible.map(async (node) => ({
      node, neighborhood: await getConceptNeighborhood(node),
    })));
    for (const { node: current, neighborhood } of neighborhoods) {
      const rank = (row: RelationSummary) =>
        row.source === current && row.type === "subtype_of" ? 0 :
        row.source === current ? 1 : row.type === "subtype_of" ? 2 : 3;
      const rows = [...neighborhood.outgoing, ...neighborhood.incoming].sort(
        (a, b) => rank(a) - rank(b) ||
          a.source.localeCompare(b.source) || a.type.localeCompare(b.type) ||
          a.target.localeCompare(b.target) || a.id.localeCompare(b.id),
      );
      if (rows.length > MAX_EDGES) truncated = true;
      for (const row of rows.slice(0, MAX_EDGES + 1)) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      if (edges.length >= MAX_EDGES) {
        truncated = true;
        break;
      }
      const neighbor = row.source === current ? row.target : row.source;
      if (!distances.has(neighbor)) {
        if (distances.size >= MAX_NODES) {
          truncated = true;
          continue;
        }
        distances.set(neighbor, (distances.get(current) ?? 0) + 1);
        queue.push(neighbor);
      }
      if (!distances.has(row.source) || !distances.has(row.target)) {
        truncated = true;
        continue;
      }
      edges.push({
        id: row.id,
        source: row.source,
        predicate: row.type,
        target: row.target,
        hop: Math.max(distances.get(row.source) ?? 0, distances.get(row.target) ?? 0),
        status: "provisional_legacy_graph",
        text: phrase(row.source, row.type, row.target),
      });
      }
    }
  }

  edges.sort((a, b) =>
    a.hop - b.hop || a.source.localeCompare(b.source)
    || a.predicate.localeCompare(b.predicate) || a.target.localeCompare(b.target)
    || a.id.localeCompare(b.id),
  );

  const directTypes = edges.filter(
    (edge) => edge.source === slug && edge.predicate === "subtype_of",
  ).sort((a, b) => a.target.localeCompare(b.target));
  const bySource = new Map<string, DocumentationStatement[]>();
  for (const edge of edges.filter((e) => e.predicate === "subtype_of")) {
    bySource.set(edge.source, [...(bySource.get(edge.source) ?? []), edge]);
  }
  for (const value of bySource.values()) {
    value.sort((a, b) => a.target.localeCompare(b.target) || a.id.localeCompare(b.id));
  }

  const direct = new Set(directTypes.map((edge) => edge.target));
  const visited = new Set([slug]);
  const candidates: { node: string; path: string[]; nodes: string[] }[] =
    [{ node: slug, path: [], nodes: [slug] }];
  const derived: DocumentationDerivation[] = [];
  for (let index = 0; index < candidates.length; index++) {
    const current = candidates[index];
    if (current.path.length >= depth) continue;
    for (const edge of bySource.get(current.node) ?? []) {
      if (visited.has(edge.target) || current.nodes.includes(edge.target)) continue;
      visited.add(edge.target);
      const path = [...current.path, edge.id];
      candidates.push({ node: edge.target, path, nodes: [...current.nodes, edge.target] });
      if (path.length > 1 && !direct.has(edge.target)) {
        derived.push({
          subject: slug, predicate: "subtype_of", target: edge.target,
          text: phrase(slug, "subtype_of", edge.target),
          rule: "subtype_of_transitivity", premise_ids: path,
          proof: buildProvisionalSubtypeTrace(slug, edge.target, path, edges),
          formal_rule: recordedTransitivityFormula(slug, edge.target, path, edges),
          status: "conditional_provisional_inference",
        });
      }
    }
  }

  const subtypeNames = directTypes.slice(0, 4).map((edge) => {
    const target = label(edge.target).toLowerCase();
    return `${article(target)} ${target}`;
  });
  const description: string[] = [];
  const supporting: string[] = directTypes.slice(0, 4).map((edge) => edge.id);
  if (subtypeNames.length) {
    const category = subtypeNames.length === 1
      ? subtypeNames[0]
      : `${subtypeNames.slice(0, -1).join(", ")} and ${subtypeNames.at(-1)}`;
    description.push(`${label(slug)} is ${category}.`);
    for (const [predicate, verb] of [
      ["uses", "uses"], ["processes", "processes"],
      ["produces", "produces"], ["represents", "represents"],
    ]) {
      const group = edges.filter((edge) =>
        edge.source === slug && edge.predicate === predicate,
      ).sort((a, b) => a.target.localeCompare(b.target)).slice(0, 2);
      if (group.length) {
        description.push(`It ${verb} ${group.map((edge) => label(edge.target).toLowerCase()).join(" and ")}.`);
        supporting.push(...group.map((edge) => edge.id));
      }
    }
    const parts = edges.filter((edge) =>
      edge.target === slug && edge.predicate === "part_of",
    ).sort((a, b) => a.source.localeCompare(b.source)).slice(0, 2);
    for (const part of parts) {
      description.push(part.text);
      supporting.push(part.id);
    }
  }

  return {
    contract_version: "legacy-concept-documentation@1",
    concept: { slug, label: label(slug) },
    source: {
      kind: "legacy_concept_relation_tables",
      status: "provisional_legacy_graph",
      is_published_v2: false,
      is_peer_reviewed: false,
      description:
        "Read-only compatibility projection of the existing public legacy neighborhood API; " +
        "this is not reviewed V2 scientific knowledge.",
    },
    traversal: {
      depth, max_depth: 5, max_nodes: MAX_NODES, max_edges: MAX_EDGES, truncated,
    },
    graph: {
      nodes: [...distances].sort(
        (a, b) => a[1] - b[1] || a[0].localeCompare(b[0]),
      ).map(([name, hop]) => ({ slug: name, label: label(name), hop })),
      edges,
    },
    characterization: subtypeNames.length ? {
      text: description.join(" "),
      assertion_ids: supporting,
      status: "provisional_legacy_graph",
      method: "direct_conjunctive_assertions",
    } : null,
    asserted_statements: edges,
    class_conditions: recordedNecessaryConditions(slug, edges),
    derived_statements: derived,
    relation_profile: recordedRelationProfile(slug, edges, derived, truncated),
    derivation_policy: {
      implemented_rules: ["subtype_of_transitivity"],
      rule_description: "If A subtype_of B and B subtype_of C, infer A subtype_of C.",
      conditional_on_premises: true,
      is_formal_proof_certificate: false,
      uses_implies_prerequisite: false,
      uses_implies_indexed_access: false,
    },
  };
}

export async function getConceptDocumentation(slug: string, depth = 2) {
  const params = new URLSearchParams({ depth: String(depth) });
  try {
    return await getJson<ConceptDocumentation>(
      `/v1/concepts/${encodeURIComponent(slug)}/documentation/?${params.toString()}`,
    );
  } catch (error) {
    // Integration tests, development and eventual API-backed deployments can
    // fail closed instead of silently returning to the slow, N-request bridge.
    // The legacy bridge stays enabled for the isolated web Vercel preview
    // until the paired development API is publicly routable.
    if (process.env.CONCEPT_DOCUMENTATION_REQUIRE_API === "1") throw error;
    if (!(error instanceof GraphApiError && error.status === 404)) throw error;
    return legacyNeighborhoodDocumentation(slug, depth);
  }
}
