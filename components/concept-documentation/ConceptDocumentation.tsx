"use client";

import Link from "next/link";
import { GraphViewport } from "./GraphViewport";
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
  const width = Math.max(900, 150 + (sortedColumns.length - 1) * 340 + 135);
  const positioned = new Map<string, PositionedNode>();

  for (const column of sortedColumns) {
    const nodes = [...(groups.get(column) ?? [])].sort(
      (left, right) => left.hop - right.hop || left.label.localeCompare(right.label),
    );
    nodes.forEach((node, index) => {
      positioned.set(node.slug, {
        ...node,
        x: 150 + (column - columnMin) * 340,
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

type LabelRect = { x1: number; y1: number; x2: number; y2: number };

function overlappingArea(a: LabelRect, b: LabelRect) {
  return Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) *
    Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
}

/** Prefer readable relation labels rather than fixed midpoints that overlap nodes. */
function placeRelationLabels(
  edges: DocumentationStatement[],
  nodes: Map<string, PositionedNode>,
  width: number,
  height: number,
) {
  const placed: LabelRect[] = [];
  const boxes: LabelRect[] = [...nodes.values()].map((node) => ({
    x1: node.x - 102, y1: node.y - 32, x2: node.x + 102, y2: node.y + 32,
  }));
  const result = new Map<string, { x: number; y: number; width: number; anchorX: number; anchorY: number }>();
  for (const edge of edges) {
    const source = nodes.get(edge.source);
    const target = nodes.get(edge.target);
    if (!source || !target) continue;
    const { start, end } = edgeEnds(source, target);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const displayedPredicate = edge.predicate === "subtype_of" ? "⊆ · subtype of" : lineLabel(edge.predicate);
    const labelWidth = Math.max(76, displayedPredicate.length * 7.5 + 25);
    let best: { cost: number; x: number; y: number; anchorX: number; anchorY: number; rect: LabelRect } | null = null;

    for (const fraction of [0.5, 0.33, 0.68, 0.22, 0.8]) {
      for (const offset of [12, -12, 28, -28, 48, -48, 72, -72]) {
        const x = start.x + fraction * dx - dy / length * offset;
        const y = start.y + fraction * dy + dx / length * offset;
        const rect = {
          x1: x - labelWidth / 2 - 4, y1: y - 16,
          x2: x + labelWidth / 2 + 4, y2: y + 16,
        };
        const boundary =
          Math.max(0, -rect.x1) + Math.max(0, rect.x2 - width) +
          Math.max(0, -rect.y1) + Math.max(0, rect.y2 - height);
        const cost = boundary * 200 +
          boxes.reduce((total, box) => total + overlappingArea(rect, box) * 10, 0) +
          placed.reduce((total, box) => total + overlappingArea(rect, box) * 12, 0) +
          Math.abs(offset) * 0.04 + Math.abs(fraction - 0.5);
        if (!best || cost < best.cost) best = { cost, x, y, anchorX: start.x + fraction * dx, anchorY: start.y + fraction * dy, rect };
      }
    }
    if (best) {
      placed.push(best.rect);
      result.set(edge.id, { x: best.x, y: best.y, width: labelWidth, anchorX: best.anchorX, anchorY: best.anchorY });
    }
  }
  return result;
}

function ConnectionDiagram({ data }: { data: ConceptDocumentation }) {
  const [scope, setScope] = useState<"key" | "all">("key");
  // Graph emphasis is visual only. Statement and proof lists remain complete.
  const displayed = useMemo<ConceptDocumentation>(() => {
    if (scope === "all") return data;
    const center = data.concept.slug;
    const directTypes = new Set(
      data.graph.edges
        .filter((edge) => edge.source === center && edge.predicate === "subtype_of")
        .map((edge) => edge.target),
    );
    const edges = data.graph.edges.filter(
      (edge) => edge.source === center || edge.target === center ||
        (edge.predicate === "subtype_of" && directTypes.has(edge.source)),
    );
    const visible = new Set([center, ...edges.flatMap((edge) => [edge.source, edge.target])]);
    return {
      ...data,
      graph: {
        nodes: data.graph.nodes.filter((node) => visible.has(node.slug)),
        edges,
      },
    };
  }, [data, scope]);
  const layout = useMemo(() => layoutGraph(displayed), [displayed]);
  const labels = useMemo(() => placeRelationLabels(
    displayed.graph.edges, layout.positioned, layout.width, layout.height,
  ), [displayed, layout]);
  const rawId = useId();
  const markerId = `concept-arrow-${rawId.replaceAll(":", "")}`;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDepth, setPendingDepth] = useState<number | null>(null);
  const selected = displayed.graph.edges.find((edge) => edge.id === selectedId);

  return (
    <section className={styles.diagram} aria-labelledby="concept-map-title">
      <div className={styles.diagramTop}>
        <div>
          <p className={styles.eyebrow}>Recorded knowledge · directed relations</p>
          <h2 id="concept-map-title">Concept graph</h2>
        </div>
        <nav className={styles.depthNav} aria-label="Graph traversal depth">
          {[1, 2, 3, 4, 5].map((depth) => (
            <Link
              key={depth}
              prefetch={false}
              onClick={() => { if (depth !== data.traversal.depth) setPendingDepth(depth); }}
              href={`/concepts/${encodeURIComponent(data.concept.slug)}?depth=${depth}`}
              className={depth === data.traversal.depth ? styles.depthActive : styles.depthLink}
              aria-current={depth === data.traversal.depth ? "page" : undefined}
            >
              {depth} {depth === 1 ? "hop" : "hops"}
            </Link>
          ))}
        </nav>
      </div>

      <div className={styles.scopeControls} role="group" aria-label="Graph relationships to display">
        <button
          type="button"
          className={scope === "key" ? styles.scopeSelected : styles.scopeOption}
          aria-pressed={scope === "key"}
          onClick={() => setScope("key")}
        >
          Core relationships
        </button>
        <button
          type="button"
          className={scope === "all" ? styles.scopeSelected : styles.scopeOption}
          aria-pressed={scope === "all"}
          onClick={() => setScope("all")}
        >
          All recorded relationships
        </button>
        <span>{displayed.graph.edges.length} of {data.graph.edges.length} assertions shown</span>
      </div>

      {pendingDepth !== null && pendingDepth !== data.traversal.depth ? (
        <div className={styles.depthLoading} role="status" aria-live="polite">
          <span className={styles.loadingLeaf} aria-hidden="true">✳</span>
          Retrieving {pendingDepth}-hop relationships and evidence…
          <span className={styles.loadingTrack} aria-hidden="true"><span /></span>
        </div>
      ) : null}

      <GraphViewport graphWidth={layout.width} graphHeight={layout.height}>
        <svg
          className={styles.graphSvg}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="group"
          aria-label="Directed graph of recorded relationships. Select an arrow to inspect its statement."
        >
          <defs>
            <marker id={markerId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" className={styles.arrowHead} />
            </marker>
          </defs>
          {displayed.graph.edges.map((edge) => {
            const source = layout.positioned.get(edge.source);
            const target = layout.positioned.get(edge.target);
            if (!source || !target) return null;
            const { start, end } = edgeEnds(source, target);
            const predicate = edge.predicate === "subtype_of" ? "⊆ · subtype of" : lineLabel(edge.predicate);
            const placement = labels.get(edge.id);
            if (!placement) return null;
            const labelX = placement.x;
            const labelY = placement.y;
            const labelWidth = placement.width;
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
                {Math.hypot(labelX - placement.anchorX, labelY - placement.anchorY) > 26 ? (
                  <path
                    d={"M" + placement.anchorX + " " + placement.anchorY + " L" + labelX + " " + labelY}
                    className={styles.labelConnector}
                  />
                ) : null}
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
      </GraphViewport>
      {selected ? (
        <div className={styles.inspector} aria-live="polite">
          <span>{selected.source}</span>
          <span className={styles.selectedPredicate}>{selected.predicate === "subtype_of" ? "⊆ · subtype of" : selected.predicate.replaceAll("_", " ")} →</span>
          <span>{selected.target}</span>
          <code className={styles.assertionId} title={"Source relation: " + selected.id}>{selected.id.slice(0, 8)}</code>
        </div>
      ) : null}
      {!displayed.graph.edges.length ? (
        <p className={styles.empty}>No recorded relationships for this concept.</p>
      ) : null}
      {data.traversal.truncated ? (
        <p className={styles.truncated}>
          Bounded graph preview: requested {data.traversal.depth} hops, reached
          {" "}{Math.max(0, ...data.graph.nodes.map((node) => node.hop))} hops within the
          node/edge budget. Select a connected concept to continue exploring from there.
        </p>
      ) : null}
    </section>
  );
}


function EvidenceStatement({
  statement,
  number,
}: {
  statement: DocumentationStatement;
  number: number;
}) {
  return (
    <li id={"assertion-" + statement.id} className={styles.statement}>
      <div className={styles.statementMain}>
        <a className={styles.academicLabel} href={"#assertion-" + statement.id}>
          Observation {String(number).padStart(2, "0")}
        </a>
        <p className={styles.statementText}>{statement.text}</p>
        {statement.predicate === "subtype_of" ? (
          <p className={styles.symbolicStatement}>{statement.source.replaceAll("-", " ")} ⊆ {statement.target.replaceAll("-", " ")}</p>
        ) : null}
        <small className={styles.statementContext}>
          {statement.predicate.replaceAll("_", " ")} · {statement.hop} {statement.hop === 1 ? "hop" : "hops"}
          <span title={"Original relation UUID: " + statement.id}> · <code>{statement.id.slice(0, 8)}</code></span>
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

      {data.characterization ? (
        <section className={styles.characterization} aria-label="Generated definition">
          <div className={styles.definitionTitle}>
            <h2 className={styles.academicHeading}>Definition 01</h2>
            <span title="Automatically composed from provisional V1 graph assertions; not independently verified.">
              Draft · V1
            </span>
          </div>
          <p className={styles.definition}>{data.characterization.text}</p>
        </section>
      ) : null}

      <section className={styles.bodySection} aria-label="Recorded observations">
        <div className={styles.sectionHeading}>
          <h2>Observations</h2>
          <span className={styles.count}>{statements.length} recorded</span>
        </div>
        {firstHand.length ? (
          <ol className={styles.observations}>
            {firstHand.map((statement) => (
              <EvidenceStatement
                key={statement.id}
                statement={statement}
                number={numbered.get(statement.id) ?? 0}
              />
            ))}
          </ol>
        ) : (
          <p className={styles.empty}>No recorded relationships for this concept yet.</p>
        )}
        {extended.length ? (
          <details className={styles.extended}>
            <summary>{extended.length} further observations from connected concepts</summary>
            <ol className={styles.observations}>
              {extended.map((statement) => (
                <EvidenceStatement
                  key={statement.id}
                  statement={statement}
                  number={numbered.get(statement.id) ?? 0}
                />
              ))}
            </ol>
          </details>
        ) : null}
      </section>

      {data.derived_statements.length ? (
        <section className={styles.bodySection} aria-label="Derived propositions">
          <div className={styles.sectionHeading}>
            <h2>Propositions</h2>
            <span className={styles.count}>{data.derived_statements.length} derived</span>
          </div>
          <div className={styles.derivations}>
            {data.derived_statements.map((derived, index) => (
              <article key={derived.target + ":" + derived.rule} className={styles.derivation}>
                <h3 className={styles.academicLabel}>Proposition {String(index + 1).padStart(2, "0")}</h3>
                <p className={styles.propositionText}>{derived.text}</p>
                <div className={styles.proof}>
                  <div className={styles.proofHeading}>
                    <span>Proof {String(index + 1).padStart(2, "0")}</span>
                    <span>Conditional · recorded graph</span>
                  </div>
                  <div className={styles.proofTrace} aria-label={`Steps for proof ${index + 1}`}>
                    {derived.proof.steps.map((step) => (
                      <div
                        key={step.id}
                        className={step.id === derived.proof.conclusion_step_id
                          ? `${styles.proofStep} ${styles.proofStepConclusion}`
                          : styles.proofStep}
                      >
                        <span className={styles.proofStepId}>{step.id}</span>
                        <span className={styles.proofStepStatement}>
                          {step.subject.replaceAll("-", " ")} ⊑ {step.target.replaceAll("-", " ")}
                        </span>
                        {step.assertion_id ? (
                          <a
                            href={"#assertion-" + step.assertion_id}
                            className={styles.proofStepEvidence}
                            title={"Recorded source assertion UUID: " + step.assertion_id}
                          >
                            Obs. {String(numbered.get(step.assertion_id) ?? 0).padStart(2, "0")}
                            <span> · {step.assertion_id.slice(0, 8)}</span>
                          </a>
                        ) : (
                          <span className={styles.proofStepRule}>
                            transitivity ({step.depends_on.join(", ")})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className={styles.proofScopeNote} title="The chain of recorded edges is checked, but the common subtype semantics are not established by the source.">
                    <span aria-hidden="true">∴</span> Deduced under the recorded subtype assumptions; scientific scope not independently established.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
