import { type ReactNode, useEffect, useRef } from "react";
import styles from "./Sheet.module.css";

interface SheetProps {
  title: string;
  onClose: () => void;
  /** Renders a back control in the header. Without it, closing leaves the sheet. */
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * The app's one overlay: a bottom sheet on a dimmed backdrop. Phone-first, so
 * it rises from the bottom edge, keeps its own scroll, and gives the panel
 * focus on open and the previous control focus on close.
 */
export function Sheet({ title, onClose, onBack, children, footer }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the backdrop is a convenience for a pointer; the labelled Fechar button is the accessible exit
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className={styles.header}>
          {onBack ? (
            <button type="button" className={styles.back} onClick={onBack}>
              Voltar
            </button>
          ) : (
            <span className={styles.spacer} />
          )}
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>
        <div className={styles.content}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}
