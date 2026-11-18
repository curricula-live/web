/** Typed logical notation for provisional concept-page expressions.
 *
 * Class constructors (⊓, ⊔, ¬, ∃, ∀, ⊑, ≡) and propositional
 * connectives (∧, ∨, ¬, ⇒, ⇔) have different syntactic sorts.
 * Only expressions backed by recorded relation UUIDs should be emitted by
 * a concept API. The renderer does not confer scientific authority.
 */

export type FormalClassExpression =
  | { op: "concept"; slug: string }
  | { op: "intersection" | "union"; args: FormalClassExpression[] }
  | { op: "class_not"; arg: FormalClassExpression }
  | { op: "exists" | "forall"; predicate: string; filler: FormalClassExpression };

export type FormalProposition =
  | { op: "subsumption" | "class_equivalence"; left: FormalClassExpression; right: FormalClassExpression }
  | { op: "and" | "or"; args: FormalProposition[] }
  | { op: "not"; arg: FormalProposition }
  | { op: "implies" | "iff"; left: FormalProposition; right: FormalProposition };

export type FormalProjection = {
  kind: "necessary_class_condition" | "conditional_rule_formula";
  expression: FormalProposition;
  assertion_ids: string[];
  status: "conditional_on_recorded_assertions";
  source_semantics_verified: false;
  equivalence_established: false;
  may_publish: false;
  scope_origin: "assumed_not_in_source";
  rule?: "subtype_of_transitivity";
};

function conceptLabel(slug: string) {
  return slug.replaceAll("-", " ").replaceAll("_", " ");
}

function classPriority(e: FormalClassExpression): number {
  if (e.op === "union") return 1;
  if (e.op === "intersection") return 2;
  if (e.op === "class_not") return 3;
  return 4;
}

function renderClass(expr: FormalClassExpression, parentPriority = 0): string {
  const priority = classPriority(expr);
  let output: string;
  switch (expr.op) {
    case "concept":
      output = conceptLabel(expr.slug);
      break;
    case "union":
    case "intersection": {
      const separator = expr.op === "union" ? " ⊔ " : " ⊓ ";
      if (expr.args.length < 2) throw new Error("Class n-ary operation needs at least 2 operands");
      output = expr.args.map((term) => renderClass(term, priority)).join(separator);
      break;
    }
    case "class_not":
      output = "¬" + renderClass(expr.arg, priority);
      break;
    case "exists":
    case "forall":
      output = (expr.op === "exists" ? "∃" : "∀") +
        expr.predicate + "." + renderClass(expr.filler, priority);
      break;
  }
  return priority < parentPriority ? "(" + output + ")" : output;
}

function propositionPriority(e: FormalProposition): number {
  switch (e.op) {
    case "iff": return 1;
    case "implies": return 2;
    case "or": return 3;
    case "and": return 4;
    case "not": return 5;
    default: return 6;
  }
}

export function renderFormalExpression(expr: FormalProposition, parentPriority = 0): string {
  const priority = propositionPriority(expr);
  let output: string;
  switch (expr.op) {
    case "subsumption":
    case "class_equivalence": {
      const left = renderClass(expr.left);
      const right = renderClass(expr.right);
      const compound = expr.right.op === "intersection" || expr.right.op === "union";
      output = left + (expr.op === "subsumption" ? " ⊑ " : " ≡ ") +
        (compound ? "(" + right + ")" : right);
      break;
    }
    case "not":
      output = "¬" + renderFormalExpression(expr.arg, priority);
      break;
    case "and":
    case "or": {
      if (expr.args.length < 2) throw new Error("Logical connective needs at least 2 propositions");
      const operator = expr.op === "and" ? " ∧ " : " ∨ ";
      output = expr.args.map((term) => renderFormalExpression(term, priority)).join(operator);
      break;
    }
    case "implies":
    case "iff": {
      const operator = expr.op === "implies" ? " ⇒ " : " ⇔ ";
      // Extra parentheses are deliberate for human-readable proof syntax.
      output = "(" + renderFormalExpression(expr.left) + ")" + operator +
        "(" + renderFormalExpression(expr.right) + ")";
      break;
    }
  }
  return priority < parentPriority ? "(" + output + ")" : output;
}

/** Preview-only compatibility with a production API that lacks documentation. */
export function recordedNecessaryConditions(
  subject: string,
  edges: { id: string; source: string; predicate: string; target: string }[],
): FormalProjection | null {
  const relevant = edges.filter((e) =>
    e.source === subject && e.predicate === "subtype_of" && e.target !== subject,
  ).sort((a, b) => a.target.localeCompare(b.target) || a.id.localeCompare(b.id));
  const targets = new Set<string>();
  const unique: typeof relevant = [];
  for (const edge of relevant) {
    if (targets.has(edge.target)) continue;
    targets.add(edge.target);
    unique.push(edge);
    if (unique.length === 4) break;
  }
  if (unique.length < 2) return null;
  return {
    kind: "necessary_class_condition",
    expression: {
      op: "subsumption",
      left: { op: "concept", slug: subject },
      right: {
        op: "intersection",
        args: unique.map((e) => ({ op: "concept" as const, slug: e.target })),
      },
    },
    assertion_ids: unique.map((e) => e.id),
    status: "conditional_on_recorded_assertions",
    source_semantics_verified: false,
    equivalence_established: false,
    may_publish: false,
    scope_origin: "assumed_not_in_source",
  };
}

export function recordedTransitivityFormula(
  subject: string,
  target: string,
  path: string[],
  edges: { id: string; source: string; predicate: string; target: string }[],
): FormalProjection {
  const byId = new Map(edges.map((e) => [e.id, e]));
  if (path.length < 2 || new Set(path).size !== path.length) {
    throw new Error("Inference needs at least two distinct premise UUIDs");
  }
  let current = subject;
  const atoms: FormalProposition[] = [];
  for (const id of path) {
    const edge = byId.get(id);
    if (!edge || edge.predicate !== "subtype_of" || edge.source !== current) {
      throw new Error("Invalid ordered subtype premises");
    }
    atoms.push({
      op: "subsumption",
      left: { op: "concept", slug: edge.source },
      right: { op: "concept", slug: edge.target },
    });
    current = edge.target;
  }
  if (current !== target || subject === target) throw new Error("Conclusion does not match premises");
  return {
    kind: "conditional_rule_formula",
    expression: {
      op: "implies",
      left: { op: "and", args: atoms },
      right: {
        op: "subsumption",
        left: { op: "concept", slug: subject },
        right: { op: "concept", slug: target },
      },
    },
    assertion_ids: [...path],
    status: "conditional_on_recorded_assertions",
    source_semantics_verified: false,
    equivalence_established: false,
    may_publish: false,
    scope_origin: "assumed_not_in_source",
    rule: "subtype_of_transitivity",
  };
}
