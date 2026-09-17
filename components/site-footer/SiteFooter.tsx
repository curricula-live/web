import { UtilityDialog } from "@/components/utility-dialog/UtilityDialog";

import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <UtilityDialog kind="about" triggerClassName={styles.linkButton} />
      <UtilityDialog kind="privacy" triggerClassName={styles.linkButton} />
      <UtilityDialog kind="contact" triggerClassName={styles.linkButton} />
    </footer>
  );
}
