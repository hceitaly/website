import Continuita from "../components/iso/Continuita";
import styles from "./IsoTest.module.css";

/**
 * TEMPORARY preview page for the isometric illustrations — delete once the set
 * is approved. Currently renders Continuità for evaluation.
 */
export default function IsoTest() {
  return (
    <div className={styles.stage}>
      <Continuita className={styles.svg} />
    </div>
  );
}
