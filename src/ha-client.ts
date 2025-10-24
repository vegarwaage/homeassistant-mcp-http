// ABOUTME: Client library for communicating with Home Assistant APIs
// ABOUTME: Provides methods for REST API, Supervisor API, and CLI commands

import axios, { AxiosInstance } from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  HAState,
  HAServiceCall,
  HAHistoryQuery,
  HASystemInfo,
  HADatabaseResult,
  HALogEntry,
  HAValidationResult
} from './types.js';

const execAsync = promisify(exec);

export class HomeAssistantClient {
  private apiClient: AxiosInstance;
  private supervisorClient: AxiosInstance;
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string = 'http://supervisor', token: string = process.env.SUPERVISOR_TOKEN || '') {
    this.baseUrl = baseUrl;
    this.token = token;

    // REST API client
    this.apiClient = axios.create({
      baseURL: `${baseUrl}/core/api`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Supervisor API client
    this.supervisorClient = axios.create({
      baseURL: `${baseUrl}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Get all entity states or filter by entity_id
   */
  async getStates(entityId?: string): Promise<HAState[]> {
    if (entityId) {
      const response = await this.apiClient.get<HAState>(`/states/${entityId}`);
      return [response.data];
    }
    const response = await this.apiClient.get<HAState[]>('/states');
    return response.data;
  }

  /**
   * Get historical data for entities
   */
  async getHistory(query: HAHistoryQuery): Promise<HAState[][]> {
    const params: any = {};
    if (query.start_time) params.filter_entity_id = query.entity_ids?.join(',');
    if (query.end_time) params.end_time = query.end_time;
    if (query.minimal_response) params.minimal_response = true;

    const endpoint = query.start_time
      ? `/history/period/${query.start_time}`
      : '/history/period';

    const response = await this.apiClient.get<HAState[][]>(endpoint, { params });
    return response.data;
  }

  /**
   * Call a Home Assistant service
   */
  async callService(serviceCall: HAServiceCall): Promise<any> {
    const { domain, service, service_data, target } = serviceCall;
    const data = { ...service_data, ...target };
    const response = await this.apiClient.post(`/services/${domain}/${service}`, data);
    return response.data;
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<HASystemInfo> {
    const response = await this.apiClient.get<HASystemInfo>('/config');
    return response.data;
  }

  /**
   * Execute HA CLI command
   */
  async execCliCommand(command: string): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`ha ${command}`);
      // Log stderr as warning but don't treat it as an error
      // Many CLI tools write informational messages to stderr
      if (stderr) {
        console.error(`CLI warning: ${stderr}`);
      }
      return stdout;
    } catch (error: any) {
      throw new Error(`CLI command failed: ${error.message}`);
    }
  }

  /**
   * Validate Home Assistant configuration
   */
  async validateConfig(): Promise<HAValidationResult> {
    try {
      const output = await this.execCliCommand('core check');
      return {
        valid: output.includes('Configuration valid') || output.includes('valid!'),
        errors: output.includes('Invalid') ? [output] : undefined
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Reload Home Assistant configuration
   */
  async reloadConfig(type: 'core' | 'automation' | 'script' = 'automation'): Promise<void> {
    if (type === 'core') {
      await this.execCliCommand('core restart');
    } else {
      await this.callService({
        domain: type,
        service: 'reload'
      });
    }
  }

  /**
   * Get Home Assistant logs
   */
  async getLogs(lines: number = 100): Promise<HALogEntry[]> {
    const output = await this.execCliCommand(`core logs --lines ${lines}`);
    const logLines = output.split('\n').filter(line => line.trim());

    return logLines.map(line => {
      const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (\w+) (.+)$/);
      if (match) {
        return {
          timestamp: match[1],
          level: match[2],
          message: match[3]
        };
      }
      return {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: line
      };
    });
  }
}
