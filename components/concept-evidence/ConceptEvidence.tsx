import Link from "next/link";
import { getConceptEvidence } from "@/lib/api/graph";

async function loadEvidence(slug: string) {
  try { return await getConceptEvidence(slug); } catch { return null; }
}

export async function ConceptEvidence({ slug }: { slug: string }) {
  const data = await loadEvidence(slug);
  if (data) {
    return <section aria-label="Published scholarly evidence">
      <h2>Definitions and source classifications</h2>
      {data.results.length ? data.results.map((row, index) => <article key={`${row.source.id}:${row.evidence.id ?? index}`}>
        <h3>{row.kind === "definition" ? "Reviewed definition" : "Reviewed source mapping"}</h3>
        {row.evidence.text ? <p>{row.evidence.text}</p> : null}
        <p>{row.evidence.author} {row.evidence.license} {row.evidence.relation}</p>
        <p>Reviewed by {row.evidence.review.reviewer} on {row.evidence.review.date}: {row.evidence.review.rationale}</p>
        <p><a href={row.source.url}>{row.source.publisher} · {row.source.version}</a></p>
        <ul>{row.evidence.references.map((r) => <li key={`${r.document_sha256}:${r.locator}`}>{r.locator} · SHA-256: <code>{r.document_sha256}</code></li>)}</ul>
        <Link href={`/atlas?${new URLSearchParams({ source: row.source.id, version: row.source.version, parent: row.evidence.node_id ?? "" })}`}>Explore this source classification</Link>
      </article>) : <p>No reviewed definitions or mappings are published for this concept. Unreviewed associations and editorial drafts are not evidence of official alignment.</p>}
      {data.next_offset !== null ? <p>Additional evidence is available through the paginated API.</p> : null}
      <p><Link href="/atlas">Explore source taxonomies</Link></p>
    </section>;
  } else {
    return <section aria-label="Scholarly evidence unavailable"><h2>Scholarly evidence is temporarily unavailable</h2><p>Definition and classification coverage is unknown.</p></section>;
  }
}
