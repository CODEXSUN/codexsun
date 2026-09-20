import assert from 'node:assert/strict'
import test from 'node:test'
import { newUnreadNotifications } from '../src/layouts/mdi-main/mdi-notifications-menu.js'

test('finds only unread notifications that were not previously seen', () => {
  const result = newUnreadNotifications(new Set(['existing']), [
    { id: 'existing', title: 'Already shown', read: false },
    { id: 'new', title: 'New update', read: false },
  ])

  assert.deepEqual(result.map((notification) => notification.id), ['new'])
})
