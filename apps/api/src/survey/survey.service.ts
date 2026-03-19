import { Injectable, Logger } from '@nestjs/common';
import { SqlService } from '../common/database/sql.service';
import { getDayBoundsInUtc } from '../common/utils/timezone.utils';

@Injectable()
export class SurveyService {
  private readonly logger = new Logger(SurveyService.name);

  constructor(private readonly sql: SqlService) {
    this.logger.debug('SurveyService initialized');
  }

  async submit(params: {
    orderId: string;
    locationId: string;
    brandId: string;
    satisfactionRating: number;
    easyToUnderstand: string;
    wouldUseAgain: string;
    surveyerShortCode: string;
  }) {
    const result = await this.sql.query(
      `INSERT INTO survey_responses
        (order_id, location_id, brand_id, satisfaction_rating, easy_to_understand, would_use_again, surveyer_short_code, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED')
      ON CONFLICT (order_id) DO UPDATE SET
        satisfaction_rating = EXCLUDED.satisfaction_rating,
        easy_to_understand = EXCLUDED.easy_to_understand,
        would_use_again = EXCLUDED.would_use_again,
        surveyer_short_code = EXCLUDED.surveyer_short_code,
        status = 'COMPLETED',
        created_at = NOW()
      RETURNING id, created_at`,
      [
        params.orderId,
        params.locationId,
        params.brandId,
        params.satisfactionRating,
        params.easyToUnderstand,
        params.wouldUseAgain,
        params.surveyerShortCode,
      ],
    );
    return result.rows[0];
  }

  async skip(params: {
    orderId: string;
    locationId: string;
    brandId: string;
    surveyerShortCode: string;
  }) {
    const result = await this.sql.query(
      `INSERT INTO survey_responses
        (order_id, location_id, brand_id, surveyer_short_code, status)
      VALUES ($1, $2, $3, $4, 'SKIPPED')
      ON CONFLICT (order_id) DO UPDATE SET
        satisfaction_rating = NULL,
        easy_to_understand = NULL,
        would_use_again = NULL,
        surveyer_short_code = EXCLUDED.surveyer_short_code,
        status = 'SKIPPED',
        created_at = NOW()
      RETURNING id, created_at`,
      [params.orderId, params.locationId, params.brandId, params.surveyerShortCode],
    );
    return result.rows[0];
  }

  async unskip(params: {
    orderId: string;
    locationId: string;
  }) {
    const result = await this.sql.query(
      `DELETE FROM survey_responses
       WHERE order_id = $1 AND location_id = $2 AND status = 'SKIPPED'
       RETURNING id`,
      [params.orderId, params.locationId],
    );
    if (result.rowCount === 0) {
      return { deleted: false };
    }
    return { deleted: true, id: result.rows[0].id };
  }

  async getByOrderId(orderId: string, locationId: string) {
    const result = await this.sql.query(
      `SELECT id, order_id, satisfaction_rating, easy_to_understand, would_use_again, status, created_at
       FROM survey_responses
       WHERE order_id = $1 AND location_id = $2
       LIMIT 1`,
      [orderId, locationId],
    );
    return result.rows[0] || null;
  }

  private async getLocationTimezone(locationId: string): Promise<string> {
    const result = await this.sql.query(
      `SELECT timezone FROM locations WHERE id = $1 LIMIT 1`,
      [locationId],
    );
    return result.rows[0]?.timezone || 'UTC';
  }

