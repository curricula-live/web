import Link from "next/link";

import styles from "./SearchForm.module.css";

const EXAMPLE_QUERIES = [
  "binary numbers",
  "two's complement",
  "arrays",
  "network protocol",
];

export function SearchForm() {
  return (
    <div className={styles.wrapper}>
      <form className={styles.form} action="/search" method="get" role="search">
        <label className={styles.srOnly} htmlFor="knowledge-search">
          Search knowledge
        </label>
        <input
          id="knowledge-search"
          className={styles.input}
          name="q"
          type="search"
          placeholder="Search for a concept..."
          autoComplete="off"
          required
        />
        <button className={styles.submit} type="submit" aria-label="Search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.25" />
            <path d="m16 16 4 4" />
          </svg>
        </button>
      </form>

      <div className={styles.examples} aria-label="Example searches">
        <span>Try:</span>
        {EXAMPLE_QUERIES.map((query) => (
          <Link key={query} href={`/search?q=${encodeURIComponent(query)}`}>
            {query}
          </Link>
        ))}
      </div>
    </div>
  );
}
