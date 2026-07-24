import Section from "../components/Section";
import CardGrid from "../components/CardGrid";
import { OBJECTIVES } from "../data/content";

export default function About() {
  return (
    <Section
      id="chi-siamo"
      eyebrow="Chi Siamo"
      title={
        <>
          Molto più di <em>un'azienda</em>
        </>
      }
      intro="Nata nel 2008, H.C.E. opera nella distribuzione specializzata di tecnologie per impianti fotovoltaici, accumulo e climatizzazione. Un punto di riferimento affidabile per la transizione energetica e la mobilità sostenibile, con un'offerta rivolta a installatori e operatori del settore."
    >
      <CardGrid items={OBJECTIVES} />
    </Section>
  );
}
