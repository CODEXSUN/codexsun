import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AgentChatMarkdown } from '../src/modules/agent-chat/agent-chat.markdown'

test('composes assistant Markdown as safe semantic HTML', () => {
  const output = renderToStaticMarkup(
    createElement(AgentChatMarkdown, {
      content: `## Result

- **Fast** feedback
- Inline \`code\`

| Host | State |
| --- | --- |
| Desktop | Ready |

<script>alert('unsafe')</script>`,
    }),
  )

  assert.match(output, /<h2[^>]*>Result<\/h2>/)
  assert.match(output, /<ul[^>]*>/)
  assert.match(output, /<strong>Fast<\/strong>/)
  assert.match(output, /<code[^>]*>code<\/code>/)
  assert.match(output, /<table[^>]*>/)
  assert.doesNotMatch(output, /<script/)
  assert.doesNotMatch(output, /unsafe/)
})
