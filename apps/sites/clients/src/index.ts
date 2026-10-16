export { CodexsunSite } from "./clients/codexsun/index.js";
export { LogicxSite } from "./clients/logicx/index.js";
export { TechMediaSite } from "./clients/techmedia/index.js";

export type ClientPortfolioDefinition = {
  defaultPort: number;
  description: string;
  name: string;
  primaryDomain: string;
  slug: string;
  themeKey: string;
};

export const clientPortfolios: ClientPortfolioDefinition[] = [
  {
    defaultPort: 7130,
    description: "Flagship corporate engineering and technology portfolio site.",
    name: "CODEXSUN",
    primaryDomain: "codexsun.com",
    slug: "codexsun",
    themeKey: "portfolio-codexsun"
  },
  {
    defaultPort: 7131,
    description: "Enterprise operations, ERP, and integration solutions portfolio.",
    name: "LogicX ERP",
    primaryDomain: "logicx.in",
    slug: "logicx",
    themeKey: "portfolio-logicx"
  },
  {
    defaultPort: 7132,
    description: "Technology gear, custom computers, and retail services portfolio.",
    name: "Tech Media",
    primaryDomain: "techmedia.in",
    slug: "techmedia",
    themeKey: "portfolio-techmedia"
  }
];
