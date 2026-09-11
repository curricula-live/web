import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site-footer/SiteFooter";
import { SiteHeader } from "@/components/site-header/SiteHeader";
import {
  getConcept,
  getConceptNeighborhood,
  GraphApiError,
  type ConceptNeighborhood,
  type RelationSummary,
} from "@/lib/api/graph";
import { humanizeSlug } from "@/lib/format";

import styles from "./page.module.css";

type ConceptPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
};

type ConceptView = "overview" | "connections" | "curriculum" | "pedagogical";

const VIEWS: Array<{ value: ConceptView; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "connections", label: "Connections" },
  { value: "curriculum", label: "Curriculum" },
  { value: "pedagogical", label: "Pedagogical" },
];

function parseView(value: string | string[] | undefined): ConceptView {
  const candidate = Array.isArray(value) ? value[0] : value;
  return VIEWS.some((view) => view.value === candidate)
    ? (candidate as ConceptView)
    : "overview";
}

function viewHref(slug: string, view: ConceptView) {
  const base = `/concepts/${encodeURIComponent(slug)}`;
  return view === "overview" ? base : `${base}?view=${view}`;
}

function RelationRow({ relation }: { relation: RelationSummary }) {
  return (
    <div className={styles.relationRow}>
      <Link href={`/concepts/${encodeURIComponent(relation.source)}`}>
        {humanizeSlug(relation.source)}
      </Link>
      <span className={styles.relationType}>{humanizeSlug(relation.type)}</span>
      <span className={styles.arrow} aria-hidden="true">
        →
      </span>
      <Link href={`/concepts/${encodeURIComponent(relation.target)}`}>
        {humanizeSlug(relation.target)}
      </Link>
    </div>
  );
}

function RelationGroup({
  title,
  relations,
}: {
  title: string;
  relations: RelationSummary[];
}) {
  return (
    <section className={styles.connectionGroup}>
      <h2>{title}</h2>
      {relations.length ? (
        <div className={styles.relationList}>
          {relations.map((relation) => (
            <RelationRow key={relation.id} relation={relation} />
          ))}
        </div>
      ) : (
        <p className={styles.muted}>No {title.toLowerCase()} connections.</p>
      )}
    </section>
  );
}

export default async function ConceptPage({ params, searchParams }: ConceptPageProps) {
  const { slug } = await params;
  const view = parseView((await searchParams).view);

  let conceptExists = false;
  let apiUnavailable = false;

  try {
    await getConcept(slug);
    conceptExists = true;
  } catch (error) {
    if (error instanceof GraphApiError && error.status === 404) {
      notFound();
    }
    apiUnavailable = true;
  }

  let neighborhood: ConceptNeighborhood | null = null;
  let neighborhoodUnavailable = false;

  if (conceptExists && view === "connections") {
    try {
      neighborhood = await getConceptNeighborhood(slug);
    } catch (error) {
      neighborhoodUnavailable = true;
      if (!(error instanceof GraphApiError)) {
        console.error("Unexpected concept neighborhood error", error);
      }
    }
  }

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <header className={styles.conceptHeader}>
          <p className={styles.kind}>Concept</p>
          <h1>{humanizeSlug(slug)}</h1>
          <p className={styles.canonical}>{slug}</p>
        </header>

        <nav className={styles.views} aria-label="Concept sections">
          {VIEWS.map((option) => (
            <Link
              className={option.value === view ? styles.activeView : styles.view}
              href={viewHref(slug, option.value)}
              key={option.value}
            >
              {option.label}
            </Link>
          ))}
        </nav>

        {apiUnavailable ? (
          <section className={styles.state}>
            <h2>Concept data is temporarily unavailable.</h2>
            <p>The graph API could not be reached. Try this page again shortly.</p>
          </section>
        ) : view === "connections" ? (
          <section className={styles.content} aria-labelledby="connections-title">
            <div className={styles.sectionIntro}>
              <p className={styles.sectionLabel}>Connections</p>
              <h2 id="connections-title">Graph neighbourhood</h2>
              <p>Direct relationships currently recorded for this concept.</p>
            </div>
            {neighborhoodUnavailable ? (
              <div className={styles.state}>
                <h2>Connections are temporarily unavailable.</h2>
                <p>The concept exists, but its neighbourhood could not be loaded.</p>
              </div>
            ) : neighborhood ? (
              <div className={styles.connectionGroups}>
                <RelationGroup title="Incoming" relations={neighborhood.incoming} />
                <RelationGroup title="Outgoing" relations={neighborhood.outgoing} />
              </div>
            ) : null}
          </section>
        ) : view === "curriculum" ? (
          <section className={styles.state}>
            <p className={styles.sectionLabel}>Curriculum</p>
            <h2>Curriculum mappings are not available yet.</h2>
            <p>
              This section is reserved for references showing where the concept is taught.
            </p>
          </section>
        ) : view === "pedagogical" ? (
          <section className={styles.state}>
            <p className={styles.sectionLabel}>Pedagogical</p>
            <h2>Pedagogical documentation has not been modelled yet.</h2>
            <p>
              This section will hold teacher-facing pedagogy once the corresponding data exists.
            </p>
          </section>
        ) : (
          <section className={styles.content} aria-labelledby="overview-title">
            <div className={styles.sectionIntro}>
              <p className={styles.sectionLabel}>Overview</p>
              <h2 id="overview-title">Structured documentation</h2>
              <p>
                Definitions, key points, examples and misconceptions have not been added for this
                concept yet.
              </p>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
