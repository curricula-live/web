import Link from "next/link";

import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.wordmark} href="/">
        curricula.live
      </Link>

      <nav className={styles.navigation} aria-label="Primary navigation">
        <button
          className={styles.futureControl}
          type="button"
          disabled
          aria-label="Teacher Planning — coming later"
        >
          Teacher Planning
        </button>
        <Link className={styles.link} href="/about">
          About
        </Link>
        <button
          className={styles.signIn}
          type="button"
          disabled
          aria-label="Sign in — Google sign-in coming later"
        >
          Sign in
        </button>
      </nav>
    </header>
  );
}
