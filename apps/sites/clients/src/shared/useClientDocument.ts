import { useEffect } from "react";

export function useClientDocument(title: string, description: string, themeColor: string) {
  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, "");
    const label: Record<string, string> = {
      "/about": "About",
      "/services": "Services",
      "/contact": "Contact",
      "/blogs": "Blog"
    };
    const rendered = Boolean(document.getElementById("codexsun-sites-publication"));
    if (!rendered) document.title = label[path] ? `${label[path]} | ${title}` : title;

    const descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const nextDescription = descriptionMeta ?? document.createElement("meta");
    const nextTheme = themeMeta ?? document.createElement("meta");

    nextDescription.name = "description";
    if (!rendered) nextDescription.content = description;
    nextTheme.name = "theme-color";
    nextTheme.content = themeColor;

    if (!descriptionMeta) document.head.appendChild(nextDescription);
    if (!themeMeta) document.head.appendChild(nextTheme);
  }, [description, themeColor, title]);
}
