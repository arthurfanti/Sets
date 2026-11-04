import styles from "./Badge.module.css";

interface BadgeProps {
  children: string;
}

/** Labels a group with its count: "2 prontas", "3 minhas". */
export function Badge({ children }: BadgeProps) {
  return <span className={styles.count}>{children}</span>;
}
