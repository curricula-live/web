import Image from "next/image";
import { SiteHeader } from "@/components/site-header/SiteHeader";
import { SiteFooter } from "@/components/site-footer/SiteFooter";
import styles from "./loading.module.css";

export default function ConceptLoading() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main} role="status" aria-live="polite" aria-busy="true">
        <p className={styles.eyebrow}>Concept · knowledge graph</p>
        <h1>Retrieving relationships</h1>
        <p className={styles.description}>Reading recorded assertions and resolving their inference paths.</p>
        <div className={styles.canvas} aria-hidden="true">
          <div className={styles.branch}>
            <span className={styles.node}><Image src="/brand-leaf.svg" width={29} height={29} alt="" unoptimized /></span>
            <span className={styles.beam} />
            <span className={styles.nodeSecondary} />
            <span className={styles.beamTwo} />
            <span className={styles.nodeTertiary} />
          </div>
          <div className={styles.skeleton}>
            <span className={styles.longBar} />
            <span className={styles.shortBar} />
            <span className={styles.longBar} />
          </div>
        </div>
        <p className={styles.note}>The graph will remain inside a fixed-size, zoomable view once loaded.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
