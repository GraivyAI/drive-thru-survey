import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SqlService } from '../common/database/sql.service';

export interface JwtPayload {
  locationId: string;
  brandId: string;
  laneId: string;
  shortCode: string;
}

export interface LoginResult {
  token: string;
  location: { id: string; name: string; code: string };
  lane: { id: string; shortCode: string; name: string | null };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly sql: SqlService,
    private readonly jwtService: JwtService,
  ) {}

  async loginWithShortCode(rawCode: string): Promise<LoginResult> {
    const normalized = rawCode.toUpperCase().startsWith('DT-')
      ? rawCode.toUpperCase()
      : `DT-${rawCode.toUpperCase()}`;

    const laneResult = await this.sql.query(
      `SELECT "locationId", "laneId", "brandId", "name", "shortCode"
       FROM aot_lanes
       WHERE "shortCode" = $1
         AND "deletedAt" IS NULL
         AND "status" = 'ACTIVE'
       LIMIT 1`,
      [normalized],
    );

    if (laneResult.rowCount === 0) {
      this.logger.warn(`Invalid short code attempt: ${normalized}`);
      throw new UnauthorizedException('Invalid or inactive lane code');
    }

    const lane = laneResult.rows[0];

    const locResult = await this.sql.query(
      `SELECT "name", "code" FROM locations WHERE "id" = $1 LIMIT 1`,
      [lane.locationId],
    );

    const loc = locResult.rows[0] || { name: 'Unknown', code: '' };

    const payload: JwtPayload = {
      locationId: lane.locationId,
      brandId: lane.brandId,
      laneId: lane.laneId,
      shortCode: lane.shortCode,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      location: { id: lane.locationId, name: loc.name, code: loc.code },
      lane: { id: lane.laneId, shortCode: lane.shortCode, name: lane.name },
    };
  }

  verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
