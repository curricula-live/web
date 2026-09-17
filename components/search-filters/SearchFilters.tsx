"use client";

import Link from "next/link";
import { useState } from "react";

import type { SearchCategory } from "@/lib/api/graph";

import styles from "./SearchFilters.module.css";

type SearchFiltersProps = {
  query: string;
  category: SearchCategory;
};

type FilterKind = "concepts" | "connections";

const STUDENT_STAGES = ["Primary", "Lower secondary", "Upper secondary", "Adult"] as const;

function searchHref(query: string, category: SearchCategory) {
  const params = new URLSearchParams({ q: query });
  if (category !== "all") {
    params.set("category", category);
  }
  return `/search?${params.toString()}`;
}

function checkedState(category: SearchCategory) {
  return {
    concepts: category !== "connections",
    connections: category !== "concepts",
  };
}

function nextCategory(category: SearchCategory, toggled: FilterKind): SearchCategory {
  const current = checkedState(category);
  const next = { ...current, [toggled]: !current[toggled] };

  if (!next.concepts && !next.connections) {
    return category;
  }
  if (next.concepts && next.connections) {
    return "all";
  }
  return next.concepts ? "concepts" : "connections";
}

function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span className={`${styles.checkbox} ${checked ? styles.checked : ""}`} aria-hidden="true">
      {checked ? (
        <svg viewBox="0 0 16 16">
          <path d="m3 8 3 3 7-7" />
        </svg>
      ) : null}
    </span>
  );
}

export function SearchFilters({ query, category }: SearchFiltersProps) {
  const [open, setOpen] = useState(false);
  const checked = checkedState(category);

  return (
    <div className={styles.wrapper}>
      <div className={styles.triggerRow}>
        <button
          className={styles.trigger}
          type="button"
          aria-expanded={open}
          aria-controls="search-filter-tray"
          onClick={() => setOpen((value) => !value)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h10M18 7h2M4 17h2M10 17h10M8 4v6M16 14v6" />
          </svg>
          Filters
          <span className={styles.chevron} aria-hidden="true">
            {open ? "↑" : "↓"}
          </span>
        </button>
      </div>

      {open ? (
        <div className={styles.tray} id="search-filter-tray">
          <div className={styles.group}>
            <span className={styles.label}>Result type</span>
            <div className={styles.options}>
              {(["concepts", "connections"] as const).map((kind) => {
                const isChecked = checked[kind];
                const next = nextCategory(category, kind);
                return (
                  <Link
                    className={styles.option}
                    href={searchHref(query, next)}
                    key={kind}
                    aria-current={isChecked ? "true" : undefined}
                  >
                    <CheckMark checked={isChecked} />
                    {kind === "concepts" ? "Concepts" : "Connections"}
                  </Link>
                );
              })}
              <span className={styles.disabledOption} aria-disabled="true">
                <CheckMark checked={false} />
                Curriculum
              </span>
            </div>
          </div>

          <div className={styles.group}>
            <span className={styles.label}>Student stage</span>
            <div className={styles.options}>
              {STUDENT_STAGES.map((stage) => (
                <span className={styles.disabledOption} aria-disabled="true" key={stage}>
                  <CheckMark checked={false} />
                  {stage}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
