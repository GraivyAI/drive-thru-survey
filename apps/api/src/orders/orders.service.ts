import { Injectable } from '@nestjs/common';
import { SqlService } from '../common/database/sql.service';
import { getDayBoundsInUtc, getTodayBoundsInUtc } from '../common/utils/timezone.utils';

export interface OrderSummaryRow {
  id: string;
  order_number: string | null;
  status: string;
  posStatus: string;
  subtotal: string;
  tax: string;
  tip: string;
  total: string;
  source: string;
  createdAt: Date;
  orderData: Record<string, unknown>;
  surveyed: boolean;
  surveyStatus: string | null;
}

@Injectable()
export class OrdersService {
  constructor(private readonly sql: SqlService) {}

  private async getLocationTimezone(locationId: string): Promise<string> {
    const result = await this.sql.query(
      `SELECT timezone FROM locations WHERE id = $1 LIMIT 1`,
      [locationId],
    );
    return result.rows[0]?.timezone || 'UTC';
  }

  async listForLocationToday(locationId: string, date?: string): Promise<OrderSummaryRow[]> {
    const timezone = await this.getLocationTimezone(locationId);

    let startOfDay: string;
    let endOfDay: string;

    if (date) {
      const bounds = getDayBoundsInUtc(date, timezone);
      startOfDay = bounds.startUtc;
      endOfDay = bounds.endUtc;
    } else {
      const bounds = getTodayBoundsInUtc(timezone);
      startOfDay = bounds.startUtc;
      endOfDay = bounds.endUtc;
    }

    const result = await this.sql.query(
      `SELECT
        o.id,
        o."orderData"->>'orderNumber' AS order_number,
        o.status,
        o."posStatus",
        o.subtotal::text,
        o.tax::text,
        o.tip::text,
        o.total::text,
        o.source,
        o."createdAt",
        o."orderData",
        CASE WHEN sr.id IS NOT NULL THEN true ELSE false END AS surveyed,
        sr.status AS "surveyStatus"
      FROM orders o
      LEFT JOIN survey_responses sr ON sr.order_id = o.id
      WHERE o."locationId" = $1
        AND o."createdAt" >= $2
        AND o."createdAt" <= $3
        AND (
          o."posStatus" IN ('SUBMITTED', 'REJECTED', 'PENDING_RETRY')
          OR o.status IN ('PAID', 'PROCESSING', 'COMPLETED')
        )
      ORDER BY o."createdAt" DESC`,
      [locationId, startOfDay, endOfDay],
    );

    return result.rows;
  }

  async getById(orderId: string, locationId: string) {
    const result = await this.sql.query(
      `SELECT
        o.id,
        o."orderData",
        o.status,
        o."posStatus",
        o.subtotal::text,
        o.tax::text,
        o.tip::text,
        o.total::text,
        o.source,
        o."createdAt",
        o."locationId",
        CASE WHEN sr.id IS NOT NULL THEN true ELSE false END AS surveyed,
        sr.status AS "surveyStatus"
      FROM orders o
      LEFT JOIN survey_responses sr ON sr.order_id = o.id
      WHERE o.id = $1 AND o."locationId" = $2
      LIMIT 1`,
      [orderId, locationId],
    );

    return result.rows[0] || null;
  }
}
