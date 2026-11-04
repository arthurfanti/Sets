import styles from "./Badge.module.css";

interface BadgeProps {
  children: string;
  /** "count" labels a group ("2 prontas"); "status" marks a row as the active one. */
  tone?: "count" | "status";
}

export function Badge({ children, tone = "count" }: BadgeProps) {
  return <span className={tone === "status" ? styles.status : styles.count}>{children}</span>;
}
