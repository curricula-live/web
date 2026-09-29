const SEMANTIC_API_BASE_URL = process.env.SEMANTIC_API_BASE_URL?.replace(/\/$/, "");

export type SemanticPlanItem = {
  ref: string;
  kind: "concept" | "occurrence";
};

export type SemanticContext = {
  context_id?: string;
  framework?: string;
  stage?: string;
  subject: string;
  course_context: string;
  qualifier?: string;
};

export type ValidationCertificate = {
  certificate_id: string;
  snapshot: string;
  policy: string;
  context_id: string | null;
  plan_hash: string;
  target_index: number;
  target_concept: string;
  missing_or_late_concept: string;
  violation_kind: string;
  assertion_path: string[];
  assertion_revision_path: string[];
  source_evidence: string[];
  witness_rule: string;
};

export type PlanValidation = {
  outcome: "VALID" | "INVALID" | "INDETERMINATE";
  snapshot: string;
  policy: string;
  prior: string[];
  resolved_plan: string[];
  certificates: ValidationCertificate[];
  unresolved_refs: string[];
  unknown_scope_assertions: string[];
  notes: string[];
};

export type ValidatePlanResponse = {
  contract_version: "semantic-api@1";
  schema_version: string;
  snapshot_hash: string;
  validation: PlanValidation;
};

export type ValidatePlanInput = {
  snapshot_id: string;
  policy_version?: string;
  expected_schema_version?: string;
  context: SemanticContext;
  prior?: SemanticPlanItem[];
  plan: SemanticPlanItem[];
};

type SemanticProblem = {
  detail?: {
    code?: string;
    detail?: string;
  };
};

export class SemanticApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "SemanticApiError";
    this.status = status;
    this.code = code;
  }
}

function semanticBaseUrl() {
  if (!SEMANTIC_API_BASE_URL) {
    throw new SemanticApiError(
      "Semantic planning is not configured for this deployment.",
      503,
      "SEMANTIC_API_NOT_CONFIGURED",
    );
  }

  return SEMANTIC_API_BASE_URL;
}

async function semanticJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${semanticBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let problem: SemanticProblem | null = null;

    try {
      problem = (await response.json()) as SemanticProblem;
    } catch {
      // Keep the transport-level message when the response is not JSON.
    }

    const detail = problem?.detail;
    throw new SemanticApiError(
      detail?.detail ?? `Semantic API request failed with ${response.status}`,
      response.status,
      detail?.code,
    );
  }

  return (await response.json()) as T;
}

export function validateSemanticPlan(input: ValidatePlanInput) {
  return semanticJson<ValidatePlanResponse>("/v1/plans/validate/", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      policy_version: input.policy_version ?? "strict-prior@1",
      expected_schema_version: input.expected_schema_version ?? "sem-v1",
      prior: input.prior ?? [],
    }),
  });
}
