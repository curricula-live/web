import { ModalDialog } from "@/components/modal-dialog/ModalDialog";

import styles from "./SignInDialog.module.css";

export function SignInDialog() {
  return (
    <ModalDialog
      ariaLabel="Sign in"
      panelClassName={styles.panel}
      trigger={
        <svg className={styles.avatarIcon} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 20c.6-4 2.8-6.2 6.5-6.2s5.9 2.2 6.5 6.2" />
        </svg>
      }
      triggerAriaLabel="Sign in"
      triggerClassName={styles.avatarButton}
    >
      <h2 className={styles.title}>Sign in</h2>

      <button className={styles.googleButton} type="button" disabled>
        <span className={styles.googleMark} aria-hidden="true">
          G
        </span>
        Continue with Google
      </button>
      <p className={styles.status}>Google sign-in is not enabled yet.</p>
    </ModalDialog>
  );
}
