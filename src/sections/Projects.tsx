import Section from "../components/Section";
import Icon from "../components/Icon";
import styles from "./Projects.module.css";

const CASES = [
  {
    tag: "Caso studio 01",
    title: "Impianto fotovoltaico industriale",
    text: "Sezione in preparazione — presto il dettaglio di un progetto realizzato.",
  },
  {
    tag: "Caso studio 02",
    title: "Accumulo e mobilità elettrica",
    text: "Sezione in preparazione — presto il dettaglio di un progetto realizzato.",
  },
];

export default function Projects() {
  return (
    <Section
      id="progetti"
      eyebrow="I Nostri Progetti"
      title={
        <>
          Soluzioni <em>in campo</em>
        </>
      }
      intro="Progetti reali che raccontano il nostro approccio: dalla scelta dei componenti all'integrazione tra le tecnologie."
    >
      <div className={styles.grid}>
        {CASES.map((c) => (
          <article data-reveal key={c.tag} className={styles.card}>
            <div className={styles.media} aria-hidden="true">
              <Icon name="box" className={styles.mediaIcon} />
              <span className={styles.soon}>In arrivo</span>
            </div>
            <div className={styles.body}>
              <span className={styles.tag}>{c.tag}</span>
              <h3 className={styles.cardTitle}>{c.title}</h3>
              <p className={styles.cardText}>{c.text}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
