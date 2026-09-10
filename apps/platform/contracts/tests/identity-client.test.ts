import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PlatformIdentityClient, IdentityClientError } from '../src/index.js'

const token = 'a'.repeat(43)
const userId = '00000000-0000-4000-8000-000000000001'
const requirement = { resource: 'test-product', action: 'read' }
const credential = { kind: 'bearer' as const, token }
const envelope = (data: unknown) => ({
  success: true,
  data,
  meta: { requestId: 'test', correlationId: 'test', timestamp: new Date().toISOString() },
})
const json = (data: unknown) => Response.json(envelope(data))

test('transport is invoked without a client receiver, as required by browser fetch', async () => {
  const client = new PlatformIdentityClient({
    origin: 'http://127.0.0.1:6010',
    fetch: async function (this: unknown) {
      assert.equal(this, undefined)
      return json({ allowed: false, userId, portal: 'regular' })
    },
  })
  assert.equal((await client.authorize('regular', requirement, { kind: 'cookie' })).allowed, false)
})

test('session reads validate portal and expiry for the browser consumer', async () => {
  const session = {
    user: { id: userId, displayName: 'Client', email: 'client@example.test', portal: 'regular' },
    expiresAt: '2099-01-01T00:00:00.000Z',
    device: {
      activatedAt: null,
      clientType: 'web',
      deviceId: 'browser-device',
      deviceName: 'Browser',
      firstSeenAt: '2026-01-01T00:00:00.000Z',
      lastSeenAt: '2026-01-01T00:00:00.000Z',
      status: 'active',
    },
  }
  const client = new PlatformIdentityClient({
    origin: 'https://identity.example.test',
    fetch: async (url, init) => {
      assert.equal(url, 'https://identity.example.test/api/identity/session')
      assert.equal(init?.method, 'GET')
      return json(session)
    },
  })
  assert.equal((await client.session('regular', { kind: 'cookie' })).user.id, userId)
  session.user.portal = 'super-admin'
  await assert.rejects(() => client.session('regular', { kind: 'cookie' }), IdentityClientError)
  session.user.portal = 'regular'
  session.expiresAt = '2000-01-01T00:00:00.000Z'
  await assert.rejects(() => client.session('regular', { kind: 'cookie' }), IdentityClientError)
})

test('client isolates concurrent bearer credentials and forwards only required headers', async () => {
  const seen: RequestInit[] = []
  const client = new PlatformIdentityClient({
    origin: 'https://identity.example.test',
    fetch: async (url, init) => {
      assert.equal(url, 'https://identity.example.test/api/identity/authorize')
      seen.push(init!)
      return json({ allowed: true, userId, portal: 'regular' })
    },
  })
  await Promise.all(
    ['a', 'b'].map((letter) =>
      client.authorize('regular', requirement, { kind: 'bearer', token: letter.repeat(43) }),
    ),
  )
  assert.deepEqual(seen.map((init) => new Headers(init.headers).get('authorization')).sort(), [
    'Bearer ' + 'a'.repeat(43),
    'Bearer ' + 'b'.repeat(43),
  ])
  for (const init of seen) {
    assert.equal(init.credentials, 'omit')
    assert.equal(init.redirect, 'error')
    assert.equal(init.cache, 'no-store')
    assert.deepEqual(JSON.parse(init.body as string), requirement)
  }
})

test('cookie mode carries no bearer token and denial remains denied', async () => {
  const client = new PlatformIdentityClient({
    origin: 'http://127.0.0.1:6010',
    fetch: async (_url, init) => {
      assert.equal(init?.credentials, 'include')
      assert.equal(new Headers(init?.headers).has('authorization'), false)
      return json({ allowed: false, userId, portal: 'administrator' })
    },
  })
  assert.equal(
    (await client.authorize('administrator', requirement, { kind: 'cookie' })).allowed,
    false,
  )
})

test('invalid sessions, outages, HTML, oversized and mismatched responses never grant access', async () => {
  for (const makeResponse of [
    () => new Response('secret', { status: 401 }),
    () => new Response('secret', { status: 503 }),
    () => new Response('<html>proxy</html>', { headers: { 'content-type': 'text/html' } }),
    () => json({ allowed: 'true', userId, portal: 'regular' }),
    () => json({ allowed: true, userId, portal: 'super-admin' }),
    () => new Response(' '.repeat(65537), { headers: { 'content-type': 'application/json' } }),
    () => new Response(null, { status: 302, headers: { location: 'https://elsewhere.test' } }),
  ]) {
    const client = new PlatformIdentityClient({
      origin: 'https://identity.example.test',
      fetch: async () => makeResponse(),
    })
    await assert.rejects(
      () => client.authorize('regular', requirement, credential),
      (error: unknown) => {
        assert.ok(error instanceof IdentityClientError)
        assert.equal(error.message.includes('secret'), false)
        return true
      },
    )
  }
})

test('timeouts and cancellation abort the transport without leaking its error', async () => {
  const client = new PlatformIdentityClient({
    origin: 'https://identity.example.test',
    timeoutMs: 10,
    fetch: async (_url, init) =>
      new Promise((_resolve, reject) => {
        if (init?.signal?.aborted) reject(new Error('private connection detail'))
        else
          init?.signal?.addEventListener(
            'abort',
            () => reject(new Error('private connection detail')),
            { once: true },
          )
      }),
  })
  await assert.rejects(
    () => client.authorize('regular', requirement, credential),
    IdentityClientError,
  )
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(
    () => client.authorize('regular', requirement, credential, controller.signal),
    IdentityClientError,
  )
})

test('unsafe origins and header injection are rejected before transport', async () => {
  for (const origin of [
    'http://identity.example.test',
    'https://user:pass@example.test',
    'https://example.test/path',
    'https://example.test?token=secret',
  ])
    assert.throws(() => new PlatformIdentityClient({ origin }))
  const client = new PlatformIdentityClient({
    origin: 'https://identity.example.test',
    fetch: async () => {
      throw new Error('Must not run')
    },
  })
  await assert.rejects(
    () => client.authorize('regular', requirement, { kind: 'bearer', token: 'bad\r\nheader' }),
    IdentityClientError,
  )
})
