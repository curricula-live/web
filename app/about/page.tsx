import { SiteFooter } from "@/components/site-footer/SiteFooter";
import { SiteHeader } from "@/components/site-header/SiteHeader";

import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <h1>About curricula.live</h1>
        <p>
          curricula.live is a teacher-facing reference and planning platform for working
          with concepts and the connections between them.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
