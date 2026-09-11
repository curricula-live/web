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
      <p className={styles.lead}>Teaching starts long before the lesson begins.</p>
      <p>
        curricula.live is a professional planning workspace built for teachers: a place to define
        what a lesson should cover, understand how its ideas fit together, and turn that structure
        into clear, usable teaching plans.
      </p>

      <section className={styles.section}>
        <h3>Define the lesson</h3>
        <p>Start with a topic and shape it into something teachable.</p>
        <p>
          Choose the concepts that matter, establish the scope of the lesson, identify what should
          come before and after, and organise the material around the learning journey you want to
          create.
        </p>
        <p>curricula.live helps turn a broad subject into a deliberate teaching plan.</p>
      </section>

      <section className={styles.section}>
        <h3>See the bigger picture</h3>
        <p>Lessons do not exist in isolation.</p>
        <p>
          Explore how concepts connect, which ideas depend on others, and where a lesson sits within
          the wider structure of a subject or curriculum.
        </p>
        <p>
          That wider view helps teachers make informed decisions about sequencing, depth,
          prerequisites, and progression.
        </p>
      </section>

      <section className={styles.section}>
        <h3>From structure to planning</h3>
        <p>
          Once the lesson has taken shape, curricula.live helps carry that structure forward into
          practical planning.
        </p>
        <p>
          Selected concepts and relationships can become the foundation for lesson plans, teaching
          sequences, and planning documents — without forcing teachers into a particular methodology
          or style.
        </p>
      </section>

      <section className={styles.section}>
        <h3>Built for teachers</h3>
        <p>curricula.live is designed around professional teacher judgement.</p>
        <p>
          It is not a student textbook and it does not attempt to decide how a class should be
          taught. Teachers remain in control of the material they select, the depth they choose, the
          activities they use, and the way they respond to their students.
        </p>
        <p>The platform provides structure. The teacher provides the teaching.</p>
      </section>

      <section className={styles.section}>
        <h3>Grounded in authoritative sources</h3>
        <p>
          Where official curricula, examination specifications, standards, or other external
          materials are relevant, curricula.live aims to direct teachers to authoritative sources.
        </p>
        <p>It is designed to work alongside those materials rather than reproduce or replace them.</p>
      </section>

      <p className={styles.closing}>Define the lesson. See the bigger picture. Teach with clarity.</p>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <h2 className={styles.title}>Privacy</h2>
      <p className={styles.lead}>
        curricula.live is built to be useful without collecting more information than it needs.
      </p>
      <p>
        At its current stage, the service does not require a user account and does not intentionally
        build personal profiles, store personal lesson-planning histories, or use behavioural
        advertising.
      </p>

      <section className={styles.section}>
        <h3>What happens when you use curricula.live</h3>
        <p>
          Using the website necessarily involves communication with the infrastructure that delivers
          the service.
        </p>
        <p>
          Basic technical information may therefore be processed by hosting and infrastructure
          providers when a request is made, such as an IP address, browser or device information,
          timestamps, and the pages or resources requested.
        </p>
        <p>
          curricula.live does not currently use this information to build a personal teaching or
          advertising profile.
        </p>
      </section>

      <section className={styles.section}>
        <h3>Searches and browsing</h3>
        <p>
          Searches and browsing activity are not currently used to create behavioural profiles for
          advertising.
        </p>
        <p>
          The purpose of search is to help you navigate curricula.live and find relevant teaching
          material.
        </p>
      </section>

      <section className={styles.section}>
        <h3>Teaching profiles</h3>
        <p>
          When accounts are introduced, teachers may be able to save professional preferences such
          as:
        </p>
        <ul>
          <li>curriculum or examination board;</li>
          <li>subject;</li>
          <li>qualification, level, or year group.</li>
        </ul>
        <p>
          These preferences would be provided explicitly by the teacher and used to make the
          workspace more relevant — for example, by remembering teaching context and prioritising
          appropriate curricula, concepts, sources, and planning tools.
        </p>
        <p>
          The exact information stored and the way it is used will be documented before account
          features are enabled.
        </p>
      </section>

      <section className={styles.section}>
        <h3>Lesson plans and planning documents</h3>
        <p>
          curricula.live does not currently provide personal cloud storage for lesson plans or
          planning documents.
        </p>
        <p>
          If saving, synchronisation, collaboration, or document storage is introduced, this notice
          will be updated before those features are enabled to explain what is stored and how it is
          handled.
        </p>
      </section>

      <section className={styles.section}>
        <h3>Cookies and tracking</h3>
        <p>
          curricula.live does not currently use behavioural advertising or cross-site tracking to
          build advertising profiles.
        </p>
        <p>
          If analytics, advertising, or other forms of measurement are introduced in the future,
          this notice will be updated to explain what is being used and why.
        </p>
      </section>

      <section className={styles.section}>
        <h3>Third-party services</h3>
        <p>
          curricula.live may rely on external infrastructure necessary to operate the service, such
          as hosting, domain, email, authentication, or other technical providers.
        </p>
        <p>
          As new services are introduced, relevant information about providers that process user
          information will be added to this notice.
        </p>
      </section>

      <section className={styles.section}>
        <h3>Future monetisation</h3>
        <p>
          curricula.live may eventually introduce paid features, subscriptions, sponsorships, or
          other forms of monetisation.
        </p>
        <p>
          Professional teaching preferences are primarily intended to improve the product
          experience. If profile information is ever used for advertising or commercial
          personalisation, that use will be disclosed before it begins, together with the choices
          available to users.
        </p>
      </section>

      <section className={styles.section}>
        <h3>Your information</h3>
        <p>
          As account features are introduced, curricula.live will provide appropriate ways to
          review, correct, export, or delete information associated with an account.
        </p>
        <p>
          More detailed information about these rights, data retention, processing purposes, and
          relevant service providers will be published alongside the features that require them.
        </p>
      </section>

      <section className={styles.section}>
        <h3>Contact</h3>
        <p>
          Questions about privacy or the handling of information can be sent to{" "}
          <a href="mailto:contact@curricula.live">contact@curricula.live</a>.
        </p>
      </section>

      <p className={styles.meta}>Last updated: 11 September 2026</p>
    </>
  );
}

