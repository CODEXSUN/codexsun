import { useState } from "react"

import { TiptapEditor } from "@/components/ui/tiptap"

const defaultContent = `
  <h2>Rich text editor</h2>
  <p>Use the shared Tiptap editor for formatted content such as landing-page copy, policy blocks, and commerce storytelling.</p>
  <ul>
    <li>Bold, italic, underline</li>
    <li>Bullet and ordered lists</li>
    <li>Links and quotes</li>
  </ul>
`

export default function Editor01() {
  const [content, setContent] = useState(defaultContent)

  return (
    <TiptapEditor
      content={content}
      onChange={setContent}
      placeholder="Start writing rich content..."
    />
  )
}
