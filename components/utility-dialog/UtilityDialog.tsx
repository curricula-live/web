import { ModalDialog } from "@/components/modal-dialog/ModalDialog";

import styles from "./UtilityDialog.module.css";

export type UtilityDialogKind = "about" | "privacy" | "contact";

type UtilityDialogProps = {
  kind: UtilityDialogKind;
  triggerClassName?: string;
};

const CONTACT_EMAIL = "contact@curricula.live";

function mailto(subject: string, body: string) {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function AboutContent() {
  return (
    <>
      <h2 className={styles.title}>About</h2>
      <p className={styles.lead}>
        curricula.live helps teachers review concepts quickly before class, trace how ideas connect,
        and structure the material they intend to teach into lesson planning and documentation.
      </p>

      <section className={styles.section}>
        <h3>What it is</h3>
        <p>
          A professional reference and planning workspace for teachers. It is designed for concise
          concept review, relationship exploration, selecting teaching scope, and progressively
          turning that structure into practical lesson plans and planning documents.
        </p>
      </section>

      <section className={styles.section}>
        <h3>What it is not</h3>
        <p>
          It is not a student textbook and it does not replace teacher judgement, experience, or
          knowledge of a class. It is a support tool for understanding and planning, not an
          automatic teaching authority.
        </p>
      </section>

      <section className={styles.section}>
        <h3>Sources</h3>
        <p>
          Where external curricula or source material are relevant, curricula.live points teachers
          to authoritative sources rather than mirroring full proprietary content.
        </p>
      </section>
    </>
  );
}

const PRIVACY_AREAS = [
  {
    title: "Accounts",
    description: "Information associated with an account when account features are enabled.",
  },
  {
    title: "Search activity",
    description: "How search requests and related usage information are handled.",
  },
  {
    title: "Generated lesson documents",
    description: "How planning and lesson documents created with curricula.live are handled.",
  },
  {
    title: "Third-party services",
    description: "External services used by curricula.live and the information they may process.",
  },
];

function PrivacyContent() {
  return (
    <>
      <h2 className={styles.title}>Privacy</h2>
      <p className={styles.lead}>
        Privacy information will be published in full before the related account and planning
        features are enabled. These are the main areas the policy will cover.
      </p>

      <div className={styles.infoRows}>
        {PRIVACY_AREAS.map((area) => (
          <div className={styles.infoRow} key={area.title}>
            <div>
              <h3>{area.title}</h3>
              <p>{area.description}</p>
            </div>
            <span className={styles.futureLink}>Full policy later</span>
          </div>
        ))}
      </div>
    </>
  );
}

const CONTACT_OPTIONS = [
  {
    title: "General questions",
    description: "Questions or feedback about curricula.live.",
    href: mailto(
      "curricula.live — General question",
      "Hello,\n\nI have a question about curricula.live:\n\n",
    ),
    action: "Email us",
  },
  {
    title: "Suggest a feature",
    description: "Suggest a feature, workflow, or improvement.",
    href: mailto(
      "curricula.live — Feature suggestion",
      "Hello,\n\nI would like to suggest the following feature or improvement:\n\n",
    ),
    action: "Email us",
  },
  {
    title: "Report an issue",
    description: "Report a bug or unexpected behavior in the web application.",
    href: "https://github.com/curricula-live/web/issues/new",
    action: "Open an issue",
  },
  {
    title: "Curriculum/source requests",
    description: "Request a topic, curriculum reference, or authoritative source to be considered.",
    href: mailto(
      "curricula.live — Curriculum or source request",
      "Hello,\n\nI would like to request the following curriculum, topic, or source:\n\n",
    ),
    action: "Email us",
  },
];

function ContactContent() {
  return (
    <>
      <h2 className={styles.title}>Contact</h2>
      <p className={styles.lead}>Choose the reason for getting in touch.</p>

      <div className={styles.contactRows}>
        {CONTACT_OPTIONS.map((option) => (
          <a
            className={styles.contactRow}
            href={option.href}
            key={option.title}
            rel={option.href.startsWith("http") ? "noreferrer" : undefined}
            target={option.href.startsWith("http") ? "_blank" : undefined}
          >
            <span>
              <strong>{option.title}</strong>
              <span>{option.description}</span>
            </span>
            <span className={styles.action}>{option.action} →</span>
          </a>
        ))}
      </div>
    </>
  );
}

export function UtilityDialog({ kind, triggerClassName }: UtilityDialogProps) {
  const label = kind === "about" ? "About" : kind === "privacy" ? "Privacy" : "Contact";

  return (
    <ModalDialog trigger={label} triggerClassName={triggerClassName} ariaLabel={label}>
      {kind === "about" ? (
        <AboutContent />
      ) : kind === "privacy" ? (
        <PrivacyContent />
      ) : (
        <ContactContent />
      )}
    </ModalDialog>
  );
}
