// ABOUTME: MCP tools for Home Assistant system information, logs, and diagnostics
// ABOUTME: Provides ha_system_info, ha_get_logs, ha_restart

import { HomeAssistantClient } from '../ha-client.js';

export function registerSystemTools(tools: Map<string, Function>) {
  // Get system information
  tools.set('ha_system_info', async (client: HomeAssistantClient, args: any) => {
    const info = await client.getSystemInfo();
    return info;
  });

  // Get logs
  tools.set('ha_get_logs', async (client: HomeAssistantClient, args: any) => {
    const { lines = 100, filter } = args;

    let logs = await client.getLogs(lines);

    if (filter) {
      const regex = new RegExp(filter, 'i');
      logs = logs.filter(log => regex.test(log.message) || regex.test(log.source || ''));
    }

    return {
      count: logs.length,
      logs
    };
  });

  // Restart Home Assistant (requires confirmation)
  tools.set('ha_restart', async (client: HomeAssistantClient, args: any) => {
    const { confirm } = args;

    if (!confirm || confirm !== 'yes') {
      return {
        success: false,
        message: 'Restart requires confirmation. Set confirm="yes" to proceed.'
      };
    }

    await client.reloadConfig('core');

    return {
      success: true,
      message: 'Home Assistant restart initiated'
    };
  });
}
