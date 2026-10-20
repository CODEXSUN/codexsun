import { createContext, useContext, type ComponentProps, type ReactNode } from "react";

type Language = "ta" | "en";

const SportsLanguageContext = createContext<Language>("ta");

export function SportsLanguageProvider({ language, children }: { language: Language; children: ReactNode }) {
  return <SportsLanguageContext.Provider value={language}>{children}</SportsLanguageContext.Provider>;
}

export function sportsLocalizedHref(href: string, language: Language) {
  if (language !== "en" || !href.startsWith("/") || href.startsWith("//")) return href;
  if (href === "/") return "/en";
  return href.startsWith("/en/") || href === "/en" ? href : `/en${href}`;
}

export function SportsLink({ href, ...props }: ComponentProps<"a">) {
  const language = useContext(SportsLanguageContext);
  return <a href={href ? sportsLocalizedHref(href, language) : href} {...props} />;
}
