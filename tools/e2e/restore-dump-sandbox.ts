export function restoreDumpInSandbox(dump: string, sourceName: string, sandboxName: string) {
  const original = `\`${sourceName}\``;
  const replacement = `\`${sandboxName}\``;
  let declarations = 0;
  const restored = dump
    .replace(/^\/\*M!999999.*\r?\n/, "")
    .split(/\r?\n/)
    .map((line) => {
      if (
        (line.startsWith("CREATE DATABASE ") || line.startsWith("USE ")) &&
        line.includes(original)
      ) {
        declarations += 1;
        return line.replace(original, replacement);
      }
      return line;
    })
    .join("\n");
  if (declarations !== 2) {
    throw new Error("Expected one CREATE DATABASE and one USE statement in the dump.");
  }
  return restored;
}
