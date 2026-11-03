import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { requestPersistentStorage } from "@/db/storage";
import "@/ui/global.css";

// Asked before any Session can exist, and never awaited: a refusal must not
// delay or block startup, and About is where the answer is disclosed.
requestPersistentStorage();

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root is missing from the document.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
