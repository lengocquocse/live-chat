export interface HistoryEntry {
  id: string;
  command: string;
  workingDirectory: string;
  exitCode: number;
  output: string;
  executionTime: number;
  timestamp: Date;
  success: boolean;
}

export interface HistoryQuery {
  limit?: number;
  offset?: number;
}

export interface HistoryResponse {
  total: number;
  entries: HistoryEntry[];
}
