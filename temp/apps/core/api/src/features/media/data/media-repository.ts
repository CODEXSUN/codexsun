import type {
  Media,
  MediaFolder,
  MediaFolderUpsertPayload,
  MediaSummary,
  MediaTag,
  MediaUpsertPayload,
  MediaUsage,
  MediaVersion,
} from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { mediaTableNames } from '@framework-core/runtime/database/table-names'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import { createMediaUrl } from '@framework-core/runtime/media/storage'

interface MediaFolderRow extends RowDataPacket {
  id: string
  name: string
  parent_id: string | null
  is_active: number
  created_at: Date
  updated_at: Date
}

interface MediaSummaryRow extends RowDataPacket {
  id: string
  uuid: string
  file_name: string
  original_name: string
  file_path: string
  file_url: string
  thumbnail_path: string | null
  thumbnail_url: string | null
  file_type: 'image' | 'video' | 'document' | 'other'
  mime_type: string
  file_size: number
  width: number | null
  height: number | null
  alt_text: string | null
  title: string | null
  folder_id: string | null
  folder_name: string | null
  storage_scope: 'public' | 'private'
  is_optimized: number
  is_active: number
  tag_count: number
  usage_count: number
  version_count: number
  created_at: Date
  updated_at: Date
}

type MediaRow = MediaSummaryRow

interface MediaTagRow extends RowDataPacket {
  id: string
  name: string
  is_active: number
  created_at: Date
  updated_at: Date
}

interface MediaUsageRow extends RowDataPacket {
  id: string
  media_id: string
  entity_type: string
  entity_id: string
  usage_type: string
  is_active: number
  created_at: Date
  updated_at: Date
}

interface MediaVersionRow extends RowDataPacket {
  id: string
  media_id: string
  version_type: string
  file_path: string
  file_url: string
  width: number | null
  height: number | null
  is_active: number
  created_at: Date
  updated_at: Date
}

type SqlExecutor = (sql: string, params?: (string | number | boolean | null)[]) => Promise<unknown>
type SqlFirst = <T extends RowDataPacket = RowDataPacket>(sql: string, params?: (string | number | boolean | null)[]) => Promise<T | null>

const asTimestamp = (value: Date) => value.toISOString()

