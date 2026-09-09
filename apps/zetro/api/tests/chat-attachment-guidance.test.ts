import assert from 'node:assert/strict'
import test from 'node:test'
import { toCodexPrompt } from '../src/modules/chat/chat.provider.js'

test('guides Codex to inspect attached files and images in the connected scope', () => {
  const prompt = toCodexPrompt(
    [
      {
        attachments: [
          {
            dataUrl: 'data:text/plain,requirements',
            id: 'requirements',
            mimeType: 'text/plain',
            name: 'requirements.txt',
          },
          {
            dataUrl: 'data:image/png;base64,c2NyZWVuc2hvdA==',
            id: 'screenshot',
            mimeType: 'image/png',
            name: 'screen.png',
          },
        ],
        content: 'Implement what these inputs require.',
        role: 'user',
      },
    ],
    { application: 'Platform', folderPath: 'apps/platform/web', module: 'Desk' },
  )

  assert.match(prompt, /Attached files: requirements\.txt/)
  assert.match(prompt, /Open each file and identify its format/)
  assert.match(prompt, /Attached images: screen\.png/)
  assert.match(prompt, /Read visible text, screenshots, diagrams, and drawings/)
  assert.match(prompt, /Connected folder: apps\/platform\/web/)
})
