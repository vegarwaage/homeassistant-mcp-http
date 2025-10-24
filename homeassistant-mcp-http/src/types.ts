// ABOUTME: Type definitions for Home Assistant API responses and MCP tool parameters
// ABOUTME: Defines interfaces for entities, states, configs, and tool inputs/outputs

/**
 * Home Assistant entity state
 */
export interface HAState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
}

/**
 * Home Assistant service call
 */
export interface HAServiceCall {
  domain: string;
  service: string;
  service_data?: Record<string, any>;
  target?: {
    entity_id?: string | string[];
    device_id?: string | string[];
    area_id?: string | string[];
  };
}

/**
 * Historical data query parameters
 */
export interface HAHistoryQuery {
  entity_ids?: string[];
  start_time?: string;
  end_time?: string;
  minimal_response?: boolean;
}

/**
 * Configuration file reference
 */
export interface HAConfigFile {
  path: string;
  content: string;
}

/**
 * Automation definition
 */
export interface HAAutomation {
  id?: string;
  alias: string;
  description?: string;
  trigger: any[];
  condition?: any[];
  action: any[];
  mode?: 'single' | 'restart' | 'queued' | 'parallel';
}

/**
 * System info response
 */
export interface HASystemInfo {
  version: string;
  installation_type: string;
  os_name: string;
  os_version: string;
  hostname: string;
  supervisor?: string;
}

/**
 * Database query result
 */
export interface HADatabaseResult {
  columns: string[];
  rows: any[][];
}

/**
 * Log entry
 */
export interface HALogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
}

/**
 * Config validation result
 */
export interface HAValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  path: string;
  timestamp: string;
  original_path: string;
}
