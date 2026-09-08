import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'
import { ProjectRepository } from '../src/modules/projects/projects.repository.js'
import {
  createDefaultProject,
  defaultProjectId,
  LastActiveProjectError,
  ProjectRepositoryAlreadyExistsError,
  ProjectService,
} from '../src/modules/projects/projects.service.js'

const execute = promisify(execFile)

test('registers a local git repository once', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-projects-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const defaultRoot = join(directory, 'default')
  const otherRoot = join(directory, 'other')
  await execute('git', ['init', defaultRoot], { windowsHide: true })
  await execute('git', ['init', otherRoot], { windowsHide: true })
  const repository = new ProjectRepository(join(directory, 'projects.json'))
  await repository.initialize(createDefaultProject(defaultRoot))
  const service = new ProjectService(repository)

  const created = await service.create({ name: 'Other', repositoryPath: otherRoot })
  assert.equal(created.name, 'Other')
  assert.equal(service.list().length, 2)
  assert.equal(created.archived, false)
  const renamed = await service.update(created.id, { name: 'Renamed' })
  assert.equal(renamed.name, 'Renamed')
  const archived = await service.update(created.id, { archived: true })
  assert.equal(archived.archived, true)
  assert.equal(service.list().length, 1)
  assert.equal(service.list(true).length, 1)
  await assert.rejects(service.update(defaultProjectId, { archived: true }), LastActiveProjectError)
  await assert.rejects(
    service.create({ name: 'Duplicate', repositoryPath: otherRoot }),
    ProjectRepositoryAlreadyExistsError,
  )
})
