import { renderToString } from "react-dom/server";
import { TenkasiSportsSite } from "./site";
import { SportsPages } from "./sports.pages";

export function prerenderSportsPage(path: string, language: "ta" | "en") {
  return renderToString(
    <TenkasiSportsSite
      prerenderPath={path}
      prerenderLanguage={language}
      prerenderPages={SportsPages}
    />
  );
}
