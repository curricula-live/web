import { SiteFooter } from "@/components/site-footer/SiteFooter";
import { SiteHeader } from "@/components/site-header/SiteHeader";

import styles from "./loading.module.css";

export default function SearchLoading() {
  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main} aria-live="polite" aria-busy="true">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Searching knowledge…</p>
          <p className={styles.message}>Loading concept connections.</p>
        </div>

        <div className={styles.animation} aria-hidden="true">
          <div className={styles.leafField}>
            <img className={`${styles.leaf} ${styles.leafOne}`} src="/brand-leaf.svg" alt="" />
            <img className={`${styles.leaf} ${styles.leafTwo}`} src="/brand-leaf.svg" alt="" />
            <img className={`${styles.leaf} ${styles.leafThree}`} src="/brand-leaf.svg" alt="" />
          </div>

          <div className={styles.stack}>
            <span className={`${styles.sheet} ${styles.sheetOne}`} />
            <span className={`${styles.sheet} ${styles.sheetTwo}`} />
            <span className={`${styles.sheet} ${styles.sheetThree}`} />
            <span className={styles.highlight} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
