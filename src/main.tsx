import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Skip React only if smartlink redirect was confirmed and triggered
if (!(window as any).__SMARTLINK_INTERCEPTED__) {
  createRoot(document.getElementById("root")!).render(<App />);
}
