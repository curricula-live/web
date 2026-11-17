/** Independent semantic check of the Python-generated, immutable web preview. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(new URL('../lib/logic/checked-examples.json', import.meta.url)));
const ordered = (value) => Array.isArray(value) ? value.map(ordered)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, ordered(value[k])])) : value;
function evaluate(f, a) {
  switch (f.op) {
    case 'atom': assert.equal(typeof a[f.name], 'boolean'); return a[f.name];
    case 'top': return true;
    case 'bottom': return false;
    case 'not': return !evaluate(f.arg, a);
    case 'and': return evaluate(f.left, a) && evaluate(f.right, a);
    case 'or': return evaluate(f.left, a) || evaluate(f.right, a);
    case 'implies': return !evaluate(f.left, a) || evaluate(f.right, a);
    case 'iff': return evaluate(f.left, a) === evaluate(f.right, a);
    default: throw Error(`Unknown logical operator ${f.op}`);
  }
}
function atoms(f, names = new Set()) {
  if (f.op === 'atom') names.add(f.name);
  if (f.arg) atoms(f.arg, names);
  if (f.left) atoms(f.left, names);
  if (f.right) atoms(f.right, names);
  return names;
}
assert.equal(data.contract_version, 'logical-reasoning-preview@1');
assert.equal(data.canonical_knowledge_changed, false);
assert.equal(data.examples.length, 6);
const exampleIds = new Set(data.examples.map(e => e.id));
assert.equal(exampleIds.size, 6);
let steps = 0;
for (const example of data.examples) {
  const cert = example.certificate;
  const report = example.verification;
  const fingerprint = 'sha256:' + createHash('sha256').update(JSON.stringify(ordered(cert))).digest('hex');
  assert.equal(report.proof_fingerprint, fingerprint);
  assert.equal(report.logical_rules_checked, true);
  assert.equal(report.semantic_truth_table_checked, true);
  assert.equal(report.theorem_in_experimental_calculus, true);
  assert.equal(report.canonical_claim_approved, false);
  assert.equal(report.scientific_sources_verified, false);
  assert.deepEqual(report.open_assumption_step_ids, []);
  assert.equal(report.steps.length, cert.steps.length);
  const known = new Map();
  const names = [...new Set(report.steps.flatMap(s => [...atoms(s.formula)]))];
  assert.ok(names.length <= 8);
  for (const [i, step] of report.steps.entries()) {
    assert.equal(step.id, cert.steps[i].id);
    assert.equal(step.rule, cert.steps[i].rule);
    assert.equal(typeof step.rule_label, 'string');
    for (const id of step.premise_step_ids) assert.ok(known.has(id), 'Forward proof reference');
    known.set(step.id, step);
    for (const id of step.open_assumption_step_ids) assert.equal(known.get(id)?.rule, 'assume');
    for (let bits = 0; bits < 2 ** names.length; bits++) {
      const a = Object.fromEntries(names.map((name, j) => [name, Boolean(bits & (1 << j))]));
      const premisesHold = step.open_assumption_step_ids.every(id => evaluate(known.get(id).formula, a));
      assert.ok(!premisesHold || evaluate(step.formula, a), `${example.id}/${step.id}: semantic counterexample`);
    }
    steps++;
  }
  const final = known.get(cert.conclusion_step_id);
  assert.deepEqual(final.formula, cert.goal);
  assert.deepEqual(final.open_assumption_step_ids, []);
  assert.equal(report.conclusion.unicode, final.unicode);
}
assert.equal(data.truth_table.length, 4);
assert.equal(new Set(data.truth_table.map(r => `${r.p}:${r.q}`)).size, 4);
for (const r of data.truth_table) {
  assert.equal(r.not_p, !r.p); assert.equal(r.and, r.p && r.q); assert.equal(r.or, r.p || r.q);
  assert.equal(r.implies, !r.p || r.q); assert.equal(r.iff, r.p === r.q);
}
for (const ids of Object.values(data.concept_examples)) {
  assert.ok(ids.length > 0 && ids.every(id => exampleIds.has(id)));
}
console.log(`Verified ${data.examples.length} logical schemas, ${steps} proof steps and all truth-table rows.`);
