import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SqlService } from './common/database/sql.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly sql: SqlService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const dbOk = await this.sql.ping();
    return {
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk,
      timestamp: new Date().toISOString(),
    };
  }
}
