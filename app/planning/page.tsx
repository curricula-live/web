import { SiteFooter } from "@/components/site-footer/SiteFooter";
import { SiteHeader } from "@/components/site-header/SiteHeader";
import {
  SemanticApiError,
  validateSemanticPlan,
  type ValidatePlanResponse,
} from "@/lib/api/semantic";

import styles from "./page.module.css";

type PlanningPageProps = {
  searchParams: Promise<{
    run?: string | string[];
    snapshot?: string | string[];
    prior?: string | string[];
    plan?: string | string[];
    course?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function Outcome({
  response,
}: {
  response: ValidatePlanResponse;
}) {
  const { validation } = response;

  return (
    <section className={styles.result} aria-labelledby="planning-result-title">
      <div className={styles.resultHeader}>
        <div>
          <p className={styles.eyebrow}>Semantic validation</p>
          <h2 id="planning-result-title">{validation.outcome}</h2>
        </div>
        <span className={styles.snapshot}>{validation.snapshot}</span>
      </div>

      <dl className={styles.metadata}>
        <div>
          <dt>Policy</dt>
          <dd>{validation.policy}</dd>
        </div>
        <div>
          <dt>Schema</dt>
          <dd>{response.schema_version}</dd>
        </div>
        <div>
          <dt>Snapshot hash</dt>
          <dd className={styles.hash}>{response.snapshot_hash}</dd>
        </div>
      </dl>

      {validation.certificates.length ? (
        <div className={styles.certificates}>
          <h3>Explanation certificates</h3>
          {validation.certificates.map((certificate) => (
            <article className={styles.certificate} key={certificate.certificate_id}>
              <p>
                <strong>{certificate.missing_or_late_concept}</strong> must be available before{" "}
                <strong>{certificate.target_concept}</strong>.
              </p>
              <p className={styles.muted}>
                {certificate.violation_kind} · assertions{" "}
                {certificate.assertion_path.join(" → ")}
              </p>
              <p className={styles.muted}>
                Evidence: {certificate.source_evidence.join(", ") || "none recorded"}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      {validation.unresolved_refs.length || validation.unknown_scope_assertions.length ? (
        <div className={styles.certificates}>
          <h3>Unresolved inputs</h3>
          {validation.unresolved_refs.length ? (
            <p className={styles.muted}>References: {validation.unresolved_refs.join(", ")}</p>
          ) : null}
          {validation.unknown_scope_assertions.length ? (
            <p className={styles.muted}>
              Scope: {validation.unknown_scope_assertions.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default async function PlanningPage({ searchParams }: PlanningPageProps) {
  const params = await searchParams;
  const shouldRun = firstValue(params.run) === "1";
  const snapshot = firstValue(params.snapshot)?.trim() || "K_17";
  const priorText = firstValue(params.prior)?.trim() || "C1";
  const planText = firstValue(params.plan)?.trim() || "C3, C2";
  const courseContext =
    firstValue(params.course)?.trim() || "number_representation";

  let response: ValidatePlanResponse | null = null;
  let error: SemanticApiError | null = null;

  if (shouldRun) {
    try {
      response = await validateSemanticPlan({
        snapshot_id: snapshot,
        context: {
          context_id: "curricula-live-planner",
          framework: "*",
          stage: "*",
          subject: "computer_science",
          course_context: courseContext,
          qualifier: "*",
        },
        prior: parseList(priorText).map((ref) => ({ ref, kind: "concept" })),
        plan: parseList(planText).map((ref) => ({ ref, kind: "concept" })),
      });
    } catch (caught) {
      error =
        caught instanceof SemanticApiError
          ? caught
          : new SemanticApiError("Unexpected semantic planning error.", 500);
    }
  }

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Teacher Planning</p>
          <h1>Check a concept sequence against a published semantic snapshot.</h1>
          <p>
            This early planning surface consumes the version-aware semantic contract. It does
            not edit canonical knowledge and it reports indeterminate inputs instead of
            inventing a prerequisite decision.
          </p>
        </header>

        <form className={styles.form} action="/planning" method="get">
          <input type="hidden" name="run" value="1" />

          <label>
            <span>Snapshot</span>
            <input name="snapshot" defaultValue={snapshot} />
          </label>

          <label>
            <span>Prior concepts</span>
            <input name="prior" defaultValue={priorText} placeholder="C1, C2" />
          </label>

          <label>
            <span>Ordered plan</span>
            <input name="plan" defaultValue={planText} placeholder="C2, C3" required />
          </label>

          <label>
            <span>Course context</span>
            <input name="course" defaultValue={courseContext} />
          </label>

          <button type="submit">Validate plan</button>
        </form>

        {!shouldRun ? (
          <section className={styles.notice}>
            <h2>Reference scenario</h2>
            <p>
              The defaults reproduce the dissertation fixture: prior support C1 and ordered
              targets C3, C2 under snapshot K_17.
            </p>
          </section>
        ) : null}

        {error ? (
          <section className={styles.notice} role="alert">
            <h2>Semantic validation unavailable.</h2>
            <p>{error.message}</p>
            {error.code ? <p className={styles.muted}>Code: {error.code}</p> : null}
          </section>
        ) : null}

        {response ? <Outcome response={response} /> : null}
      </main>
      <SiteFooter />
    </div>
  );
}
