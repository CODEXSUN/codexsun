import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./shared/public-base.css";
import ClientSurface from "@sites-client-entry";

const root = document.getElementById("root")!;
const surface = (
  <React.StrictMode>
    <ClientSurface />
  </React.StrictMode>
);
if (root.hasChildNodes()) hydrateRoot(root, surface);
else createRoot(root).render(surface);
