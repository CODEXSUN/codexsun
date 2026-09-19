"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-text-style/color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  Code2,
  Eye,
  FileCode2,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { cn } from "../lib/utils";

type EditorMode = "html" | "markdown" | "preview" | "write";
type RichTextEditorProps = {
  className?: string;
  content?: string;
  fullPreview?: boolean;
  initialMode?: EditorMode;
  onChange?: (html: string) => void;
  placeholder?: string;
};

export function RichTextEditor({
  className,
  content,
  fullPreview = false,
  initialMode = "write",
  onChange,
  placeholder = "Start typing...",
}: RichTextEditorProps) {
  const [mode, setMode] = React.useState<EditorMode>(initialMode);
  const [markdown, setMarkdown] = React.useState(() => htmlToMarkdown(content ?? ""));
  const [rawHtml, setRawHtml] = React.useState(content ?? "");
  const editor = useEditor({
    immediatelyRender: false,
    content: content ?? "",
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({ allowBase64: true, HTMLAttributes: { class: "rounded-md border border-border" } }),
      Underline,
      Superscript,
      Subscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Link.configure({ autolink: true, defaultProtocol: "https", openOnClick: false }),
    ],
    editorProps: {
      attributes: { class: "prose prose-sm max-w-none min-h-36 px-4 py-4 focus:outline-none" },
    },
    onUpdate: ({ editor: nextEditor }) => updateHtml(nextEditor.getHTML()),
  });

  React.useEffect(() => {
    if (!editor || content === undefined || content === editor.getHTML()) return;
    editor.commands.setContent(content, { emitUpdate: false });
    setMarkdown(htmlToMarkdown(content));
    setRawHtml(content);
  }, [content, editor]);

  function updateHtml(value: string) {
    setRawHtml(value);
    setMarkdown(htmlToMarkdown(value));
    onChange?.(value);
  }

  function updateMarkdown(value: string) {
    const html = markdownToHtml(value);
    setMarkdown(value);
    editor?.commands.setContent(html, { emitUpdate: false });
    updateHtml(html);
  }

  function updateRawHtml(value: string) {
    editor?.commands.setContent(value, { emitUpdate: false });
    updateHtml(value);
  }

  if (!editor) return null;

  const areaClassName = cn(
    "min-h-36 w-full resize-y bg-background px-4 py-4 font-mono text-sm leading-6 outline-none",
    fullPreview && "min-h-[calc(100svh-18rem)]",
  );

  return (
    <div className={cn("space-y-2", className)} data-slot="rich-text-editor">
      <div className="overflow-hidden rounded-md border border-input bg-background">
        <EditorToolbar editor={editor} mode={mode} setMode={setMode} />
        {mode === "write" ? <EditorContent editor={editor} /> : null}
        {mode === "markdown" ? (
          <textarea
            aria-label="Markdown content"
            className={areaClassName}
            value={markdown}
            onChange={(event) => updateMarkdown(event.target.value)}
          />
        ) : null}
        {mode === "html" ? (
          <textarea
            aria-label="Raw HTML"
            className={areaClassName}
            value={rawHtml}
            onChange={(event) => updateRawHtml(event.target.value)}
          />
        ) : null}
        {mode === "preview" ? (
          <iframe
            className={cn("min-h-36 w-full border-0 bg-background", fullPreview && "min-h-[calc(100svh-18rem)]")}
            sandbox=""
            srcDoc={rawHtml || "<p>No preview yet.</p>"}
            title="Rich text preview"
          />
        ) : null}
      </div>
    </div>
  );
}

