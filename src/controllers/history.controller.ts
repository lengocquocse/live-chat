import { Request, Response, NextFunction } from 'express';
import { historyManager } from '../services/historyManager';
import { HistoryQuery } from '../models/history.model';
import logger from '../utils/logger';

export class HistoryController {
  /**
   * Get paginated history entries
   */
  async getEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: HistoryQuery = req.query;

      const response = await historyManager.getEntries(query);

      res.status(200).json({
        success: true,
        ...response
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single history entry by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const entry = await historyManager.getById(id);

      if (!entry) {
        res.status(404).json({
          success: false,
          error: 'History entry not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        entry
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear all history
   */
  async clear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await historyManager.clear();

      logger.info('History cleared by user', { ip: req.ip });

      res.status(200).json({
        success: true,
        message: 'History cleared successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const historyController = new HistoryController();
