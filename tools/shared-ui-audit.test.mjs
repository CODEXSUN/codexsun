import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { auditSharedUi } from './shared-ui-audit.mjs'

test('reports public shared UI use for one web application', async () => {
  const root = await fixture()
  try {
    await addWebApp(root, 'sample', {
      source:
        "import { Button } from '@codexsun/ui/components/button'\nexport const Page = Button\n",
    })
    const report = await auditSharedUi({ app: 'sample', root })
    assert.equal(report.passed, true)
    assert.equal(report.totals.publicUiImports, 1)
    assert.deepEqual(
      report.applications.map(({ name }) => name),
      ['sample'],
    )
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('reports private imports, native controls, and missing shared dependency', async () => {
  const root = await fixture()
  try {
    await addWebApp(root, 'sample', {
      dependencies: {},
      source:
        "import { buttonVariants } from '@codexsun/ui/src/button'\nexport const Page = () => <button>Run</button>\n",
    })
    const report = await auditSharedUi({ app: 'sample', root })
    assert.equal(report.passed, false)
    assert.match(report.violations.join('\n'), /public exports/)
    assert.match(report.violations.join('\n'), /shared button primitive/)
    assert.match(report.violations.join('\n'), /declare @codexsun\/ui/)
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('rejects dependencies on the independent UIUX application', async () => {
  const root = await fixture()
  try {
    await addWebApp(root, 'sample', {
      dependencies: {
        '@codexsun/ui': 'file:../../../packages/ui',
        '@codexsun/uiux-web': 'file:../../uiux/web',
      },
      source:
        "import { UiGallery } from '@codexsun/uiux-web'\nimport { uiGalleryTopologySections } from '../../../uiux/web/src/modules/gallery'\nexport const Page = [UiGallery, uiGalleryTopologySections]\n",
    })
    const report = await auditSharedUi({ app: 'sample', root })
    assert.equal(report.passed, false)
    assert.match(report.violations.join('\n'), /UIUX is an independent app/)
    assert.match(report.violations.join('\n'), /do not depend on the UIUX application/)
    assert.equal(
      report.violations.filter((violation) => violation.includes('UIUX is an independent app'))
        .length,
      2,
    )
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'shared-ui-audit-'))
  await mkdir(join(root, 'apps'), { recursive: true })
  return root
}

async function addWebApp(root, name, options) {
  const webRoot = join(root, 'apps', name, 'web')
  await mkdir(join(webRoot, 'src'), { recursive: true })
  await writeFile(
    join(webRoot, 'package.json'),
    JSON.stringify({
      dependencies: options.dependencies ?? { '@codexsun/ui': 'file:../../../packages/ui' },
      name: `@codexsun/${name}-web`,
    }),
  )
  await writeFile(join(webRoot, 'src', 'page.tsx'), options.source)
}
