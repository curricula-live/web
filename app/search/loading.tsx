import { SiteHeader } from "@/components/site-header/SiteHeader";

import styles from "./page.module.css";

export default function SearchLoading() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <section className={styles.notice} aria-live="polite">
          <h1>Searching knowledge…</h1>
          <p>Loading graph results.</p>
        </section>
      </main>
    </div>
  );
}
