import "@codexsun/ui/assets";
import { createRoot } from "react-dom/client";
import { App } from "./app.js";

const root = document.getElementById("root");
if (!root) throw new Error("Docs web requires a root element.");

createRoot(root).render(<App />);
