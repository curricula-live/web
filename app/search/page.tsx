import { SiteFooter } from "@/components/site-footer/SiteFooter";
import { SiteHeader } from "@/components/site-header/SiteHeader";

import styles from "./page.module.css";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = rawQuery?.trim() ?? "";

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <p className={styles.label}>Search</p>
        <h1>{query || "No query"}</h1>
        <p className={styles.status}>
          Search results will be connected to the graph API in the next focused change.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
