import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@/assets/css/index.css"

import AppShell from "./app-shell"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppShell />
  </StrictMode>
)
