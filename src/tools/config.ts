// ABOUTME: MCP tools for reading and writing Home Assistant configuration files
// ABOUTME: Provides ha_read_config, ha_write_config, ha_list_files, ha_validate_config, ha_reload_config

import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { HomeAssistantClient } from '../ha-client.js';
import { backupFile, listBackups } from '../backup.js';

const CONFIG_DIR = '/config';

/**
 * Validate that a user-provided path is within the config directory
 * Prevents path traversal attacks
 */
function validatePath(userPath: string): string {
  const fullPath = join(CONFIG_DIR, userPath);
  const normalized = resolve(fullPath);

  // Ensure the resolved path is within CONFIG_DIR
  if (!normalized.startsWith(resolve(CONFIG_DIR))) {
    throw new Error('Invalid path: access outside config directory not allowed');
  }

  return normalized;
}

export function registerConfigTools(tools: Map<string, Function>) {
  // Read configuration file
  tools.set('ha_read_config', async (client: HomeAssistantClient, args: any) => {
    const { path } = args;

    if (!path) {
      throw new Error('path is required');
    }

    const fullPath = validatePath(path);
    const content = await fs.readFile(fullPath, 'utf-8');

    return {
      path,
      content,
      size: content.length
    };
  });

  // Write configuration file
  tools.set('ha_write_config', async (client: HomeAssistantClient, args: any) => {
    const { path, content, validate = true } = args;

    if (!path || content === undefined) {
      throw new Error('path and content are required');
    }

    const fullPath = validatePath(path);

    // Backup existing file if it exists
    let backupPath: string | undefined;
    try {
      await fs.access(fullPath);
      const backup = await backupFile(fullPath);
      backupPath = backup.path;
      console.error(`Backed up to: ${backup.path}`);
    } catch {
      // File doesn't exist, no backup needed
    }

    // Write new content
    await fs.writeFile(fullPath, content, 'utf-8');

    // Validate if requested
    if (validate) {
      const validation = await client.validateConfig();
      if (!validation.valid) {
        // ROLLBACK: Restore from backup if it exists
        if (backupPath) {
          await fs.copyFile(backupPath, fullPath);
          console.error(`Rolled back to backup due to validation failure`);
        }
        throw new Error(`Configuration validation failed: ${validation.errors?.join(', ')}`);
      }
    }

    return {
      success: true,
      path,
      size: content.length,
      validated: validate
    };
  });

  // List configuration files
  tools.set('ha_list_files', async (client: HomeAssistantClient, args: any) => {
    const { path = '', pattern } = args;

    const fullPath = validatePath(path);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    let files = entries.map(entry => ({
      name: entry.name,
      path: join(path, entry.name),
      type: entry.isDirectory() ? 'directory' : 'file'
    }));

    if (pattern) {
      const regex = new RegExp(pattern);
      files = files.filter(f => regex.test(f.name));
    }

    return {
      count: files.length,
      files
    };
  });

  // Validate configuration
  tools.set('ha_validate_config', async (client: HomeAssistantClient, args: any) => {
    const validation = await client.validateConfig();
    return validation;
  });

  // Reload configuration
  tools.set('ha_reload_config', async (client: HomeAssistantClient, args: any) => {
    const { type = 'automation' } = args;

    await client.reloadConfig(type as 'core' | 'automation' | 'script');

    return {
      success: true,
      type,
      message: `${type} configuration reloaded`
    };
  });

  // List backups
  tools.set('ha_list_backups', async (client: HomeAssistantClient, args: any) => {
    const { filename } = args;

    if (!filename) {
      throw new Error('filename is required');
    }

    const backups = await listBackups(filename);

    return {
      count: backups.length,
      backups
    };
  });
}
