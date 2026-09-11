import Link from "next/link";

import { SearchFilters } from "@/components/search-filters/SearchFilters";
import { SearchForm } from "@/components/search-form/SearchForm";
import { SiteFooter } from "@/components/site-footer/SiteFooter";
import { SiteHeader } from "@/components/site-header/SiteHeader";
import {
  GraphApiError,
  searchGraph,
  type RelationSummary,
  type SearchCategory,
  type SearchResponse,
} from "@/lib/api/graph";
import { humanizeSlug } from "@/lib/format";

import styles from "./page.module.css";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
  }>;
};

const CATEGORY_OPTIONS: Array<{ label: string; value: SearchCategory }> = [
  { label: "All", value: "all" },
  { label: "Concepts", value: "concepts" },
  { label: "Connections", value: "connections" },
];

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseCategory(value: string | undefined): SearchCategory {
  return value === "concepts" || value === "connections" ? value : "all";
}

function searchHref(query: string, category: SearchCategory) {
  const params = new URLSearchParams({ q: query });
  if (category !== "all") {
    params.set("category", category);
  }
  return `/search?${params.toString()}`;
}

function ConceptResults({ concepts }: { concepts: Array<{ slug: string }> }) {
  if (concepts.length === 0) {
    return <p className={styles.empty}>No matching concepts.</p>;
  }

  return (
    <div className={styles.resultList}>
      {concepts.map((concept) => (
        <Link
          className={styles.conceptResult}
          href={`/concepts/${encodeURIComponent(concept.slug)}`}
          key={concept.slug}
        >
          <span className={styles.resultTitle}>{humanizeSlug(concept.slug)}</span>
          <span className={styles.slug}>{concept.slug}</span>
        </Link>
      ))}
    </div>
  );
}

function ConceptLink({ slug }: { slug: string }) {
  return (
    <Link className={styles.inlineConcept} href={`/concepts/${encodeURIComponent(slug)}`}>
      {humanizeSlug(slug)}
    </Link>
  );
}

function ConnectionResults({ connections }: { connections: RelationSummary[] }) {
  if (connections.length === 0) {
    return <p className={styles.empty}>No matching connections.</p>;
  }

  return (
    <div className={styles.connectionList}>
      {connections.map((connection) => (
        <div className={styles.connectionRow} key={connection.id}>
          <ConceptLink slug={connection.source} />
          <span className={styles.relationType}>{humanizeSlug(connection.type)}</span>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
          <ConceptLink slug={connection.target} />
        </div>
      ))}
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = firstValue(params.q)?.trim() ?? "";
  const category = parseCategory(firstValue(params.category));

  let data: SearchResponse | null = null;
  let unavailable = false;

  if (query) {
    try {
      data = await searchGraph(query, category);
    } catch (error) {
      unavailable = true;
      if (!(error instanceof GraphApiError)) {
        console.error("Unexpected search error", error);
      }
    }
  }

  const concepts = data?.results.concepts ?? [];
  const connections = data?.results.connections ?? [];

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <div className={styles.searchArea}>
          <SearchForm defaultValue={query} showExamples={false} />
        </div>

        {query ? (
          <>
            <nav className={styles.categories} aria-label="Search result categories">
              {CATEGORY_OPTIONS.map((option) => (
                <Link
                  className={option.value === category ? styles.activeCategory : styles.category}
                  href={searchHref(query, option.value)}
                  key={option.value}
                >
                  {option.label}
                </Link>
              ))}
              <span
                className={styles.disabledCategory}
                aria-label="Curriculum search is not available yet"
                title="Curriculum mappings are not available yet"
              >
                Curriculum
              </span>
            </nav>

            <SearchFilters query={query} category={category} />

            <div className={styles.queryContext}>
              {category !== "connections" && !unavailable ? (
                <span>
                  Showing {concepts.length} concept {concepts.length === 1 ? "match" : "matches"}
                </span>
              ) : (
                <span>Results</span>
              )}
              <span>for</span>
              <strong>{query}</strong>
            </div>

            {unavailable ? (
              <section className={styles.notice}>
                <h1>Search is temporarily unavailable.</h1>
                <p>The graph API could not be reached. Your query is preserved above.</p>
              </section>
            ) : category === "concepts" ? (
              <section className={styles.section} aria-labelledby="concept-results-title">
                <h1 id="concept-results-title">Concepts</h1>
                <ConceptResults concepts={concepts} />
              </section>
            ) : category === "connections" ? (
              <section className={styles.section} aria-labelledby="connection-results-title">
                <h1 id="connection-results-title">Connections</h1>
                <ConnectionResults connections={connections} />
              </section>
            ) : (
              <div className={styles.groupedResults}>
                <section className={styles.section} aria-labelledby="concept-results-title">
                  <h1 id="concept-results-title">Concepts</h1>
                  <ConceptResults concepts={concepts} />
                </section>
                <section className={styles.section} aria-labelledby="connection-results-title">
                  <h1 id="connection-results-title">Connections</h1>
                  <ConnectionResults connections={connections} />
                </section>
              </div>
            )}
          </>
        ) : (
          <section className={styles.notice}>
            <h1>Search knowledge.</h1>
            <p>Enter a concept or relationship above.</p>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
