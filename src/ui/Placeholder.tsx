import type { ReactNode } from "react";
import styles from "./Placeholder.module.css";

interface PlaceholderProps {
  title: string;
  children: ReactNode;
}

/**
 * Temporary screen shell for ticket #1: gives every route a real, reachable
 * page with the header treatment the finished screens will use.
 */
export function Placeholder({ title, children }: PlaceholderProps) {
  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
      </header>
      <div className={styles.body}>{children}</div>
    </main>
  );
}
