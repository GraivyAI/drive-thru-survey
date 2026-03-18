import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class SqlService implements OnModuleDestroy {
  private readonly logger = new Logger(SqlService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('database.url');
    if (!url) throw new Error('DATABASE_URL is required');

    const ssl = url.includes('sslmode=') || url.includes('ssl=true')
      ? { rejectUnauthorized: false }
      : false;

    this.pool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl,
    });

    this.pool.on('error', (err: Error) => {
      this.logger.error('Unexpected pool error', err.message);
    });
  }

  async query(sql: string, params?: unknown[]): Promise<{ rows: any[]; rowCount: number | null }> {
    return this.pool.query(sql, params);
  }

  async ping(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
    this.logger.log('Database pool closed');
  }
}
