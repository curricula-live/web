"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import type { ConceptDocumentation, DocumentationStatement } from "@/lib/api/graph";
import styles from "./ConceptDocumentation.module.css";

type PositionedNode = {
  slug: string;
  label: string;
  hop: number;
  x: number;
  y: number;
};

function layoutGraph(document: ConceptDocumentation) {
  const center = document.concept.slug;
  const adjacency = new Map<string, DocumentationStatement[]>();
  for (const edge of document.graph.edges) {
    for (const slug of [edge.source, edge.target]) {
      const existing = adjacency.get(slug) ?? [];
      existing.push(edge);
      adjacency.set(slug, existing);
    }
  }

  // Distances are undirected; horizontal layers follow each recorded edge's direction.
  const columns = new Map<string, number>([[center, 0]]);
  const queue = [center];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    for (const edge of adjacency.get(current) ?? []) {
      const other = edge.source === current ? edge.target : edge.source;
      if (columns.has(other)) continue;
      columns.set(other, (columns.get(current) ?? 0) + (edge.source === current ? 1 : -1));
      queue.push(other);
    }
  }

  const groups = new Map<number, ConceptDocumentation["graph"]["nodes"]>();
  for (const node of document.graph.nodes) {
    const column = columns.get(node.slug) ?? 0;
    groups.set(column, [...(groups.get(column) ?? []), node]);
  }
  const sortedColumns = [...groups.keys()].sort((a, b) => a - b);
  const columnMin = sortedColumns[0] ?? 0;
  const longestColumn = Math.max(1, ...[...groups.values()].map((items) => items.length));
  const height = Math.max(430, longestColumn * 90 + 90);
  const width = Math.max(780, sortedColumns.length * 245 + 80);
  const positioned = new Map<string, PositionedNode>();

  for (const column of sortedColumns) {
    const nodes = [...(groups.get(column) ?? [])].sort(
      (left, right) => left.hop - right.hop || left.label.localeCompare(right.label),
    );
    nodes.forEach((node, index) => {
      positioned.set(node.slug, {
        ...node,
        x: 135 + (column - columnMin) * 245,
        y: (index + 1) * (height / (nodes.length + 1)),
      });
    });
  }
  return { positioned, width, height };
}

function edgeEnds(source: PositionedNode, target: PositionedNode) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const segment = (center: PositionedNode, towardX: number, towardY: number) => {
    const vx = towardX - center.x;
    const vy = towardY - center.y;
    const scale = Math.min(101 / Math.max(Math.abs(vx), 0.001), 29 / Math.max(Math.abs(vy), 0.001));
    return { x: center.x + vx * scale, y: center.y + vy * scale };
  };
  const start = segment(source, target.x, target.y);
  const end = segment(target, source.x, source.y);
  return { start, end, dx, dy };
}

function lineLabel(value: string) {
  return value.replaceAll("_", " ");
}

function splitNodeLabel(label: string) {
  if (label.length <= 22) return [label];
  const words = label.split(" ");
  const rows: string[] = [];
  for (const word of words) {
    const last = rows.length - 1;
    if (last >= 0 && (rows[last] + " " + word).length <= 22) rows[last] += " " + word;
    else rows.push(word);
  }
  return rows.slice(0, 3);
}

