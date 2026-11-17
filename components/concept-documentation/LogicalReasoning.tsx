"use client";

import { useState } from "react";
import { conceptLogicalReasoning } from "@/lib/logic/checked-reasoning";
import styles from "./LogicalReasoning.module.css";

const columns = [
  ["not_p", "¬P"], ["and", "P ∧ Q"], ["or", "P ∨ Q"],
  ["implies", "P ⇒ Q"], ["iff", "P ⇔ Q"],
] as const;

export function LogicalReasoning({ slug }: { slug: string }) {
  const bundle = conceptLogicalReasoning(slug);
  const [selected, setSelected] = useState(0);
  const [p, setP] = useState(true);
  const [q, setQ] = useState(false);
  if (!bundle) return null;
  const example = bundle.examples[Math.min(selected, bundle.examples.length - 1)];
  const report = example.verification;
  const number = String(Math.min(selected, bundle.examples.length - 1) + 1).padStart(2, "0");
  const active = bundle.truth_table.find((row) => row.p === p && row.q === q)!;

  return (
    <section id="logical-reasoning" className={styles.panel} aria-labelledby="logical-reasoning-title">
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Boolean propositions</p><h2 id="logical-reasoning-title">Logical reasoning</h2></div>
        <span className={styles.verified}>Rules + truth tables checked</span>
      </header>
      <p className={styles.scope}>P and Q stand for arbitrary propositions. These are checked logical schemas, separate from the recorded ontology assertions above.</p>

      <section aria-label="Connective semantics" className={styles.semantics}>
        <h3>Connective semantics</h3>
        <p>AND ∧ · OR ∨ · NOT ¬ · IF ⇒ · IFF ⇔</p>
        <div className={styles.assignments} aria-label="Choose truth values">
          <button type="button" aria-pressed={p} onClick={() => setP(!p)}>P = {p ? "true" : "false"}</button>
          <button type="button" aria-pressed={q} onClick={() => setQ(!q)}>Q = {q ? "true" : "false"}</button>
        </div>
        <div className={styles.values} aria-live="polite">
          {columns.map(([key, label]) => <div key={key}><span>{label}</span><strong data-truth={active[key]}>{active[key] ? "true" : "false"}</strong></div>)}
        </div>
        <details className={styles.tableDetails}>
          <summary>Full truth table</summary>
          <div className={styles.tableScroll}><table><caption>Boolean connective values for all four assignments</caption>
            <thead><tr><th scope="col">P</th><th scope="col">Q</th>{columns.map(([key, label]) => <th scope="col" key={key}>{label}</th>)}</tr></thead>
            <tbody>{bundle.truth_table.map((row, i) => <tr key={i} data-active={row.p === p && row.q === q}>
              <th scope="row">{String(row.p)}</th><td>{String(row.q)}</td>{columns.map(([key]) => <td key={key}>{String(row[key])}</td>)}
            </tr>)}</tbody>
          </table></div>
        </details>
        <p className={styles.notation}>⇒ means implication; ⇐ reverses its direction; ⇔ means both directions. ≤ compares ordered values, while ⊑ compares classes.</p>
      </section>

      <nav className={styles.choices} aria-label="Choose a checked proposition">
        {bundle.examples.map((item, i) => <button type="button" key={item.id} aria-pressed={selected === i} onClick={() => setSelected(i)}>{String(i + 1).padStart(2, "0")} · {item.title}</button>)}
      </nav>

      <article className={styles.proposition} aria-label={`Logical proposition ${number}`}>
        <p className={styles.eyebrow}>Logical proposition {number} · {example.title}</p>
        <div role="math" aria-label={report.conclusion.mechanical_text} className={styles.formula}>{report.conclusion.unicode}</div>
        <p>{example.explanation}</p>
        <div className={styles.proofHeading}><h3>Proof {number}</h3><span>Closed · no open assumptions</span></div>
        <ol className={styles.steps} aria-label={`Checked proof ${number}`}>
          {report.steps.map((step) => <li id={`logic-${example.id}-${step.id}`} key={step.id}>
            <a className={styles.stepId} href={`#logic-${example.id}-${step.id}`}>{step.id}</a>
            <div className={styles.stepFormula} role="math" aria-label={step.mechanical_text}>{step.unicode}</div>
            <div className={styles.rule}><strong>{step.rule_label}</strong>
              <span>{step.premise_step_ids.map((id, i) => <span key={`${id}-${i}`}>{i > 0 ? ", " : ""}<a href={`#logic-${example.id}-${id}`}>{id}</a></span>)}</span>
              {step.discharged_assumption_step_id ? <span>Discharge {step.discharged_assumption_step_id}</span> : null}
              <span className={styles.context}>Open: {step.open_assumption_step_ids.join(", ") || "∅"}</span>
            </div>
          </li>)}
        </ol>
        <p className={styles.result}>∴ {report.conclusion.unicode}</p>
        <details className={styles.certificate}>
          <summary>Check details and proof certificate</summary>
          <p>Every step is checked against its rule and exact dependencies. A separate truth-table check covers {report.truth_table_assignments} assignments. This establishes the symbolic deduction, not the truth of an external scientific claim.</p>
          <code className={styles.fingerprint}>{report.proof_fingerprint}</code>
          <pre>{JSON.stringify(example.certificate, null, 2)}</pre>
        </details>
      </article>
    </section>
  );
}
