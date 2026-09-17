import { SiteHeader } from "@/components/site-header/SiteHeader";

import styles from "./page.module.css";

export default function ConceptLoading() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <section className={styles.state} aria-live="polite">
          <p className={styles.sectionLabel}>Concept</p>
          <h2>Loading concept…</h2>
          <p>Reading the knowledge graph.</p>
        </section>
      </main>
    </div>
  );
}