function ConnectionDiagram({ data }: { data: ConceptDocumentation }) {
  const layout = useMemo(() => layoutGraph(data), [data]);
  const rawId = useId();
  const markerId = `concept-arrow-${rawId.replaceAll(":", "")}`;
  const [selectedId, setSelectedId] = useState<string | null>(data.graph.edges[0]?.id ?? null);
  const selected = data.graph.edges.find((edge) => edge.id === selectedId) ?? data.graph.edges[0];

  return (
    <section className={styles.diagram} aria-labelledby="concept-map-title">
      <div className={styles.diagramTop}>
        <div>
          <p className={styles.eyebrow}>Recorded knowledge · directed relations</p>
          <h2 id="concept-map-title">Concept graph</h2>
        </div>
        <nav className={styles.depthNav} aria-label="Graph traversal depth">
          {[1, 2, 3].map((depth) => (
            <Link
              key={depth}
              href={`/concepts/${encodeURIComponent(data.concept.slug)}?depth=${depth}`}
              className={depth === data.traversal.depth ? styles.depthActive : styles.depthLink}
              aria-current={depth === data.traversal.depth ? "page" : undefined}
            >
              {depth} {depth === 1 ? "hop" : "hops"}
            </Link>
          ))}
        </nav>
      </div>

      <div className={styles.graphScroll}>
        <svg
          className={styles.graphSvg}
          style={{ minWidth: layout.width }}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="group"
          aria-label="Directed graph of recorded relationships. Select an arrow to inspect its statement."
        >
          <defs>
            <marker id={markerId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" className={styles.arrowHead} />
            </marker>
          </defs>
          {data.graph.edges.map((edge, index) => {
            const source = layout.positioned.get(edge.source);
            const target = layout.positioned.get(edge.target);
            if (!source || !target) return null;
            const { start, end, dx, dy } = edgeEnds(source, target);
            const distance = Math.max(1, Math.hypot(dx, dy));
            const labelX = (start.x + end.x) / 2 - (dy / distance) * (index % 2 ? -13 : 13);
            const labelY = (start.y + end.y) / 2 + (dx / distance) * (index % 2 ? -13 : 13);
            const predicate = lineLabel(edge.predicate);
            const labelWidth = Math.min(150, Math.max(76, predicate.length * 7.4 + 18));
            return (
              <g
                key={edge.id}
                className={selected?.id === edge.id ? styles.edgeSelected : styles.edge}
                role="button"
                tabIndex={0}
                aria-label={`${edge.source} ${predicate} ${edge.target}. Inspect assertion.`}
                aria-pressed={selected?.id === edge.id}
                onClick={() => setSelectedId(edge.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedId(edge.id);
                  }
                }}
              >
                <path
                  d={`M${start.x.toFixed(1)} ${start.y.toFixed(1)} L${end.x.toFixed(1)} ${end.y.toFixed(1)}`}
                  className={styles.edgeLine}
                  markerEnd={`url(#${markerId})`}
                />
                <rect
                  x={labelX - labelWidth / 2}
                  y={labelY - 12}
                  width={labelWidth}
                  height={24}
                  rx={5}
                  className={styles.predicateBackground}
                />
                <text x={labelX} y={labelY + 4} textAnchor="middle" className={styles.predicateText}>
                  {predicate}
                </text>
              </g>
            );
          })}
          {[...layout.positioned.values()].map((node) => {
            const rows = splitNodeLabel(node.label);
            const focus = node.slug === data.concept.slug;
            return (
              <a key={node.slug} href={`/concepts/${encodeURIComponent(node.slug)}`}>
                <g className={focus ? styles.focusNode : styles.graphNode} aria-label={`Open ${node.label} concept page`}>
                  <rect x={node.x - 98} y={node.y - 27} width={196} height={54} rx={9} />
                  {rows.map((row, index) => (
                    <text
                      key={index}
                      x={node.x}
                      y={node.y + (index - (rows.length - 1) / 2) * 16 + 4}
                      textAnchor="middle"
                    >
                      {row}
                    </text>
                  ))}
                </g>
              </a>
            );
          })}
        </svg>
      </div>
      {selected ? (
        <div className={styles.inspector} aria-live="polite">
          <div>
            <p className={styles.eyebrow}>Selected assertion · provisional</p>
            <p className={styles.inspectorStatement}>{selected.text}</p>
            <p className={styles.metadata}>
              {selected.source} —{selected.predicate}→ {selected.target}
            </p>
          </div>
          <code className={styles.assertionId} title={selected.id}>{selected.id}</code>
        </div>
      ) : (
        <p className={styles.empty}>No relationships were returned for this concept.</p>
      )}
      {data.traversal.truncated ? (
        <p className={styles.truncated}>This view reached the graph size limit. Additional relationships may exist.</p>
      ) : null}
    </section>
  );
}

