"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { humanizeSlug } from "@/lib/format";
import styles from "./ConceptDirectory.module.css";

export function ConceptDirectory({ slugs }: { slugs: string[] }) {
  const [query, setQuery] = useState("");
  const [initial, setInitial] = useState("All");
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const index = useMemo(() => {
    const tally = new Map<string, number>();
    for (const slug of slugs) {
      const letter = slug[0]?.toUpperCase() ?? "#";
      tally.set(letter, (tally.get(letter) ?? 0) + 1);
    }
    return tally;
  }, [slugs]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return slugs.filter((slug) => (
      (initial === "All" || slug[0]?.toUpperCase() === initial) &&
      (!term || slug.toLocaleLowerCase().includes(term) || humanizeSlug(slug).toLocaleLowerCase().includes(term))
    ));
  }, [slugs, query, initial]);

  return (
    <section className={styles.directory} aria-label="Concept directory">
      <div className={styles.toolbar}>
        <label htmlFor="concept-directory-search">Find a concept</label>
        <input
          id="concept-directory-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name or slug…"
          autoComplete="off"
        />
        <span aria-live="polite">{filtered.length} of {slugs.length} concepts</span>
      </div>

      <div className={styles.letters} role="group" aria-label="Filter by first letter">
        {["All", ...letters].map((letter) => (
          <button
            key={letter}
            type="button"
            aria-pressed={initial === letter}
            className={initial === letter ? styles.letterActive : styles.letter}
            onClick={() => setInitial(letter)}
            disabled={letter !== "All" && !(index.get(letter) ?? 0)}
            title={letter === "All" ? "Show all concepts" : `${index.get(letter) ?? 0} concepts starting with ${letter}`}
          >
            {letter}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <div className={styles.grid}>
          {filtered.map((slug, i) => (
            <Link key={slug} className={styles.concept} href={`/concepts/${encodeURIComponent(slug)}`}>
              <span className={styles.counter}>{String(i + 1).padStart(3, "0")}</span>
              <span className={styles.conceptBody}>
                <strong>{humanizeSlug(slug)}</strong>
                <small>{slug}</small>
              </span>
              <span className={styles.openIcon} aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No matching concepts. Try another search or select All.</p>
      )}
    </section>
  );
}
