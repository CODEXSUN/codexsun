import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AdminLoginPage, ClientLoginPage, SuperAdminLoginPage } from '../src/blocks/auth/index.js'

test('privileged login pages never show regular registration links', () => {
  for (const Page of [AdminLoginPage, SuperAdminLoginPage]) {
    const html = renderToStaticMarkup(createElement(Page, { onSubmit: () => {} }))
    assert.equal(html.includes('href="/register"'), false)
    assert.ok(html.includes('Username, email, or mobile'))
    assert.equal(html.includes('type="email"'), false)
    assert.ok(html.includes('minLength="8"'))
  }
})

test('regular registration visibility follows the application setting', () => {
  for (const registrationEnabled of [true, false]) {
    const html = renderToStaticMarkup(
      createElement(ClientLoginPage, {
        onSubmit: () => {},
        registrationEnabled,
      }),
    )
    assert.equal(html.includes('href="/register"'), registrationEnabled)
  }
})
