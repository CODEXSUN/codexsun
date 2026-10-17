export { LogicxSite } from "./clients/logicx/index.js";
export { RamutexSite } from "./clients/ramutex/site.js";
export { TirupurConnectSite } from "./clients/tirupurconnect/site.js";

export type ClientPortfolioDefinition = {
  defaultPort: number;
  description: string;
  name: string;
  primaryDomain: string;
  slug: string;
  themeKey: string;
};

export const clientPortfolios: ClientPortfolioDefinition[] = [
  {defaultPort:7040,description:"Textile business discovery, associations and sourcing, connected to the Tirupur Connect tenant on CODEXSUN.",name:"Tirupur Connect",primaryDomain:"tirupurconnect.com",slug:"tirupurconnect",themeKey:"portfolio-tirupurconnect"},
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
    description: "Textile processing and specialty fabric finishes in Tirupur, Tamil Nadu.",
    name: "Ramu Tex Processors India Inc",
    primaryDomain: "ramumag.com",
    slug: "ramutex",
    themeKey: "portfolio-ramutex"
  }
];
