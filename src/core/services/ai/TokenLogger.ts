import { AiLogEntry } from '../../types';
import { apiGet } from '../api';

export class TokenLogger {
  private static instance: TokenLogger;

  private constructor() {}

  public static getInstance(): TokenLogger {
    if (!TokenLogger.instance) {
      TokenLogger.instance = new TokenLogger();
    }
    return TokenLogger.instance;
  }

  public async getRecentLogs(): Promise<AiLogEntry[]> {
    const data = await apiGet<{ logs: AiLogEntry[] }>('/api/ai/logs?limit=50');
    return data?.logs ?? [];
  }
}

export const tokenLogger = TokenLogger.getInstance();