function EditorToolbar({
  editor,
  mode,
  setMode,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
}) {
  function link() {
    const href = window.prompt("Enter URL", editor.getAttributes("link").href ?? "");
    if (href === null) return;
    if (!href.trim()) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  function image() {
    const src = window.prompt("Image URL")?.trim();
    if (src) editor.chain().focus().setImage({ src }).run();
  }

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1 border-b border-border/70 px-3 py-1 text-muted-foreground">
      <EditorButton
        active={editor.isActive("bold")}
        label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </EditorButton>
      <EditorButton
        active={editor.isActive("italic")}
        label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </EditorButton>
      <EditorButton
        active={editor.isActive("strike")}
        label="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough />
      </EditorButton>
      <EditorButton
        active={editor.isActive("code")}
        label="Inline code"
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code2 />
      </EditorButton>
      <EditorButton
        active={editor.isActive("underline")}
        label="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon />
      </EditorButton>
      <EditorButton
        active={editor.isActive("highlight")}
        label="Highlight"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
      >
        <Highlighter />
      </EditorButton>
      <EditorButton
        active={editor.isActive("superscript")}
        label="Superscript"
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      >
        <SuperscriptIcon />
      </EditorButton>
      <EditorButton
        active={editor.isActive("subscript")}
        label="Subscript"
        onClick={() => editor.chain().focus().toggleSubscript().run()}
      >
        <SubscriptIcon />
      </EditorButton>
      <EditorButton active={editor.isActive("link")} label="Link" onClick={link}>
        <Link2 />
      </EditorButton>
      <ToolbarDivider />
      <select
        aria-label="Heading level"
        className="h-8 rounded-md bg-transparent px-1 text-xs text-foreground outline-none hover:bg-muted"
        value={headingLevel(editor)}
        onChange={(event) => setHeading(editor, event.target.value)}
      >
        <option value="paragraph">P</option>
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <option key={level} value={level}>
            H{level}
          </option>
        ))}
      </select>
      <EditorButton
        active={editor.isActive("bulletList")}
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </EditorButton>
      <EditorButton
        active={editor.isActive("orderedList")}
        label="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </EditorButton>
      <EditorButton
        active={editor.isActive("taskList")}
        label="Task list"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <List />
      </EditorButton>
      <EditorButton
        active={editor.isActive("blockquote")}
        label="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote />
      </EditorButton>
      <EditorButton
        active={editor.isActive("codeBlock")}
        label="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <span className="font-mono text-[11px]">```</span>
      </EditorButton>
      <ToolbarDivider />
      <EditorButton
        active={editor.isActive({ textAlign: "left" })}
        label="Align left"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft />
      </EditorButton>
      <EditorButton
        active={editor.isActive({ textAlign: "center" })}
        label="Align center"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter />
      </EditorButton>
      <EditorButton
        active={editor.isActive({ textAlign: "right" })}
        label="Align right"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight />
      </EditorButton>
      <EditorButton label="Add image" onClick={image}>
        <ImagePlus />
      </EditorButton>
      <label
        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-muted"
        title="Text color"
      >
        <span className="sr-only">Text color</span>
        <input
          aria-label="Text color"
          className="size-4 cursor-pointer border-0 bg-transparent p-0"
          type="color"
          onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
        />
      </label>
      <ToolbarDivider />
      <EditorButton disabled={!editor.can().undo()} label="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 />
      </EditorButton>
      <EditorButton disabled={!editor.can().redo()} label="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 />
      </EditorButton>
      <ToolbarDivider />
      <EditorButton active={mode === "write"} label="Write" onClick={() => setMode("write")}>
        <Bold />
      </EditorButton>
      <EditorButton active={mode === "markdown"} label="Markdown" onClick={() => setMode("markdown")}>
        <FileCode2 />
      </EditorButton>
      <EditorButton active={mode === "html"} label="Raw HTML" onClick={() => setMode("html")}>
        <Braces />
      </EditorButton>
      <EditorButton active={mode === "preview"} label="Preview" onClick={() => setMode("preview")}>
        <Eye />
      </EditorButton>
    </div>
  );
}

function EditorButton({
  active,
  children,
  disabled,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        active && "bg-muted text-foreground",
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

function headingLevel(editor: NonNullable<ReturnType<typeof useEditor>>) {
  return [1, 2, 3, 4, 5, 6].find((level) => editor.isActive("heading", { level })) ?? "paragraph";
}

function setHeading(editor: NonNullable<ReturnType<typeof useEditor>>, value: string) {
  if (value === "paragraph") editor.chain().focus().setParagraph().run();
  else
    editor
      .chain()
      .focus()
      .toggleHeading({ level: Number(value) as 1 | 2 | 3 | 4 | 5 | 6 })
      .run();
}

function htmlToMarkdown(html: string) {
  if (!html.trim() || typeof DOMParser === "undefined") return "";
  const document = new DOMParser().parseFromString(html, "text/html");
  return [...document.body.childNodes].map(markdownNode).filter(Boolean).join("\n\n").trim();
}

function markdownNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return "";
  const value = [...node.childNodes].map(markdownNode).join("");
  if (/^H[1-6]$/u.test(node.tagName)) return `${"#".repeat(Number(node.tagName[1]))} ${value}`;
  if (node.tagName === "STRONG" || node.tagName === "B") return `**${value}**`;
  if (node.tagName === "EM" || node.tagName === "I") return `*${value}*`;
  if (node.tagName === "CODE") return `\`${value}\``;
  if (node.tagName === "LI") return `- ${value}`;
  if (node.tagName === "BR") return "\n";
  return value;
}

function markdownToHtml(markdown: string) {
  return markdown
    .split(/\n{2,}/u)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const escaped = block.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      const heading = escaped.match(/^(#{1,6})\s+(.+)$/u);
      if (heading) return `<h${heading[1]!.length}>${heading[2]}</h${heading[1]!.length}>`;
      if (escaped.split("\n").every((line) => line.startsWith("- ")))
        return `<ul>${escaped
          .split("\n")
          .map((line) => `<li>${line.slice(2)}</li>`)
          .join("")}</ul>`;
      return `<p>${escaped.replaceAll("\n", "<br>")}</p>`;
    })
    .join("");
}
