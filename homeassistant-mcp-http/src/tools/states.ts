// ABOUTME: MCP tools for querying Home Assistant entity states and history
// ABOUTME: Provides ha_get_states, ha_get_history, ha_call_service, ha_get_entity_details

import { HomeAssistantClient } from '../ha-client.js';
import { HAState } from '../types.js';

export function registerStateTools(tools: Map<string, Function>) {
  // Get current states
  tools.set('ha_get_states', async (client: HomeAssistantClient, args: any) => {
    const { entity_id, domain } = args;

    let states = await client.getStates(entity_id);

    if (domain && !entity_id) {
      states = states.filter(state => state.entity_id.startsWith(`${domain}.`));
    }

    return {
      count: states.length,
      states: states
    };
  });

  // Get historical data
  tools.set('ha_get_history', async (client: HomeAssistantClient, args: any) => {
    const { entity_ids, start_time, end_time, minimal_response } = args;

    const history = await client.getHistory({
      entity_ids: entity_ids ? entity_ids.split(',') : undefined,
      start_time,
      end_time,
      minimal_response: minimal_response || false
    });

    return {
      entity_count: history.length,
      history: history
    };
  });

  // Call service
  tools.set('ha_call_service', async (client: HomeAssistantClient, args: any) => {
    const { domain, service, entity_id, service_data } = args;

    // Parse service_data JSON with error handling
    let parsedData;
    if (service_data) {
      try {
        parsedData = JSON.parse(service_data);
      } catch (error: any) {
        throw new Error(`Invalid service_data JSON: ${error.message}`);
      }
    }

    const result = await client.callService({
      domain,
      service,
      target: entity_id ? { entity_id } : undefined,
      service_data: parsedData
    });

    return {
      success: true,
      result: result
    };
  });

  // Get entity details
  tools.set('ha_get_entity_details', async (client: HomeAssistantClient, args: any) => {
    const { entity_id } = args;

    if (!entity_id) {
      throw new Error('entity_id is required');
    }

    const states = await client.getStates(entity_id);
    return states[0];
  });
}
