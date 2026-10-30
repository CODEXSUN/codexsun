import { decodeHTML } from "entities";
import sanitizeHtml from "sanitize-html";

const blockBreaks =
  /<\s*\/?\s*(?:address|article|blockquote|div|h[1-6]|li|ol|p|pre|section|ul)\b[^>]*>/giu;
const lineBreaks = /<\s*br\b[^>]*\/?\s*>/giu;

export function normalizeFrappeEnquiryTitle(value: string | null | undefined) {
  const html = (value ?? "").replace(blockBreaks, " ").replace(lineBreaks, " ");
  const text = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
    nonTextTags: ["script", "style", "textarea", "option", "noscript"]
  })
    .replace(/\s+/gu, " ")
    .trim();

  return Array.from(decodeHTML(text)).slice(0, 255).join("");
}
