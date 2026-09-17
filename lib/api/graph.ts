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
