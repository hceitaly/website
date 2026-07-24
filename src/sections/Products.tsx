import Section from "../components/Section";
import CardGrid from "../components/CardGrid";
import { PRODUCTS } from "../data/content";

export default function Products() {
  return (
    <Section
      id="prodotti"
      eyebrow="I Nostri Prodotti"
      title={
        <>
          Tecnologie <em>integrate</em>
        </>
      }
      intro="Un assortimento selezionato con criteri tecnici e applicativi, per garantire coerenza tra i componenti e un'integrazione efficace tra le diverse tecnologie."
    >
      <CardGrid items={PRODUCTS} />
    </Section>
  );
}
