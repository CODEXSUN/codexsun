export interface GitDeliveryFlowTable {
  created_at: string
  data: string
  id: string
  project_id: string
  status: string
}

export interface GitDeliverySettingsTable {
  data: string
  scope_key: string
  updated_at: string
}

export interface GitDeliveryDatabase {
  zetro_git_delivery_flows: GitDeliveryFlowTable
  zetro_git_delivery_settings: GitDeliverySettingsTable
}