const CONTACT_OPTIONS = [
  {
    title: "General questions",
    description: "Questions, feedback, or general enquiries about curricula.live.",
    href: mailto(
      "curricula.live — General question",
      "Hello,\n\nI have a question about curricula.live:\n\n",
    ),
    action: "Email us",
  },
  {
    title: "Suggest a feature",
    description: "Suggest a feature, workflow, or improvement to the platform.",
    href: mailto(
      "curricula.live — Feature suggestion",
      "Hello,\n\nI would like to suggest the following feature or improvement:\n\n",
    ),
    action: "Email us",
  },
  {
    title: "Report an issue",
    description: "Report a bug or unexpected behaviour in the web application.",
    href: "https://github.com/curricula-live/web/issues/new",
    action: "Open an issue",
  },
  {
    title: "Curriculum & source requests",
    description: "Request support for a curriculum, qualification, topic, or authoritative source.",
    href: mailto(
      "curricula.live — Curriculum or source request",
      "Hello,\n\nI would like to request the following curriculum, topic, or authoritative source:\n\n",
    ),
    action: "Email us",
  },
  {
    title: "Privacy & security",
    description: "Questions about privacy, personal information, or security concerns.",
    href: mailto(
      "curricula.live — Privacy or security",
      "Hello,\n\nI would like to contact you regarding privacy, data, or security:\n\n",
    ),
    action: "Contact privately",
  },
];

function ContactContent() {
  return (
    <>
      <h2 className={styles.title}>Contact</h2>
      <p className={styles.lead}>Choose the most relevant reason for getting in touch.</p>

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
    <ModalDialog
      trigger={label}
      triggerClassName={triggerClassName}
      ariaLabel={label}
      panelClassName={styles.panel}
    >
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
