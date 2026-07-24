import Section from "../components/Section";
import CardGrid from "../components/CardGrid";
import { OFFERING_STEPS } from "../data/content";

export default function Offerings() {
  return (
    <Section
      id="cosa-offriamo"
      theme="light"
      eyebrow="Cosa Offriamo"
      title={
        <>
          Un percorso, <em>non solo prodotti</em>
        </>
      }
      intro="Affianchiamo aziende e privati con un'offerta integrata di prodotti e servizi nei settori dell'efficienza energetica, della mobilità elettrica e della sicurezza. Non ci limitiamo alla fornitura: accompagniamo il cliente in ogni fase, dalla valutazione iniziale al supporto post-vendita."
    >
      <CardGrid items={OFFERING_STEPS} theme="light" />
    </Section>
  );
}
