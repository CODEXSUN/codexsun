import type { DesignSystemVariant } from "../../types";

export const shadcnVariant: DesignSystemVariant = {
  id: "shadcn",
  name: "Shadcn",
  description: "Clean shadcn-style neutral palette for baseline product UI.",
  marker: "cx-design-shadcn",
  radius: "7px",
  density: "Comfortable",
  palette: ["#ffffff", "#171717", "#606067", "#c9c9cc"]
};

export const neutralVariant: DesignSystemVariant = {
  id: "neutral",
  name: "Neutral",
  description: "Quiet grayscale workspace palette for dense admin screens.",
  marker: "cx-design-neutral",
  radius: "7px",
  density: "Balanced",
  palette: ["#ffffff", "#0f172a", "#526170", "#b7c2ce"]
};

export const orangeVariant: DesignSystemVariant = {
  id: "orange",
  name: "Orange",
  description: "Warm amber/orange controls for operational review flows.",
  marker: "cx-design-orange",
  radius: "8px",
  density: "Comfortable",
  palette: ["#fff7ed", "#9a3412", "#fb923c", "#fed7aa"]
};

export const greenVariant: DesignSystemVariant = {
  id: "green",
  name: "Green",
  description: "Fresh emerald workspace palette for active business surfaces.",
  marker: "cx-design-green",
  radius: "8px",
  density: "Comfortable",
  palette: ["#f0fdf4", "#166534", "#10b981", "#bbf7d0"]
};

export const blueVariant: DesignSystemVariant = {
  id: "blue",
  name: "Blue",
  description: "Calm blue system palette for platform and support workflows.",
  marker: "cx-design-blue",
  radius: "8px",
  density: "Comfortable",
  palette: ["#eff6ff", "#1d4ed8", "#60a5fa", "#bfdbfe"]
};

export const purpleVariant: DesignSystemVariant = {
  id: "purple",
  name: "Purple",
  description: "Soft violet palette for AI, automation, and workspace tools.",
  marker: "cx-design-purple",
  radius: "8px",
  density: "Comfortable",
  palette: ["#faf5ff", "#7e22ce", "#a855f7", "#e9d5ff"]
};

export const graphiteVariant: DesignSystemVariant = {
  id: "graphite",
  name: "Graphite",
  description: "Elegant graphite and teal palette for premium admin desks.",
  marker: "cx-design-graphite",
  radius: "8px",
  density: "Balanced",
  palette: ["#f8fafc", "#111827", "#0f766e", "#cbd5e1"]
};
