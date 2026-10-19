import { createRoot } from "react-dom/client";
import { DESIGN_SYSTEM_NAME } from "@codexsun/ui/design-system";
import "@codexsun/ui/styles.css";
import "./styles.css";
import { SysWork } from "./sys-work";

document.documentElement.setAttribute("data-design-system", DESIGN_SYSTEM_NAME);
document.documentElement.setAttribute("data-design-variant", "default");

createRoot(document.getElementById("root") as HTMLElement).render(<SysWork />);