function EvidenceStatement({
  statement,
  label,
}: {
  statement: DocumentationStatement;
  label: string;
}) {
  return (
    <li className={styles.statement}>
      <span className={styles.statementLabel}>{label}</span>
      <div>
        <p>{statement.text}</p>
        <small>
          <code>{statement.predicate}</code>
          {" · "}
          {statement.hop} {statement.hop === 1 ? "hop" : "hops"}
          {" · "}
          <span title={statement.id}>Assertion {statement.id.slice(0, 8)}</span>
        </small>
      </div>
    </li>
  );
}

export function ConceptDocumentationView({ data }: { data: ConceptDocumentation }) {
  const statements = data.asserted_statements;
  const firstHand = statements.filter(
    (statement) =>
      statement.source === data.concept.slug || statement.target === data.concept.slug,
  );
  const extended = statements.filter(
    (statement) => statement.source !== data.concept.slug && statement.target !== data.concept.slug,
  );
  const numbered = new Map(statements.map((statement, index) => [statement.id, index + 1]));

  return (
    <div className={styles.documentation}>
      <ConnectionDiagram data={data} />

      <section className={styles.characterization} aria-labelledby="concept-characterization">
        <p className={styles.eyebrow}>Mechanical characterization · provisional</p>
        <h2 id="concept-characterization">What the recorded types establish</h2>
        {data.characterization ? (
          <>
            <p className={styles.definition}>{data.characterization.text}</p>
            <p className={styles.supportNote}>
              Constructed only from direct <code>subtype_of</code> assertions. This is not a
              reviewed scientific definition.
            </p>
          </>
        ) : (
          <p className={styles.empty}>
            No direct subtype-based characterization can be established from this graph.
          </p>
        )}
      </section>

      <p className={styles.provenance}>
        <strong>Legacy graph · provisional.</strong> {data.source.description} The separately
        published V2 knowledge and reviewed scholarly evidence are not inferred from these
        connections.
      </p>

      <section className={styles.bodySection} aria-labelledby="asserted-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Premises · recorded assertions</p>
            <h2 id="asserted-title">What the graph actually says</h2>
          </div>
          <span className={styles.count}>{statements.length} assertions</span>
        </div>
        {firstHand.length ? (
          <ol className={styles.statementList}>
            {firstHand.map((statement) => (
              <EvidenceStatement
                key={statement.id}
                statement={statement}
                label={`h${numbered.get(statement.id)}`}
              />
            ))}
          </ol>
        ) : (
          <p className={styles.empty}>No directly connected assertions were returned.</p>
        )}
        {extended.length ? (
          <details className={styles.extended}>
            <summary>{extended.length} additional assertions from deeper connections</summary>
            <ol className={styles.statementList}>
              {extended.map((statement) => (
                <EvidenceStatement
                  key={statement.id}
                  statement={statement}
                  label={`h${numbered.get(statement.id)}`}
                />
              ))}
            </ol>
          </details>
        ) : null}
      </section>

      <section className={styles.bodySection} aria-labelledby="derived-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Conditional inferences · explicit witnesses</p>
            <h2 id="derived-title">What follows from those premises</h2>
          </div>
          <span className={styles.count}>{data.derived_statements.length} conclusions</span>
        </div>
        {data.derived_statements.length ? (
          <div className={styles.derivations}>
            {data.derived_statements.map((derived, index) => (
              <article key={`${derived.target}:${derived.rule}`} className={styles.derivation}>
                <p className={styles.derivationRule}>Conclusion {index + 1} · {derived.rule}</p>
                <ol>
                  {derived.premise_ids.map((id) => {
                    const premise = statements.find((statement) => statement.id === id);
                    return premise ? (
                      <li key={id}>
                        <span className={styles.premiseLabel}>h{numbered.get(id)}</span>
                        {premise.text}
                      </li>
                    ) : null;
                  })}
                </ol>
                <p className={styles.conclusion}>∴ {derived.text}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            No additional conclusion follows from the currently returned subtype paths.
            Other relation types are not automatically treated as logical implications.
          </p>
        )}
        <p className={styles.supportNote}>
          Rule: {data.derivation_policy.rule_description} These conclusions depend on
          provisional premises; they are not Lean-verified proofs.
        </p>
      </section>
    </div>
  );
}
