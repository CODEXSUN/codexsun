export interface OperationsMetricTable {
  app_id: string
  data: string
  id: string
  observed_at: string
  received_at: string
}

export interface OperationsSettingsTable {
  data: string
  scope_key: string
  updated_at: string
}

export interface OperationsDatabase {
  zetro_connected_app_metrics: OperationsMetricTable
  zetro_operations_settings: OperationsSettingsTable
}
