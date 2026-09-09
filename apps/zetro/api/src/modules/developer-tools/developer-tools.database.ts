export interface DeveloperToolSettingsTable {
  data: string
  scope_key: string
  updated_at: string
}

export interface DeveloperToolsDatabase {
  zetro_developer_tool_settings: DeveloperToolSettingsTable
}
