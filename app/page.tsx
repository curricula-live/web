import { SearchForm } from "@/components/search-form/SearchForm";
import { SiteFooter } from "@/components/site-footer/SiteFooter";
import { SiteHeader } from "@/components/site-header/SiteHeader";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <SiteHeader />

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="home-title">
          <h1 id="home-title">Search knowledge.</h1>
          <p className={styles.subtitle}>Review concepts, plan lessons.</p>
          <SearchForm />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
