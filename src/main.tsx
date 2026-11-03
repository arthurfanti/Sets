import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { updateController } from "@/app/pwa";
import { router } from "@/app/router";
import { requestPersistentStorage } from "@/db/storage";
import { UpdateBanner } from "@/ui/components/UpdateBanner";
import "@/ui/global.css";

// Asked before any Session can exist, and never awaited: a refusal must not
// delay or block startup, and About is where the answer is disclosed.
requestPersistentStorage();

// Starting or ending a Session always navigates, so the notice's permission is
// re-decided on every route change and nowhere else. The banner sits beside the
// router rather than inside a route: it must survive every screen change.
router.subscribe(() => {
  void updateController.refresh();
});

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root is missing from the document.");
}

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
    <UpdateBanner controller={updateController} />
  </StrictMode>,
);
