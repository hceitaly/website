import Icon from "./Icon";
import type { Card } from "../data/content";
import styles from "./CardGrid.module.css";

type CardGridProps = {
  items: Card[];
  theme?: "dark" | "light";
};

export default function CardGrid({ items, theme = "dark" }: CardGridProps) {
  return (
    <div className={`${styles.grid} ${theme === "light" ? styles.light : ""}`}>
      {items.map((item) => (
        <article data-reveal key={item.title} className={styles.card}>
          <span className={styles.iconWrap}>
            <Icon name={item.icon} className={styles.icon} />
          </span>
          <h3 className={styles.cardTitle}>{item.title}</h3>
          <p className={styles.cardText}>{item.text}</p>
        </article>
      ))}
    </div>
  );
}
