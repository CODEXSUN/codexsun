import { useEffect } from "react";

export function useClientDocument(title: string, description: string, themeColor: string) {
  useEffect(() => {
    document.title = title;

    const descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const nextDescription = descriptionMeta ?? document.createElement("meta");
    const nextTheme = themeMeta ?? document.createElement("meta");

    nextDescription.name = "description";
    nextDescription.content = description;
    nextTheme.name = "theme-color";
    nextTheme.content = themeColor;

    if (!descriptionMeta) document.head.appendChild(nextDescription);
    if (!themeMeta) document.head.appendChild(nextTheme);
  }, [description, themeColor, title]);
}
