import assert from 'node:assert/strict'
import test from 'node:test'
import { composeWebModules } from '../dist/packages/platform-core/web/index.js'

const component = () => null

test('web composition orders navigation and keeps module routes', () => {
  const composition = composeWebModules([
    webModule('identity', '/identity', 20),
    webModule('system', '/system', 10),
  ])

  assert.deepEqual(
    composition.modules.map(({ id }) => id),
    ['identity', 'system'],
  )
  assert.deepEqual(
    composition.navigation.map(({ id }) => id),
    ['system.navigation', 'identity.navigation'],
  )
  assert.deepEqual(
    composition.routes.map(({ path }) => path),
    ['/identity', '/system'],
  )
})

test('web composition rejects duplicate routes', () => {
  assert.throws(
    () => composeWebModules([webModule('one', '/shared', 10), webModule('two', '/shared', 20)]),
    /Duplicate Platform web route path/u,
  )
})

test('web composition rejects navigation without an owned route', () => {
  const module = webModule('system', '/system', 10)
  module.navigation[0].routeId = 'missing.route'

  assert.throws(() => composeWebModules([module]), /references missing route/u)
})

function webModule(id, path, order) {
  return {
    id,
    navigation: [
      {
        id: `${id}.navigation`,
        label: id,
        order,
        routeId: `${id}.route`,
      },
    ],
    routes: [{ component, id: `${id}.route`, path, title: id }],
    version: '1.0.0',
  }
}
