import Link from "next/link";
import { SiteHeader } from "@/components/site-header/SiteHeader";
import { SiteFooter } from "@/components/site-footer/SiteFooter";
import { getScholarlySources, getScholarlyNodes } from "@/lib/api/graph";
import styles from "./page.module.css";

type Query = { source?: string; version?: string; parent?: string; offset?: string };
function href(source: string, version: string, parent = "", offset = "0") {
  return `/atlas?${new URLSearchParams({ source, version, parent, offset })}`;
}

async function loadAtlas(query: Query) {
  try {
    const sources = await getScholarlySources();
    const selected = query.source
      ? sources.results.find((s) => s.source_id === query.source && s.version === query.version)
      : sources.results.find((s) => s.source_id === "acm-ccs") ?? sources.results[0];
    const [nodes, parent] = selected ? await Promise.all([
      getScholarlyNodes(selected.source_id, selected.version, query.parent, query.offset),
      query.parent ? getScholarlyNodes(selected.source_id, selected.version, "", "0", query.parent) : Promise.resolve(null),
    ]) : [null, null];
    return { sources, selected, nodes, parent };
  } catch {
    return null;
  }
}

export default async function Atlas({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  let content;
  const loaded = await loadAtlas(query);
  if (!loaded) {
    content = <p role="status">Source classifications are temporarily unavailable. No inference about coverage can be made from this response.</p>;
  } else {
    const { sources, selected, nodes, parent } = loaded;
    if (query.source && !selected) {
      content = <p role="status">This source version has no published release. <Link href="/atlas">View available sources</Link>.</p>;
    } else if (!selected) {
      content = <section><h2>No reviewed source taxonomy is published yet</h2><p>ACM CCS, CS2023 and CSTA projections will appear after source access, licensing and import review are complete.</p><p>Canonical graph relationships do not establish official classification or curriculum alignment.</p></section>;
    } else if (nodes) {
      const parentNode = parent?.results[0];
      content = <>
        <nav aria-label="Source projections" className={styles.sources}>
          {sources.results.map((s) => <Link key={`${s.source_id}:${s.version}`} href={href(s.source_id, s.version)} aria-current={s === selected ? "page" : undefined}>{s.source_id} · {s.version}</Link>)}
        </nav>
        <section className={styles.provenance}>
          <h2>{selected.source_id} · {selected.version}</h2>
          <p>{selected.source.publisher} · {selected.completeness} import</p>
          <p><a href={selected.source.url}>Authoritative source</a> · {selected.source.license} · retrieved {selected.source.retrieved_on}</p>
          <details><summary>Document checksum</summary><code>{selected.source.sha256}</code></details>
          <p>Source hierarchy is distinct from the canonical graph. Linked concepts represent reviewed Curricula.live mappings.</p>
        </section>
        <nav aria-label="Hierarchy navigation">
          <Link href={href(selected.source_id, selected.version)}>Source roots</Link>
          {parentNode ? <><h3>{parentNode.label}</h3>{parentNode.parents.map((id) => <p key={id}><Link href={href(selected.source_id, selected.version, id)}>Parent: {id}</Link></p>)}</> : query.parent ? <p>Parent identifier not found in this release.</p> : null}
        </nav>
        <ul className={styles.nodes}>
          {nodes.results.map((node) => <li key={node.id}>
            <h3><Link href={href(selected.source_id, selected.version, node.id)}>{node.label}</Link></h3>
            <p>{node.kind} · {node.id}{node.core ? ` · ${node.core}` : ""}</p>
            <p>Source locator: {node.locator}</p>
            {node.grade_band ? <p>Grade band: {node.grade_band} · Practices: {node.practices?.join(", ")}</p> : null}
            {node.mappings.length ? node.mappings.map((m) => <p key={`${m.canonical_uuid}:${m.relation}`}><Link href={`/concepts/${encodeURIComponent(m.canonical_slug)}?view=curriculum`}>{m.canonical_slug}</Link> · {m.relation} · reviewed by {m.review.reviewer} on {m.review.date}</p>) : <p>No published canonical mapping. Candidate or private review status is unknown.</p>}
          </li>)}
        </ul>
        {!nodes.results.length ? <p>No children are recorded for this selection.</p> : null}
        {nodes.next_offset !== null ? <Link href={href(selected.source_id, selected.version, query.parent, String(nodes.next_offset))}>Next entries</Link> : null}
      </>;
    }
  }
  return <><SiteHeader /><main className={styles.main}><h1>Scholarly Atlas</h1><p>Explore source classifications and reviewed evidence.</p>{content}</main><SiteFooter /></>;
}
