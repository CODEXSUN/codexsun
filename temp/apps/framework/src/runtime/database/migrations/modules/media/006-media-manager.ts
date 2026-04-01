import { mediaTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

function lifecycleColumnsSql() {
  return `
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  `
}

export const mediaManagerMigration: Migration = {
  id: '006-media-manager',
  name: 'Media manager foundation',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${mediaTableNames.folders} (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        parent_id VARCHAR(64) NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_media_folders_parent FOREIGN KEY (parent_id) REFERENCES ${mediaTableNames.folders}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${mediaTableNames.files} (
        id VARCHAR(64) PRIMARY KEY,
        uuid VARCHAR(64) NOT NULL UNIQUE,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        thumbnail_path VARCHAR(500) NULL,
        thumbnail_url VARCHAR(500) NULL,
        file_type VARCHAR(50) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INT NOT NULL DEFAULT 0,
        width INT NULL,
        height INT NULL,
        alt_text VARCHAR(255) NULL,
        title VARCHAR(255) NULL,
        folder_id VARCHAR(64) NULL,
        storage_scope VARCHAR(20) NOT NULL DEFAULT 'public',
        is_optimized TINYINT(1) NOT NULL DEFAULT 0,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_media_files_folder FOREIGN KEY (folder_id) REFERENCES ${mediaTableNames.folders}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${mediaTableNames.tags} (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        ${lifecycleColumnsSql()}
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${mediaTableNames.tagMap} (
        id VARCHAR(64) PRIMARY KEY,
        media_id VARCHAR(64) NOT NULL,
        tag_id VARCHAR(64) NOT NULL,
        ${lifecycleColumnsSql()},
        UNIQUE KEY uq_media_tag_map_media_tag (media_id, tag_id),
        CONSTRAINT fk_media_tag_map_media FOREIGN KEY (media_id) REFERENCES ${mediaTableNames.files}(id),
        CONSTRAINT fk_media_tag_map_tag FOREIGN KEY (tag_id) REFERENCES ${mediaTableNames.tags}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${mediaTableNames.usage} (
        id VARCHAR(64) PRIMARY KEY,
        media_id VARCHAR(64) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(64) NOT NULL,
        usage_type VARCHAR(50) NOT NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_media_usage_media FOREIGN KEY (media_id) REFERENCES ${mediaTableNames.files}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${mediaTableNames.versions} (
        id VARCHAR(64) PRIMARY KEY,
        media_id VARCHAR(64) NOT NULL,
        version_type VARCHAR(50) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        width INT NULL,
        height INT NULL,
        ${lifecycleColumnsSql()},
        CONSTRAINT fk_media_versions_media FOREIGN KEY (media_id) REFERENCES ${mediaTableNames.files}(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(
      `
        INSERT INTO ${mediaTableNames.folders} (id, name, parent_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          parent_id = VALUES(parent_id),
          is_active = 1
      `,
      ['media-folder:root', 'Root Library', null],
    )

    await db.execute(
      `
        INSERT INTO ${mediaTableNames.files} (
          id, uuid, file_name, original_name, file_path, file_url, thumbnail_path, thumbnail_url,
          file_type, mime_type, file_size, width, height, alt_text, title, folder_id, storage_scope, is_optimized
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          file_name = VALUES(file_name),
          original_name = VALUES(original_name),
          file_path = VALUES(file_path),
          file_url = VALUES(file_url),
          thumbnail_path = VALUES(thumbnail_path),
          thumbnail_url = VALUES(thumbnail_url),
          file_type = VALUES(file_type),
          mime_type = VALUES(mime_type),
          file_size = VALUES(file_size),
          width = VALUES(width),
          height = VALUES(height),
          alt_text = VALUES(alt_text),
          title = VALUES(title),
          folder_id = VALUES(folder_id),
          storage_scope = VALUES(storage_scope),
          is_optimized = VALUES(is_optimized),
          is_active = 1
      `,
      [
        'media-file:placeholder',
        'media-file-placeholder',
        'default.txt',
        'default.txt',
        'placeholders/default.txt',
        'http://localhost:4000/media/public/placeholders/default.txt',
        null,
        null,
        'document',
        'text/plain',
        67,
        null,
        null,
        'Default placeholder document',
        'Default Placeholder',
        'media-folder:root',
        'public',
        0,
      ],
    )
  },
}


