import { useSyncExternalStore } from "react";
import type { UpdateController } from "@/app/update";
import styles from "./UpdateBanner.module.css";

interface UpdateBannerProps {
  controller: UpdateController;
}

/**
 * The one surface a new build has. It renders from the controller's state, so
 * it cannot show while a Session is open — the controller reports `suppressed`
 * and there is nothing to draw. Applying is a reload into the waiting build,
 * not an in-place swap, so no screen is ever left half-updated.
 */
export function UpdateBanner({ controller }: UpdateBannerProps) {
  const state = useSyncExternalStore(controller.subscribe, controller.getState);

  if (state.kind === "idle" || state.kind === "suppressed" || state.kind === "dismissed") {
    return null;
  }

  const applying = state.kind === "applying";
  const failed = state.kind === "failed";

  return (
    <div className={styles.banner} role="status">
      <p className={styles.message}>
        {failed
          ? "Não foi possível atualizar. Você continua na versão atual."
          : "Nova versão disponível."}
      </p>
      {applying ? null : (
        <button className={styles.dismiss} type="button" onClick={controller.dismiss}>
          Depois
        </button>
      )}
      <button
        className={styles.action}
        disabled={applying}
        type="button"
        onClick={() => void controller.apply()}
      >
        {applying ? "Atualizando…" : failed ? "Tentar de novo" : "Atualizar"}
      </button>
    </div>
  );
}
