import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <span className={styles.wordmark}>curricula.live</span>
        <section className={styles.foundation} aria-labelledby="foundation-title">
          <p className={styles.eyebrow}>Frontend foundation</p>
          <h1 id="foundation-title">React application ready.</h1>
          <p>
            The product interface will be introduced in focused follow-up pull requests.
          </p>
        </section>
      </div>
    </main>
  );
}
