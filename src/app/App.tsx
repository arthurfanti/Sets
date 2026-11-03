import { useCallback, useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { updateController } from "@/app/pwa";
import { router } from "@/app/router";
import { type OpenFailureCause, openFailureCause } from "@/db/open-failure";
import { getDatabase } from "@/db/repositories";
import { UpdateBanner } from "@/ui/components/UpdateBanner";
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
      await getDatabase();
      setOpen(true);
    } catch (error) {
      setFailure(openFailureCause(error));
    }
  }, []);

  useEffect(() => {
    void attemptOpen();
  }, [attemptOpen]);

  // Starting or ending a Session always navigates, so the notice's permission
  // is re-decided on every route change and nowhere else. The banner sits
  // beside the router rather than inside a route: it survives every screen.
  useEffect(
    () =>
      router.subscribe(() => {
        void updateController.refresh();
      }),
    [],
  );

  if (failure) {
    return <GateScreen cause={failure} onRetry={() => void attemptOpen()} />;
  }

  if (!open) return null;

  return (
    <>
      <RouterProvider router={router} />
      <UpdateBanner controller={updateController} />
    </>
  );
}
