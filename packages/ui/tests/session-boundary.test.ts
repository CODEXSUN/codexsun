import assert from 'node:assert/strict'
import test from 'node:test'
import { authenticatedRouteForRoles, sessionCanAccessPortal } from '../src/blocks/auth/session-boundary.js'

test('requires a super-admin session for the super-admin route', () => {
  assert.equal(sessionCanAccessPortal(['user'], 'super-admin'), false)
  assert.equal(sessionCanAccessPortal(['super-admin'], 'super-admin'), true)
})

test('keeps portal sessions isolated by role', () => {
  assert.equal(sessionCanAccessPortal(['user'], 'admin'), false)
  assert.equal(sessionCanAccessPortal(['admin'], 'user'), false)
  assert.equal(sessionCanAccessPortal(['user'], 'user'), true)
})

test('routes development login to the portal granted by its role', () => {
  assert.equal(authenticatedRouteForRoles(['super-admin']), '/sa/desk')
  assert.equal(authenticatedRouteForRoles(['admin']), '/admin/desk')
  assert.equal(authenticatedRouteForRoles(['user']), '/overview')
})