  async getReport(locationId: string, dateFrom: string, dateTo: string) {
    const timezone = await this.getLocationTimezone(locationId);
    const { startUtc: startOfDay } = getDayBoundsInUtc(dateFrom, timezone);
    const { endUtc: endOfDay } = getDayBoundsInUtc(dateTo, timezone);

    const [summaryResult, responsesResult, totalOrdersResult] = await Promise.all([
      this.sql.query(
        `SELECT
          COUNT(*)::int AS total_responses,
          COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS total_completed,
          COUNT(*) FILTER (WHERE status = 'SKIPPED')::int AS total_skipped,
          ROUND(AVG(satisfaction_rating) FILTER (WHERE status = 'COMPLETED'), 2)::float AS avg_satisfaction,
          COUNT(*) FILTER (WHERE satisfaction_rating = 1)::int AS sat_1,
          COUNT(*) FILTER (WHERE satisfaction_rating = 2)::int AS sat_2,
          COUNT(*) FILTER (WHERE satisfaction_rating = 3)::int AS sat_3,
          COUNT(*) FILTER (WHERE satisfaction_rating = 4)::int AS sat_4,
          COUNT(*) FILTER (WHERE satisfaction_rating = 5)::int AS sat_5,
          COUNT(*) FILTER (WHERE easy_to_understand = 'YES_COMPLETELY')::int AS etu_yes,
          COUNT(*) FILTER (WHERE easy_to_understand = 'MOSTLY')::int AS etu_mostly,
          COUNT(*) FILTER (WHERE easy_to_understand = 'NOT_REALLY')::int AS etu_not_really,
          COUNT(*) FILTER (WHERE would_use_again = 'YES')::int AS wua_yes,
          COUNT(*) FILTER (WHERE would_use_again = 'MAYBE')::int AS wua_maybe,
          COUNT(*) FILTER (WHERE would_use_again = 'NO')::int AS wua_no
        FROM survey_responses
        WHERE location_id = $1 AND created_at >= $2 AND created_at <= $3`,
        [locationId, startOfDay, endOfDay],
      ),

      this.sql.query(
        `SELECT
          sr.id,
          sr.order_id AS "orderId",
          o."orderData"->>'orderNumber' AS "orderNumber",
          o.total::text AS "orderTotal",
          o."createdAt" AS "orderTime",
          sr.satisfaction_rating AS "satisfactionRating",
          sr.easy_to_understand AS "easyToUnderstand",
          sr.would_use_again AS "wouldUseAgain",
          sr.status,
          sr.created_at AS "createdAt"
        FROM survey_responses sr
        JOIN orders o ON o.id = sr.order_id
        WHERE sr.location_id = $1 AND sr.created_at >= $2 AND sr.created_at <= $3
        ORDER BY sr.created_at DESC`,
        [locationId, startOfDay, endOfDay],
      ),

      this.sql.query(
        `SELECT COUNT(*)::int AS total
        FROM orders
        WHERE "locationId" = $1
          AND "createdAt" >= $2 AND "createdAt" <= $3
          AND (
            "posStatus" IN ('SUBMITTED', 'REJECTED', 'PENDING_RETRY')
            OR status IN ('PAID', 'PROCESSING', 'COMPLETED')
          )`,
        [locationId, startOfDay, endOfDay],
      ),
    ]);

    const s = summaryResult.rows[0] || {};
    const totalOrders = Number(totalOrdersResult.rows[0]?.total) || 0;
    const totalResponses = Number(s.total_responses) || 0;
    const totalCompleted = Number(s.total_completed) || 0;
    const totalSkipped = Number(s.total_skipped) || 0;

    return {
      summary: {
        totalOrders,
        totalResponses,
        totalCompleted,
        totalSkipped,
        responseRate: totalOrders > 0 ? +(totalResponses / totalOrders).toFixed(2) : 0,
        completionRate: totalOrders > 0 ? +(totalCompleted / totalOrders).toFixed(2) : 0,
        avgSatisfaction: s?.avg_satisfaction || 0,
        satisfactionDistribution: {
          1: s?.sat_1 || 0, 2: s?.sat_2 || 0, 3: s?.sat_3 || 0, 4: s?.sat_4 || 0, 5: s?.sat_5 || 0,
        },
        easyToUnderstand: {
          YES_COMPLETELY: s?.etu_yes || 0, MOSTLY: s?.etu_mostly || 0, NOT_REALLY: s?.etu_not_really || 0,
        },
        wouldUseAgain: {
          YES: s?.wua_yes || 0, MAYBE: s?.wua_maybe || 0, NO: s?.wua_no || 0,
        },
      },
      responses: responsesResult.rows,
    };
  }

  async exportCsv(locationId: string, dateFrom: string, dateTo: string): Promise<string> {
    const timezone = await this.getLocationTimezone(locationId);
    const { startUtc: startOfDay } = getDayBoundsInUtc(dateFrom, timezone);
    const { endUtc: endOfDay } = getDayBoundsInUtc(dateTo, timezone);

    const result = await this.sql.query(
      `SELECT
        sr.created_at,
        o."orderData"->>'orderNumber' AS order_number,
        o.total::text AS order_total,
        o."createdAt" AS order_time,
        sr.satisfaction_rating,
        sr.easy_to_understand,
        sr.would_use_again
      FROM survey_responses sr
      JOIN orders o ON o.id = sr.order_id
      WHERE sr.location_id = $1 AND sr.created_at >= $2 AND sr.created_at <= $3
      ORDER BY sr.created_at DESC`,
      [locationId, startOfDay, endOfDay],
    );

    const header = 'Date,Time,Order Number,Order Total,Satisfaction (1-5),Easy to Understand,Would Use Again';
    const rows = result.rows.map((r: Record<string, unknown>) => {
      const dt = new Date(r.created_at as string);
      const date = dt.toISOString().slice(0, 10);
      const time = dt.toISOString().slice(11, 16);
      return [
        date,
        time,
        this.escapeCsv(String(r.order_number || '')),
        this.escapeCsv(String(r.order_total || '')),
        r.satisfaction_rating,
        this.escapeCsv(String(r.easy_to_understand || '')),
        this.escapeCsv(String(r.would_use_again || '')),
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  private escapeCsv(value: string): string {
    let safe = value;
    if (/^[=+\-@\t\r]/.test(safe)) {
      safe = `'${safe}`;
    }
    if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
      safe = `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  }
}
