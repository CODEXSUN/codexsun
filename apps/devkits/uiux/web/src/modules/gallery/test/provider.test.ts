import assert from 'node:assert/strict'
import test from 'node:test'
import { uiuxGalleryModule } from '../provider'

test('declares the UIUX gallery as a UI-only module', () => {
  assert.equal(uiuxGalleryModule.owner, 'apps/devkits/uiux/web/modules/gallery')
  assert.deepEqual(uiuxGalleryModule.events, { published: [], consumed: [] })
})
