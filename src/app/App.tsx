import { useCallback, useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { readyDatabase } from "@/db/database";
import { type OpenFailureCause, openFailureCause } from "@/db/open-failure";
import { GateScreen } from "@/ui/screens/GateScreen";

/**
 * The database opens before the router, so a refusal never flashes a Home
 * screen whose buttons cannot save. Retry re-opens with a fresh attempt; the
 * gate's reset deletes the database and reloads into a first run.
 */
export function App() {
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState<OpenFailureCause | null>(null);

  const attemptOpen = useCallback(async () => {
    setOpen(false);
    setFailure(null);
    try {
      await readyDatabase();
      setOpen(true);
    } catch (error) {
      setFailure(openFailureCause(error));
    }
  }, []);

  useEffect(() => {
    void attemptOpen();
  }, [attemptOpen]);

  if (failure) {
    return <GateScreen cause={failure} onRetry={() => void attemptOpen()} />;
  }

  if (!open) return null;

  return <RouterProvider router={router} />;
}
