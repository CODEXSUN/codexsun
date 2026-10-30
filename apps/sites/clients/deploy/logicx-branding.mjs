import { readFile } from "node:fs/promises";

export async function logicxBrandAssets(brand) {
  const source = await readFile(new URL("./logicx-mark.svg", import.meta.url), "utf8");
  const coloredSource = source.replace(/#011C3B|#021E3D/g, "#004632").replace(/#0284FA/g, "#60DFA0");
  const paths = coloredSource.match(/<path\b[^>]*\/>/g).join("");
  const name = String(brand).replace(
    /[<>&"']/g,
    (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]
  );
  const mark = (dark, x, y, width, height) =>
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 11769.97 8990.77" fill-rule="evenodd" clip-rule="evenodd">${dark ? paths.replace(/#004632/g, "#F3F8F2") : paths}</svg>`;
  const logo = (dark) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="72" viewBox="0 0 260 72"><title>${name}</title>${mark(dark, 0, 12, 61, 47)}<text x="79" y="48" fill="${dark ? "#F3F8F2" : "#004632"}" font-family="Arial,sans-serif" font-size="33" font-weight="600" letter-spacing="-1">${name}</text></svg>`;
  return {
    logo: logo(false),
    darkLogo: logo(true),
    mark: coloredSource,
    darkMark: coloredSource.replace(/#004632/g, "#F3F8F2"),
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="#F1F7EF"/>${mark(false, 9, 16, 62, 48)}</svg>`,
    social: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#F7F9F4"/><circle cx="1120" cy="80" r="340" fill="#60DFA0" opacity=".07"/>${mark(false, 90, 170, 240, 184)}<text x="385" y="280" font-family="Arial,sans-serif" font-size="88" font-weight="600" fill="#004632">${name}</text><text x="391" y="334" font-family="Arial,sans-serif" font-size="22" letter-spacing="7" fill="#526B60">SOFTWARE STUDIO</text><text x="95" y="478" font-family="Arial,sans-serif" font-size="30" fill="#294E40">Software. Applications. Business automation.</text></svg>`
  };
}

