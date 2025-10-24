// ABOUTME: Utilities for backing up configuration files before modification
// ABOUTME: Maintains last 5 versions of each file for rollback capability

import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { BackupMetadata } from './types.js';

const BACKUP_DIR = '/config/.mcp_backups';
const MAX_BACKUPS = 5;

/**
 * Create backup of a configuration file
 */
export async function backupFile(filePath: string): Promise<BackupMetadata> {
  // Ensure backup directory exists
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw new Error(`Failed to create backup directory: ${error.message}`);
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = basename(filePath);
  const backupPath = join(BACKUP_DIR, `${fileName}.${timestamp}.bak`);

  // Copy file to backup
  await fs.copyFile(filePath, backupPath);

  // Clean old backups
  await cleanOldBackups(fileName);

  return {
    path: backupPath,
    timestamp,
    original_path: filePath
  };
}

/**
 * Remove old backups, keeping only MAX_BACKUPS most recent
 */
async function cleanOldBackups(fileName: string): Promise<void> {
  const files = await fs.readdir(BACKUP_DIR);
  const backups = files
    .filter(f => f.startsWith(fileName) && f.endsWith('.bak'))
    .sort()
    .reverse();

  // Remove old backups beyond MAX_BACKUPS
  for (let i = MAX_BACKUPS; i < backups.length; i++) {
    await fs.unlink(join(BACKUP_DIR, backups[i]));
  }
}

/**
 * List available backups for a file
 */
export async function listBackups(fileName: string): Promise<BackupMetadata[]> {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = files
      .filter(f => f.startsWith(fileName) && f.endsWith('.bak'))
      .sort()
      .reverse();

    return backups.map(f => {
      const timestampMatch = f.match(/\.(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.bak$/);
      return {
        path: join(BACKUP_DIR, f),
        timestamp: timestampMatch ? timestampMatch[1] : 'unknown',
        original_path: `/config/${fileName}`
      };
    });
  } catch {
    return [];
  }
}
