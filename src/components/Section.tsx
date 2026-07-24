import { useRef, type ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";
import styles from "./Section.module.css";

type SectionProps = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  theme?: "dark" | "light";
  children?: ReactNode;
};

export default function Section({
  id,
  eyebrow,
  title,
  intro,
  theme = "dark",
  children,
}: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <section
      id={id}
      ref={ref}
      className={`${styles.section} ${theme === "light" ? styles.light : ""}`}
    >
      <div className="container">
        <header className={styles.head}>
          <span data-reveal className="eyebrow">
            {eyebrow}
          </span>
          <h2 data-reveal className={styles.title}>
            {title}
          </h2>
          {intro && (
            <p data-reveal className={styles.intro}>
              {intro}
            </p>
          )}
        </header>
        {children}
      </div>
    </section>
  );
}
