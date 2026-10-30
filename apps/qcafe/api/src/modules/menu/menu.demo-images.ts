import sharp from "sharp";
export async function demoFoodImage(family: string, tint: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><defs><radialGradient id="plate"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#e8e5db"/></radialGradient><filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-opacity=".16"/></filter></defs><rect width="480" height="320" fill="${tint}"/><path d="M0 35L480 260M0 150L360 320" stroke="#fff" stroke-opacity=".15" stroke-width="36"/><ellipse cx="240" cy="168" rx="170" ry="125" fill="url(#plate)" filter="url(#shadow)"/><ellipse cx="240" cy="168" rx="151" ry="108" fill="#4d7c3b"/><path d="M90 170H390M240 62V274M120 113L360 222M120 223L360 113" stroke="#7ba35c" stroke-width="2" opacity=".7"/>${dish(family)}<g filter="url(#shadow)"><circle cx="125" cy="242" r="30" fill="#dadbd4"/><circle cx="125" cy="242" r="24" fill="#f4e8cb"/><circle cx="367" cy="238" r="30" fill="#dadbd4"/><circle cx="367" cy="238" r="24" fill="#b94c27"/></g><g fill="#448c38"><ellipse cx="125" cy="239" rx="7" ry="3" transform="rotate(-25 125 239)"/><ellipse cx="366" cy="235" rx="7" ry="3" transform="rotate(25 366 235)"/></g></svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 88 }).toBuffer();
}
function dish(family: string) {
  if (family === "idli")
    return '<g fill="#fff9e9" stroke="#e9ddbd" stroke-width="2" filter="url(#shadow)"><ellipse cx="180" cy="146" rx="55" ry="39"/><ellipse cx="280" cy="146" rx="55" ry="39"/><ellipse cx="232" cy="202" rx="55" ry="39"/></g>';
  if (family === "dosa")
    return '<path d="M116 107Q250 55 364 129L319 218Q233 248 131 190Z" fill="#daa339" stroke="#b67a24" stroke-width="3" filter="url(#shadow)"/><path d="M135 113Q234 89 340 132M144 143Q239 120 330 156M155 173Q243 152 318 182" fill="none" stroke="#efcb75" stroke-width="5"/><g fill="#9b5e22" opacity=".5"><circle cx="207" cy="139" r="5"/><circle cx="260" cy="183" r="4"/><circle cx="293" cy="127" r="6"/><circle cx="173" cy="184" r="4"/></g>';
  if (family === "vada")
    return '<g fill="#b76620" stroke="#e19a3a" stroke-width="7" filter="url(#shadow)"><circle cx="190" cy="144" r="45"/><circle cx="285" cy="144" r="45"/><circle cx="238" cy="210" r="45"/></g><g fill="#4d7c3b"><circle cx="190" cy="144" r="13"/><circle cx="285" cy="144" r="13"/><circle cx="238" cy="210" r="13"/></g>';
  if (family === "poori")
    return '<g fill="#e4b35d" stroke="#bd842d" stroke-width="3" filter="url(#shadow)"><ellipse cx="191" cy="153" rx="62" ry="52"/><ellipse cx="291" cy="175" rx="62" ry="52"/></g><path d="M150 143Q190 115 226 142M249 166Q289 138 328 165" fill="none" stroke="#f6d794" stroke-width="5"/>';
  if (family === "coffee" || family === "tea" || family === "milk")
    return `<ellipse cx="240" cy="224" rx="83" ry="26" fill="#b8babb"/><path d="M190 106H290L279 218Q240 245 201 218Z" fill="#d1d6d3" stroke="#8e9694" stroke-width="3"/><ellipse cx="240" cy="107" rx="51" ry="18" fill="${family === "milk" ? "#faf8df" : family === "tea" ? "#b87b3b" : "#945b30"}"/><path d="M214 77Q199 59 215 39M243 77Q228 59 244 39M272 77Q257 59 273 39" fill="none" stroke="#fff" stroke-width="5" opacity=".8"/>`;
  const color =
    family === "curd"
      ? "#fff6dc"
      : family === "sweet"
        ? "#eaa136"
        : family === "lemon"
          ? "#e8c342"
          : "#dfc18b";
  return `<ellipse cx="240" cy="168" rx="103" ry="75" fill="${color}" filter="url(#shadow)"/>${Array.from(
    { length: 48 },
    (_, i) => {
      const x = 161 + ((i * 37) % 155),
        y = 119 + ((i * 23) % 93);
      return `<ellipse cx="${x}" cy="${y}" rx="5" ry="2" fill="${i % 4 === 0 ? "#507334" : "#fff2d1"}" transform="rotate(${(i * 31) % 180} ${x} ${y})"/>`;
    }
  ).join(
    ""
  )}<g fill="#a33b21"><circle cx="187" cy="158" r="5"/><circle cx="278" cy="194" r="5"/><circle cx="245" cy="139" r="5"/></g>`;
}
