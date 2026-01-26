import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import config from '../config/environment';
import logger from '../utils/logger';
import { HistoryEntry, HistoryQuery, HistoryResponse } from '../models/history.model';

export class HistoryManager {
  private cache: HistoryEntry[] = [];
  private readonly maxCacheSize = 100;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize history storage and load cache
   */
  private async initialize(): Promise<void> {
    try {
      const historyDir = path.dirname(config.history.filePath);

      // Create data directory if it doesn't exist
      if (!fsSync.existsSync(historyDir)) {
        await fs.mkdir(historyDir, { recursive: true });
        logger.info(`Created history directory: ${historyDir}`);
      }

      // Create empty history file if it doesn't exist
      if (!fsSync.existsSync(config.history.filePath)) {
        await fs.writeFile(config.history.filePath, JSON.stringify([]), 'utf8');
        logger.info(`Created history file: ${config.history.filePath}`);
      }

      // Load initial cache
      await this.loadCache();
      this.initialized = true;

      logger.info('History manager initialized', {
        filePath: config.history.filePath,
        cacheSize: this.cache.length
      });
    } catch (error) {
      logger.error('Failed to initialize history manager', { error });
      throw error;
    }
  }

  /**
   * Load recent entries into cache
   */
  private async loadCache(): Promise<void> {
    try {
      const data = await fs.readFile(config.history.filePath, 'utf8');
      const entries: HistoryEntry[] = JSON.parse(data);

      // Load last N entries into cache
      this.cache = entries.slice(-this.maxCacheSize);

      logger.debug(`Loaded ${this.cache.length} entries into cache`);
    } catch (error) {
      logger.error('Failed to load cache', { error });
      this.cache = [];
    }
  }

  /**
   * Add new history entry
   */
  async addEntry(entry: HistoryEntry): Promise<void> {
    try {
      // Add to cache
      this.cache.push(entry);
      if (this.cache.length > this.maxCacheSize) {
        this.cache.shift();
      }

      // Read current history
      let entries: HistoryEntry[] = [];
      try {
        const data = await fs.readFile(config.history.filePath, 'utf8');
        entries = JSON.parse(data);
      } catch (error) {
        logger.warn('Failed to read history file, starting fresh', { error });
      }

      // Add new entry
      entries.push(entry);

      // Check if rotation is needed
      const currentSize = Buffer.byteLength(JSON.stringify(entries), 'utf8');
      if (currentSize > config.history.maxSize || entries.length > config.history.maxEntries) {
        entries = await this.rotateHistory(entries);
      }

      // Write back to file
      await fs.writeFile(config.history.filePath, JSON.stringify(entries, null, 2), 'utf8');

      logger.debug('History entry added', {
        id: entry.id,
        totalEntries: entries.length
      });
    } catch (error) {
      logger.error('Failed to add history entry', { error, entryId: entry.id });
      throw error;
    }
  }

  /**
   * Rotate history by archiving old entries
   */
  private async rotateHistory(entries: HistoryEntry[]): Promise<HistoryEntry[]> {
    try {
      const archiveFileName = `history_${Date.now()}.json`;
      const archiveDir = path.join(path.dirname(config.history.filePath), 'archive');

      // Create archive directory
      if (!fsSync.existsSync(archiveDir)) {
        await fs.mkdir(archiveDir, { recursive: true });
      }

      // Archive old entries (keep last 50%)
      const keepCount = Math.floor(config.history.maxEntries / 2);
      const toArchive = entries.slice(0, -keepCount);
      const toKeep = entries.slice(-keepCount);

      if (toArchive.length > 0) {
        const archivePath = path.join(archiveDir, archiveFileName);
        await fs.writeFile(archivePath, JSON.stringify(toArchive, null, 2), 'utf8');
        logger.info(`Archived ${toArchive.length} history entries to ${archivePath}`);
      }

      return toKeep;
    } catch (error) {
      logger.error('Failed to rotate history', { error });
      // Return last 50% of entries if rotation fails
      return entries.slice(-Math.floor(config.history.maxEntries / 2));
    }
  }

  /**
   * Get history entries with pagination
   */
  async getEntries(query: HistoryQuery = {}): Promise<HistoryResponse> {
    try {
      const data = await fs.readFile(config.history.filePath, 'utf8');
      const allEntries: HistoryEntry[] = JSON.parse(data);

      const limit = query.limit || 50;
      const offset = query.offset || 0;

      // Sort by timestamp descending (most recent first)
      const sortedEntries = allEntries.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Apply pagination
      const paginatedEntries = sortedEntries.slice(offset, offset + limit);

      return {
        total: allEntries.length,
        entries: paginatedEntries
      };
    } catch (error) {
      logger.error('Failed to get history entries', { error });
      throw error;
    }
  }

  /**
   * Get single history entry by ID
   */
  async getById(id: string): Promise<HistoryEntry | null> {
    try {
      // Check cache first
      const cachedEntry = this.cache.find(entry => entry.id === id);
      if (cachedEntry) {
        return cachedEntry;
      }

      // Search in file
      const data = await fs.readFile(config.history.filePath, 'utf8');
      const entries: HistoryEntry[] = JSON.parse(data);

      return entries.find(entry => entry.id === id) || null;
    } catch (error) {
      logger.error('Failed to get history entry by ID', { error, id });
      throw error;
    }
  }

  /**
   * Clear all history
   */
  async clear(): Promise<void> {
    try {
      await fs.writeFile(config.history.filePath, JSON.stringify([]), 'utf8');
      this.cache = [];

      logger.info('History cleared');
    } catch (error) {
      logger.error('Failed to clear history', { error });
      throw error;
    }
  }
}

export const historyManager = new HistoryManager();
