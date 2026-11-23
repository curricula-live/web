import Link from "next/link";
import { ConceptDirectory } from "@/components/concept-directory/ConceptDirectory";
import { SiteFooter } from "@/components/site-footer/SiteFooter";
import { SiteHeader } from "@/components/site-header/SiteHeader";
import { getConceptDirectory } from "@/lib/api/graph";
import styles from "./page.module.css";

export const metadata = {
  title: "Concepts · curricula.live",
  description: "Browse and review the recorded computer-science and ICT concepts.",
};

export default async function ConceptsDirectoryPage() {
  let concepts: string[] = [];
  let unavailable = false;
  try {
    const data = await getConceptDirectory();
    concepts = data.results.map(({ slug }) => slug).sort((a, b) => a.localeCompare(b));
  } catch {
    unavailable = true;
  }

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <p className={styles.eyebrow}>Knowledge index · legacy graph</p>
        <h1>Concepts</h1>
        <p className={styles.intro}>
          Browse every concept currently recorded in the smaller concept database.
          Open any entry to examine its statements, connections and conditional inferences.
        </p>
        <div className={styles.context}>
          <span>Legacy graph · provisional</span>
          <Link href="/atlas">Source atlas</Link>
        </div>
        {unavailable
          ? <p className={styles.unavailable}>The concept directory could not be loaded from the API.</p>
          : <ConceptDirectory slugs={concepts} />}
      </main>
      <SiteFooter />
    </div>
  );
}
