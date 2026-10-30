function inlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function MarkdownArticle({ content }: { content: string }) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="article-markdown">
      {blocks.map((block, index) => {
        if (block.startsWith("### ")) {
          return <h3 key={index}>{inlineCode(block.slice(4))}</h3>;
        }
        if (block.startsWith("## ")) {
          return <h2 key={index}>{inlineCode(block.slice(3))}</h2>;
        }
        if (block.startsWith("# ")) {
          return <h2 key={index}>{inlineCode(block.slice(2))}</h2>;
        }
        if (block.startsWith("> ")) {
          return <blockquote key={index}>{inlineCode(block.replace(/^>\s?/gm, ""))}</blockquote>;
        }
        if (block.startsWith("```")) {
          return (
            <pre key={index}>
              <code>{block.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "")}</code>
            </pre>
          );
        }
        if (/^- /.test(block)) {
          return (
            <ul key={index}>
              {block.split("\n").map((item, itemIndex) => (
                <li key={itemIndex}>{inlineCode(item.replace(/^- /, ""))}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{inlineCode(block)}</p>;
      })}
    </div>
  );
}
