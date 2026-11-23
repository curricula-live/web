export type RecordedLogic = { op: "scoped_relation"; symbol: string; subject: { kind: string; id?: string; name?: string }; object: { kind: string; id?: string; name?: string } } | { op: "and"; args: RecordedLogic[] } | { op: "exists"; variable: string; body: RecordedLogic };

export function renderRecordedLogic(expression: RecordedLogic | undefined, labels: Map<string, string>): string {
  if (!expression) return "";
  if (expression.op === "and") return expression.args.map(e => renderRecordedLogic(e, labels)).join(" ∧ ");
  if (expression.op === "exists") return "∃ " + expression.variable + ": " + renderRecordedLogic(expression.body, labels);
  const endpoint = (e: { kind: string; id?: string; name?: string }) => e.kind === "variable" ? e.name : labels.get(e.id ?? "") ?? e.id;
  return expression.symbol + "(" + endpoint(expression.subject) + ", " + endpoint(expression.object) + ")";
}
