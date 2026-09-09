import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'
import { openTestDatabase } from './test-database.js'
import { ProjectRepository } from '../src/modules/projects/projects.repository.js'
import {
  createDefaultProject,
  defaultProjectId,
  LastActiveProjectError,
  ProjectRepositoryAlreadyExistsError,
  ProjectService,
  isGeneratedDesktopPlaceholder,
} from '../src/modules/projects/projects.service.js'

const execute = promisify(execFile)

test('registers a local git repository once', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-projects-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const defaultRoot = join(directory, 'default')
  const otherRoot = join(directory, 'other')
  const replacementRoot = join(directory, 'replacement')
  await execute('git', ['init', defaultRoot], { windowsHide: true })
  await execute('git', ['init', otherRoot], { windowsHide: true })
  await execute('git', ['init', replacementRoot], { windowsHide: true })
  const nestedReplacementPath = join(replacementRoot, 'apps', 'web')
  await mkdir(nestedReplacementPath, { recursive: true })
  const database = await openTestDatabase(directory)
  context.after(() => database.close())
  const repository = new ProjectRepository(database, join(directory, 'projects.json'))
  await repository.initialize(createDefaultProject(defaultRoot))
  const service = new ProjectService(repository)

  const created = await service.create({ name: 'Other', repositoryPath: otherRoot })
  assert.equal(created.name, 'Other')
  assert.equal(service.list().length, 2)
  assert.equal(created.archived, false)
  assert.equal(created.logoText, 'OT')
  assert.equal(created.tagline, 'Project workspace')
  const listing = await service.browseDirectories(directory)
  assert.ok(listing.directories.some(({ path }) => path === replacementRoot))
  const renamed = await service.update(created.id, {
    githubUrl: 'https://github.com/codexsun/renamed',
    logoColor: '#2563eb',
    logoText: 'RN',
    name: 'Renamed',
    repositoryPath: nestedReplacementPath,
    tagline: 'Build with confidence',
  })
  assert.equal(renamed.name, 'Renamed')
  assert.equal(renamed.repositoryPath, replacementRoot)
  assert.equal(renamed.githubUrl, 'https://github.com/codexsun/renamed')
  assert.equal(renamed.logoColor, '#2563eb')
  assert.equal(renamed.logoText, 'RN')
  assert.equal(renamed.tagline, 'Build with confidence')
  const archived = await service.update(created.id, { archived: true })
  assert.equal(archived.archived, true)
  assert.equal(service.list().length, 1)
  assert.equal(service.list(true).length, 1)
  await assert.rejects(service.update(defaultProjectId, { archived: true }), LastActiveProjectError)
  await assert.rejects(
    service.create({ name: 'Duplicate', repositoryPath: replacementRoot }),
    ProjectRepositoryAlreadyExistsError,
  )
})

test('supports an empty registry when the startup folder is not a Git repository', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-empty-projects-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const database = await openTestDatabase(directory)
  context.after(() => database.close())
  const repository = new ProjectRepository(database, join(directory, 'projects.json'))

  await repository.initialize()

  assert.deepEqual(repository.list(), [])
})

test('recognizes only the untouched generated desktop placeholder', () => {
  const projectRoot = join(tmpdir(), 'zetro-desktop-workspace')
  const project = createDefaultProject(projectRoot)

  assert.equal(isGeneratedDesktopPlaceholder(project, projectRoot), true)
  assert.equal(
    isGeneratedDesktopPlaceholder({ ...project, name: 'My project' }, projectRoot),
    false,
  )
})
