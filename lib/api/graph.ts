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
