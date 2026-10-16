export function enquiryTableText(value: string | null | undefined) {
  if (!value) return "";

  const body = new DOMParser().parseFromString(value, "text/html").body;
  body.querySelectorAll("script, style, template, noscript").forEach((node) => node.remove());
  body.querySelectorAll("br, hr").forEach((node) => node.replaceWith(" "));
  body
    .querySelectorAll("p, div, li, tr, td, th, blockquote, h1, h2, h3, h4, h5, h6")
    .forEach((node) => node.after(" "));

  return (body.textContent ?? "").replace(/\s+/gu, " ").trim();
}
