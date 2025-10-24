// ABOUTME: MCP tools for creating, updating, and managing Home Assistant automations
// ABOUTME: Provides ha_create_automation, ha_update_automation, ha_delete_automation, ha_list_automations

import { promises as fs } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';
import { HomeAssistantClient } from '../ha-client.js';
import { HAAutomation } from '../types.js';
import { backupFile } from '../backup.js';

const AUTOMATIONS_FILE = '/config/automations.yaml';

async function readAutomations(): Promise<HAAutomation[]> {
  try {
    const content = await fs.readFile(AUTOMATIONS_FILE, 'utf-8');
    const automations = yaml.parse(content);
    return Array.isArray(automations) ? automations : [];
  } catch {
    return [];
  }
}

async function writeAutomations(automations: HAAutomation[]): Promise<void> {
  const content = yaml.stringify(automations);
  await fs.writeFile(AUTOMATIONS_FILE, content, 'utf-8');
}

export function registerAutomationTools(tools: Map<string, Function>) {
  // Create automation
  tools.set('ha_create_automation', async (client: HomeAssistantClient, args: any) => {
    const { automation_yaml } = args;

    if (!automation_yaml) {
      throw new Error('automation_yaml is required');
    }

    // Parse automation YAML
    const automation = yaml.parse(automation_yaml);

    // Generate ID if not provided
    if (!automation.id) {
      automation.id = `mcp_${Date.now()}`;
    }

    // Backup existing file
    const backup = await backupFile(AUTOMATIONS_FILE);

    // Read existing automations
    const automations = await readAutomations();

    // Add new automation
    automations.push(automation);

    // Write back
    await writeAutomations(automations);

    // Validate
    const validation = await client.validateConfig();
    if (!validation.valid) {
      // ROLLBACK: Restore from backup
      await fs.copyFile(backup.path, AUTOMATIONS_FILE);
      console.error(`Rolled back to backup due to validation failure`);
      throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
    }

    // Reload
    await client.reloadConfig('automation');

    return {
      success: true,
      automation_id: automation.id,
      message: 'Automation created and loaded'
    };
  });

  // Update automation
  tools.set('ha_update_automation', async (client: HomeAssistantClient, args: any) => {
    const { automation_id, automation_yaml } = args;

    if (!automation_id || !automation_yaml) {
      throw new Error('automation_id and automation_yaml are required');
    }

    const updatedAutomation = yaml.parse(automation_yaml);
    updatedAutomation.id = automation_id;

    // Backup
    const backup = await backupFile(AUTOMATIONS_FILE);

    // Read, update, write
    const automations = await readAutomations();
    const index = automations.findIndex(a => a.id === automation_id);

    if (index === -1) {
      throw new Error(`Automation ${automation_id} not found`);
    }

    automations[index] = updatedAutomation;
    await writeAutomations(automations);

    // Validate and reload
    const validation = await client.validateConfig();
    if (!validation.valid) {
      // ROLLBACK: Restore from backup
      await fs.copyFile(backup.path, AUTOMATIONS_FILE);
      console.error(`Rolled back to backup due to validation failure`);
      throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
    }

    await client.reloadConfig('automation');

    return {
      success: true,
      automation_id,
      message: 'Automation updated and reloaded'
    };
  });

  // Delete automation
  tools.set('ha_delete_automation', async (client: HomeAssistantClient, args: any) => {
    const { automation_id } = args;

    if (!automation_id) {
      throw new Error('automation_id is required');
    }

    // Backup
    await backupFile(AUTOMATIONS_FILE);

    // Read, filter, write
    const automations = await readAutomations();
    const filtered = automations.filter(a => a.id !== automation_id);

    if (filtered.length === automations.length) {
      throw new Error(`Automation ${automation_id} not found`);
    }

    await writeAutomations(filtered);
    await client.reloadConfig('automation');

    return {
      success: true,
      automation_id,
      message: 'Automation deleted and configuration reloaded'
    };
  });

  // List automations
  tools.set('ha_list_automations', async (client: HomeAssistantClient, args: any) => {
    const automations = await readAutomations();

    return {
      count: automations.length,
      automations: automations.map(a => ({
        id: a.id,
        alias: a.alias,
        description: a.description,
        mode: a.mode
      }))
    };
  });
}
