/**
 * Read-only search of the same pinned public projection used by graph.curricula.live.
 * This is a separate, provisional V1 corpus, not a replacement for the canonical API.
 */
const GRAPH_DATA_URL = "https://graph.curricula.live/graph.json";
const CONCEPT_PREFIX = "https://curricula.live/knowledge/computing/concept/";
const TECHNICAL_KINDS = new Set([
  "operation", "abstractConcept", "softwareArtifact", "protocol",
  "mathematicalStructure", "algorithm", "property", "hardwareArtifact",
  "datatype", "value", "standard", "class",
]);

type AtlasNode = {
  id: string;
  label: string;
  labelRo: string | null;
  kind: string;
  module: string;
  aliases: string[];
};
type AtlasDataset = { nodes: AtlasNode[]; version: string; source: string };

export type AtlasMatch = AtlasNode;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
}

function score(node: AtlasNode, term: string) {
  const labels = [node.label, node.labelRo ?? "", ...(node.aliases ?? [])].map(normalize);
  if (labels.some(label => label === term)) return 3;
  if (labels.some(label => label.startsWith(term))) return 2;
  if (labels.some(label => label.includes(term))) return 1;
  return 0;
}

/** Curriculum outcomes are never concept-search results, even if their labels match. */
export function isAtlasConcept(node: Pick<AtlasNode, "id" | "kind">): boolean {
  return node.id.startsWith(CONCEPT_PREFIX) && TECHNICAL_KINDS.has(node.kind);
}

export function rankAtlasConcepts(nodes: AtlasNode[], query: string, limit = 20): AtlasMatch[] {
  const term = normalize(query);
  if (!term) return [];
  return nodes
    .filter(isAtlasConcept)
    .map(node => ({ node, relevance: score(node, term) }))
    .filter(item => item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || a.node.label.localeCompare(b.node.label))
    .slice(0, limit)
    .map(item => item.node);
}

export async function searchAtlas(query: string, limit = 20): Promise<AtlasMatch[]> {
  const term = normalize(query);
  if (!term) return [];
  const response = await fetch(GRAPH_DATA_URL, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error("Ontology atlas is unavailable");
  const dataset = (await response.json()) as AtlasDataset;
  if (!Array.isArray(dataset.nodes)) throw new Error("Invalid atlas projection");
  return rankAtlasConcepts(dataset.nodes, query, limit);
}