function toFolder(row: MediaFolderRow): MediaFolder {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toSummary(row: MediaSummaryRow): MediaSummary {
  return {
    id: row.id,
    uuid: row.uuid,
    fileName: row.file_name,
    originalName: row.original_name,
    filePath: row.file_path,
    fileUrl: createMediaUrl(row.storage_scope, row.file_path),
    thumbnailPath: row.thumbnail_path,
    thumbnailUrl: row.thumbnail_path ? createMediaUrl(row.storage_scope, row.thumbnail_path) : null,
    fileType: row.file_type,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size),
    width: row.width == null ? null : Number(row.width),
    height: row.height == null ? null : Number(row.height),
    altText: row.alt_text,
    title: row.title,
    folderId: row.folder_id,
    folderName: row.folder_name,
    storageScope: row.storage_scope,
    isOptimized: Boolean(row.is_optimized),
    isActive: Boolean(row.is_active),
    tagCount: Number(row.tag_count),
    usageCount: Number(row.usage_count),
    versionCount: Number(row.version_count),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toTag(row: MediaTagRow): MediaTag {
  return {
    id: row.id,
    name: row.name,
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toUsage(row: MediaUsageRow): MediaUsage {
  return {
    id: row.id,
    mediaId: row.media_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    usageType: row.usage_type,
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

function toVersion(row: MediaVersionRow): MediaVersion {
  return {
    id: row.id,
    mediaId: row.media_id,
    versionType: row.version_type,
    filePath: row.file_path,
    fileUrl: createMediaUrl('public', row.file_path),
    width: row.width == null ? null : Number(row.width),
    height: row.height == null ? null : Number(row.height),
    isActive: Boolean(row.is_active),
    createdAt: asTimestamp(row.created_at),
    updatedAt: asTimestamp(row.updated_at),
  }
}

export class MediaRepository {
  async list() {
    await ensureDatabaseSchema()

    const rows = await db.query<MediaSummaryRow>(`
      SELECT
        mf.*,
        folder.name AS folder_name,
        (
          SELECT COUNT(*)
          FROM ${mediaTableNames.tagMap} mtm
          WHERE mtm.media_id = mf.id AND mtm.is_active = 1
        ) AS tag_count,
        (
          SELECT COUNT(*)
          FROM ${mediaTableNames.usage} mu
          WHERE mu.media_id = mf.id AND mu.is_active = 1
        ) AS usage_count,
        (
          SELECT COUNT(*)
          FROM ${mediaTableNames.versions} mv
          WHERE mv.media_id = mf.id AND mv.is_active = 1
        ) AS version_count
      FROM ${mediaTableNames.files} mf
      LEFT JOIN ${mediaTableNames.folders} folder ON folder.id = mf.folder_id
      ORDER BY mf.created_at DESC
    `)

    return rows.map(toSummary)
  }

  async findById(id: string) {
    await ensureDatabaseSchema()

    const row = await db.first<MediaRow>(`
      SELECT
        mf.*,
        folder.name AS folder_name,
        (
          SELECT COUNT(*)
          FROM ${mediaTableNames.tagMap} mtm
          WHERE mtm.media_id = mf.id AND mtm.is_active = 1
        ) AS tag_count,
        (
          SELECT COUNT(*)
          FROM ${mediaTableNames.usage} mu
          WHERE mu.media_id = mf.id AND mu.is_active = 1
        ) AS usage_count,
        (
          SELECT COUNT(*)
          FROM ${mediaTableNames.versions} mv
          WHERE mv.media_id = mf.id AND mv.is_active = 1
        ) AS version_count
      FROM ${mediaTableNames.files} mf
      LEFT JOIN ${mediaTableNames.folders} folder ON folder.id = mf.folder_id
      WHERE mf.id = ?
      LIMIT 1
    `, [id])

    if (!row) {
      return null
    }

    const [folder, tags, usages, versions] = await Promise.all([
      row.folder_id
        ? db.first<MediaFolderRow>(`SELECT * FROM ${mediaTableNames.folders} WHERE id = ? LIMIT 1`, [row.folder_id])
        : Promise.resolve(null),
      db.query<MediaTagRow>(`
        SELECT mt.*
        FROM ${mediaTableNames.tags} mt
        INNER JOIN ${mediaTableNames.tagMap} map ON map.tag_id = mt.id
        WHERE map.media_id = ? AND map.is_active = 1 AND mt.is_active = 1
        ORDER BY mt.name ASC
      `, [id]),
      db.query<MediaUsageRow>(`
        SELECT *
        FROM ${mediaTableNames.usage}
        WHERE media_id = ? AND is_active = 1
        ORDER BY created_at ASC
      `, [id]),
      db.query<MediaVersionRow>(`
        SELECT *
        FROM ${mediaTableNames.versions}
        WHERE media_id = ? AND is_active = 1
        ORDER BY created_at ASC
      `, [id]),
    ])

    return {
      ...toSummary(row),
      folder: folder ? toFolder(folder) : null,
      tags: tags.map(toTag),
      usages: usages.map(toUsage),
      versions: versions.map(toVersion),
    } satisfies Media
  }

  async create(payload: MediaUpsertPayload) {
    await ensureDatabaseSchema()
    const id = randomUUID()
    const uuid = randomUUID()

    await db.transaction(async (transaction) => {
      await transaction.execute(
        `
          INSERT INTO ${mediaTableNames.files} (
            id, uuid, file_name, original_name, file_path, file_url, thumbnail_path, thumbnail_url,
            file_type, mime_type, file_size, width, height, alt_text, title, folder_id, storage_scope, is_optimized, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          uuid,
          payload.fileName,
          payload.originalName,
          payload.filePath,
          createMediaUrl(payload.storageScope, payload.filePath),
          payload.thumbnailPath,
          payload.thumbnailPath ? createMediaUrl(payload.storageScope, payload.thumbnailPath) : null,
          payload.fileType,
          payload.mimeType,
          payload.fileSize,
          payload.width,
          payload.height,
          payload.altText,
          payload.title,
          payload.folderId,
          payload.storageScope,
          payload.isOptimized,
          payload.isActive,
        ],
      )

      await this.replaceChildren(transaction.execute.bind(transaction), transaction.first.bind(transaction), id, payload)
    })

    const item = await this.findById(id)
    if (!item) {
      throw new ApplicationError('Expected created media asset to be retrievable.', { id }, 500)
    }

    return item
  }

  async update(id: string, payload: MediaUpsertPayload) {
    await ensureDatabaseSchema()

    await db.transaction(async (transaction) => {
      const existing = await transaction.first<RowDataPacket>(
        `SELECT id FROM ${mediaTableNames.files} WHERE id = ? LIMIT 1`,
        [id],
      )

      if (!existing) {
        throw new ApplicationError('Media asset not found.', { id }, 404)
      }

      await transaction.execute(
        `
          UPDATE ${mediaTableNames.files}
          SET
            file_name = ?,
            original_name = ?,
            file_path = ?,
            file_url = ?,
            thumbnail_path = ?,
            thumbnail_url = ?,
            file_type = ?,
            mime_type = ?,
            file_size = ?,
            width = ?,
            height = ?,
            alt_text = ?,
            title = ?,
            folder_id = ?,
            storage_scope = ?,
            is_optimized = ?,
            is_active = ?
          WHERE id = ?
        `,
        [
          payload.fileName,
          payload.originalName,
          payload.filePath,
          createMediaUrl(payload.storageScope, payload.filePath),
          payload.thumbnailPath,
          payload.thumbnailPath ? createMediaUrl(payload.storageScope, payload.thumbnailPath) : null,
          payload.fileType,
          payload.mimeType,
          payload.fileSize,
          payload.width,
          payload.height,
          payload.altText,
          payload.title,
          payload.folderId,
          payload.storageScope,
          payload.isOptimized,
          payload.isActive,
          id,
        ],
      )

      await this.replaceChildren(transaction.execute.bind(transaction), transaction.first.bind(transaction), id, payload)
    })

    const item = await this.findById(id)
    if (!item) {
      throw new ApplicationError('Expected updated media asset to be retrievable.', { id }, 500)
    }

    return item
  }

  async setActiveState(id: string, isActive: boolean) {
    await ensureDatabaseSchema()

    const result = await db.execute(
      `UPDATE ${mediaTableNames.files} SET is_active = ? WHERE id = ?`,
      [isActive, id],
    )

    if (result.affectedRows === 0) {
      throw new ApplicationError('Media asset not found.', { id }, 404)
    }

    const item = await this.findById(id)
    if (!item) {
      throw new ApplicationError('Expected media asset to be retrievable after state update.', { id }, 500)
    }

    return item
  }

  async listFolders() {
    await ensureDatabaseSchema()

    const rows = await db.query<MediaFolderRow>(`
      SELECT *
      FROM ${mediaTableNames.folders}
      ORDER BY created_at ASC
    `)

    return rows.map(toFolder)
  }

  async createFolder(payload: MediaFolderUpsertPayload) {
    await ensureDatabaseSchema()
    const id = randomUUID()

    await db.execute(
      `INSERT INTO ${mediaTableNames.folders} (id, name, parent_id, is_active) VALUES (?, ?, ?, ?)`,
      [id, payload.name, payload.parentId, payload.isActive],
    )

    const item = await this.findFolderById(id)
    if (!item) {
      throw new ApplicationError('Expected created media folder to be retrievable.', { id }, 500)
    }

    return item
  }

  async updateFolder(id: string, payload: MediaFolderUpsertPayload) {
    await ensureDatabaseSchema()

    const result = await db.execute(
      `UPDATE ${mediaTableNames.folders} SET name = ?, parent_id = ?, is_active = ? WHERE id = ?`,
      [payload.name, payload.parentId, payload.isActive, id],
    )

    if (result.affectedRows === 0) {
      throw new ApplicationError('Media folder not found.', { id }, 404)
    }

    const item = await this.findFolderById(id)
    if (!item) {
      throw new ApplicationError('Expected updated media folder to be retrievable.', { id }, 500)
    }

    return item
  }

  async setFolderActiveState(id: string, isActive: boolean) {
    await ensureDatabaseSchema()

    const result = await db.execute(
      `UPDATE ${mediaTableNames.folders} SET is_active = ? WHERE id = ?`,
      [isActive, id],
    )

    if (result.affectedRows === 0) {
      throw new ApplicationError('Media folder not found.', { id }, 404)
    }

    const item = await this.findFolderById(id)
    if (!item) {
      throw new ApplicationError('Expected media folder to be retrievable after state update.', { id }, 500)
    }

    return item
  }

  private async findFolderById(id: string) {
    const row = await db.first<MediaFolderRow>(
      `SELECT * FROM ${mediaTableNames.folders} WHERE id = ? LIMIT 1`,
      [id],
    )

    return row ? toFolder(row) : null
  }

  private async replaceChildren(execute: SqlExecutor, first: SqlFirst, mediaId: string, payload: MediaUpsertPayload) {
    await this.replaceTags(execute, first, mediaId, payload.tags.map((tag) => tag.name))
    await this.replaceUsage(execute, mediaId, payload.usages)
    await this.replaceVersions(execute, mediaId, payload.versions)
  }

  private async replaceTags(execute: SqlExecutor, first: SqlFirst, mediaId: string, tagNames: string[]) {
    await execute(`UPDATE ${mediaTableNames.tagMap} SET is_active = 0 WHERE media_id = ? AND is_active = 1`, [mediaId])

    const uniqueNames = [...new Set(tagNames.map((name) => name.trim()).filter(Boolean))]
    for (const name of uniqueNames) {
      const existing = await first<MediaTagRow>(`SELECT * FROM ${mediaTableNames.tags} WHERE name = ? LIMIT 1`, [name])
      const tagId = existing?.id ?? randomUUID()

      if (existing) {
        await execute(`UPDATE ${mediaTableNames.tags} SET is_active = 1 WHERE id = ?`, [tagId])
      } else {
        await execute(`INSERT INTO ${mediaTableNames.tags} (id, name) VALUES (?, ?)`, [tagId, name])
      }

      await execute(
        `INSERT INTO ${mediaTableNames.tagMap} (id, media_id, tag_id) VALUES (?, ?, ?)`,
        [randomUUID(), mediaId, tagId],
      )
    }
  }

  private async replaceUsage(execute: SqlExecutor, mediaId: string, usages: MediaUpsertPayload['usages']) {
    await execute(`UPDATE ${mediaTableNames.usage} SET is_active = 0 WHERE media_id = ? AND is_active = 1`, [mediaId])

    for (const usage of usages) {
      await execute(
        `INSERT INTO ${mediaTableNames.usage} (id, media_id, entity_type, entity_id, usage_type) VALUES (?, ?, ?, ?, ?)`,
        [randomUUID(), mediaId, usage.entityType, usage.entityId, usage.usageType],
      )
    }
  }

  private async replaceVersions(execute: SqlExecutor, mediaId: string, versions: MediaUpsertPayload['versions']) {
    await execute(`UPDATE ${mediaTableNames.versions} SET is_active = 0 WHERE media_id = ? AND is_active = 1`, [mediaId])

    for (const version of versions) {
      await execute(
        `
          INSERT INTO ${mediaTableNames.versions} (id, media_id, version_type, file_path, file_url, width, height)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          randomUUID(),
          mediaId,
          version.versionType,
          version.filePath,
          createMediaUrl('public', version.filePath),
          version.width,
          version.height,
        ],
      )
    }
  }
}
