import { createRoot } from "react-dom/client";
import { App } from "./App";
import { WebApp } from "./web/WebApp";
import "./styles.css";
const desktop =
  "__TAURI_INTERNALS__" in window ||
  location.protocol === "tauri:" ||
  location.hostname === "tauri.localhost";
createRoot(document.getElementById("root")!).render(desktop ? <App /> : <WebApp />);
