"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";

import styles from "./ModalDialog.module.css";

type ModalDialogProps = {
  trigger: ReactNode;
  triggerClassName?: string;
  triggerAriaLabel?: string;
  ariaLabel: string;
  children: ReactNode;
  panelClassName?: string;
};

export function ModalDialog({
  trigger,
  triggerClassName,
  triggerAriaLabel,
  ariaLabel,
  children,
  panelClassName,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      event.currentTarget.close();
    }
  }

  return (
    <>
      <button
        className={triggerClassName}
        type="button"
        aria-label={triggerAriaLabel}
        onClick={openDialog}
      >
        {trigger}
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label={ariaLabel}
        onClick={closeOnBackdrop}
      >
        <div className={`${styles.panel} ${panelClassName ?? ""}`}>
          <button
            className={styles.close}
            type="button"
            aria-label={`Close ${ariaLabel}`}
            onClick={closeDialog}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          {children}
        </div>
      </dialog>
    </>
  );
}
