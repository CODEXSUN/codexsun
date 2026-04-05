import { TiptapEditor } from "@/components/ui/tiptap"

const readOnlyContent = `
  <h2>Read-only output</h2>
  <p>This variant shows how the same editor surface renders formatted content without the toolbar.</p>
  <blockquote>Use this for preview cards, publishing review, and content QA before save.</blockquote>
`

export default function Editor02() {
  return (
    <TiptapEditor
      content={readOnlyContent}
      editable={false}
      className="bg-muted/20"
    />
  )
}
