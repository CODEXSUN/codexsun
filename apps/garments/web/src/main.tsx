import "@codexsun/ui/globals.css";
import { createRoot } from "react-dom/client";
import { App } from "./app.js";

const root = document.getElementById("root");
if (!root) throw new Error("Garments web requires a root element.");

createRoot(root).render(<App />);
