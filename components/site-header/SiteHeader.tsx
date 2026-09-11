import Image from "next/image";
import Link from "next/link";

import { SignInDialog } from "@/components/sign-in-dialog/SignInDialog";

import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="curricula.live home">
        <Image
          className={styles.brandMark}
          src="/brand-mark.svg"
          alt=""
          width={32}
          height={40}
          priority
          unoptimized
        />
        <span className={styles.wordmark}>curricula.live</span>
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
        <span className={styles.divider} aria-hidden="true" />
        <SignInDialog />
      </nav>
    </header>
  );
}
