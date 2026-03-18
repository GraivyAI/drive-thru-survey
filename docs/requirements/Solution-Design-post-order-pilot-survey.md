# Solution Design — Post-Order AI Drive-Thru Pilot Survey

**Version:** 1.1  
**Date:** 2025-03-18  
**Status:** Draft (build-ready)  
**References:** [BRD — Post-Order Pilot Survey](./BRD-post-order-pilot-survey.md)

---

## 1. Overview

Staff-operated mobile web app for collecting 3-question post-order feedback at the drive-thru exit during a 1-week pilot. Staff authenticates via the existing **OCB short code** (from `aot_lanes`), which doubles as auth and location context. Survey responses are tied to orders and locations in the same PostgreSQL database used by ssk-menu-builder.

**Key design constraints:**

- 1-week pilot — fast to build, minimal infrastructure
- Same DB as ssk-menu-builder; migrations run from ssk-menu-builder
- Survey app uses pure SQL (no TypeORM entities for survey tables)
- Tech standards align with drive-thru-analyzer (monorepo, NestJS, Vite/React)

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Repo** | Monorepo: `apps/api` + `apps/ui` | npm workspaces, like drive-thru-analyzer |
| **API** | NestJS 11, TypeScript, `pg` for raw SQL | Global prefix `/api`, ValidationPipe, Swagger (dev only) |
| **UI** | Vite, React 18, React Router, TypeScript | TanStack Query, Tailwind + shadcn/Radix, Zustand, axios, mobile-first |
| **DB** | PostgreSQL (same instance as ssk-menu-builder) | `DATABASE_URL` from shared .env |
| **Auth** | OCB short code → JWT | No PIN table; short code resolved from `aot_lanes` |
| **Deploy** | Azure Container Apps | Dockerfiles for API + UI; GitHub Actions CI/CD |
| **Dev ports** | API: 3010, UI: 5180 | Vite proxy `/api` → `localhost:3010` |

---

## 3. Authentication & Location Context

### 3.1 Flow

```
Staff opens app → enters short code (XXXX or DT-XXXX)
    → API resolves against aot_lanes (same query as servthru-ocb)
    → Valid + ACTIVE → issue JWT { locationId, brandId, laneId, shortCode, exp }
    → Staff sees order list for that location
    → Invalid / inactive → "Invalid code" error
```

### 3.2 Implementation

- `POST /api/auth/short-code` — body: `{ shortCode: string }`
- Resolve via raw SQL against `aot_lanes` (same query as servthru-ocb `ShortCodeService`):

```sql
SELECT "locationId", "laneId", "brandId", "name", "shortCode"
FROM aot_lanes
WHERE "shortCode" = $1
  AND "deletedAt" IS NULL
  AND "status" = 'ACTIVE'
LIMIT 1
```

- On success: sign JWT with `{ locationId, brandId, laneId, shortCode }`, expiry **8 hours** (one shift).
- JWT secret: `JWT_SECRET` env var (can reuse ssk-menu-builder's or set a survey-specific one).
- All subsequent API calls include `Authorization: Bearer <token>`. API extracts `locationId` from token to scope queries.

### 3.3 UI

- Single input field, large touch-friendly numpad-style entry for 4-character code.
- Auto-prepend `DT-` if not present, uppercase, validate `^(DT-)?[A-Z0-9]{4}$`.
- On success → navigate to order list. On failure → shake animation + "Invalid code, try again."

---

## 4. Data Model

### 4.1 `survey_responses` (new table — migration in ssk-menu-builder)

```sql
CREATE TABLE survey_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id),
  location_id   UUID NOT NULL REFERENCES locations(id),
  brand_id      UUID,

  satisfaction_rating   SMALLINT NOT NULL CHECK (satisfaction_rating BETWEEN 1 AND 5),
  easy_to_understand    VARCHAR(20) NOT NULL CHECK (easy_to_understand IN ('YES_COMPLETELY', 'MOSTLY', 'NOT_REALLY')),
  would_use_again       VARCHAR(10) NOT NULL CHECK (would_use_again IN ('YES', 'MAYBE', 'NO')),

  surveyer_short_code   VARCHAR(10),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_survey_responses_order_id ON survey_responses (order_id);
CREATE INDEX idx_survey_responses_location_date ON survey_responses (location_id, created_at);
```

- **One response per order** enforced by unique index on `order_id`.
- `surveyer_short_code` tracks which lane/device submitted (useful for analysis).
- No TypeORM entity in survey app; all CRUD via parameterized raw SQL.

### 4.2 Existing Tables (read-only from survey app)

**`orders`** — columns used:

| Column | Use |
|--------|-----|
| `id` (UUID) | PK, FK from survey_responses |
| `locationId` | Filter orders by location |
| `status` | Filter: show PAID, PROCESSING, COMPLETED |
| `posStatus` | Filter: show SUBMITTED, REJECTED, PENDING_RETRY |
| `orderData` (JSONB) | Display order detail (see §5.3) |
| `subtotal`, `tax`, `tip`, `total` | Display totals |
| `source` | Display (KIOSK, WEB, etc.) |
| `createdAt` | Sort + display time |

**`locations`** — `id`, `name`, `code`, `timezone`.

**`aot_lanes`** — `shortCode`, `locationId`, `laneId`, `brandId`, `status`, `deletedAt`.

---

## 5. API Design

Base: `/api` (global prefix). All endpoints except auth require valid JWT.

### 5.1 Auth

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | `/auth/short-code` | `{ shortCode }` | `{ token, location: { id, name, code }, lane: { id, shortCode } }` | No |

### 5.2 Orders

| Method | Path | Query | Response | Notes |
|--------|------|-------|----------|-------|
| GET | `/orders` | `date` (YYYY-MM-DD, default today) | `Order[]` (summary + surveyed flag) | Scoped to JWT locationId |
| GET | `/orders/:id` | — | Full order with `orderData` | Scoped to JWT locationId |

**Order list SQL** — show orders that reached POS (submitted, or failed at POS):

```sql
SELECT
  o.id,
  o."orderData"->>'orderNumber' AS order_number,
  o.status,
  o."posStatus",
  o.subtotal,
  o.tax,
  o.tip,
  o.total,
  o.source,
  o."createdAt",
  CASE WHEN sr.id IS NOT NULL THEN true ELSE false END AS surveyed
FROM orders o
LEFT JOIN survey_responses sr ON sr.order_id = o.id
WHERE o."locationId" = $1
  AND o."createdAt" >= $2   -- start of "today" (server date or location TZ)
  AND o."createdAt" < $3    -- end of "today"
  AND (
    o."posStatus" IN ('SUBMITTED', 'REJECTED', 'PENDING_RETRY')
    OR o.status IN ('PAID', 'PROCESSING', 'COMPLETED')
  )
ORDER BY o."createdAt" DESC
```

**Order list row** displays:

| Field | Source | Example |
|-------|--------|---------|
| Order number | `orderData->>'orderNumber'` | "A123" |
| Time | `createdAt` | "2:34 PM" |
| Total | `total` | "$12.47" |
| Items preview | `orderData->'items'` (first 2–3 item names) | "Big Mac, Lg Fries, ..." |
| Status | `posStatus` | Chip: "Submitted" / "Rejected" |
| Surveyed | LEFT JOIN survey_responses | Badge or checkmark if already surveyed |

**Newest first** — staff finds the most recent order (the car that just left).

### 5.3 Order Detail (for survey context)

Full order data matching ssk-menu-builder `OrderDetailDrawer`:

| Section | Fields |
|---------|--------|
| **Header** | Order number, date/time, status chip, POS status chip |
| **Items** | Supports both V1 and legacy formats from `orderData.items`: |
| — V1 standalone | `name`, `quantity`, `total_price`, `modifiers[].name` |
| — V1 combo | `name`, `quantity`, `total_price`, `child_items[].name`, `child_items[].modifiers[].name` |
| — Legacy | `name`, `quantity`, `totalPrice`, `specialInstructions`, `modifiers[].name`, `modifiers[].options[].name` |
| **Totals** | Subtotal, tax, tip, total |
| **Payment** | `orderData.paymentDetails`: card brand, last 4, entry method (if present) |

### 5.4 Survey Submission

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| POST | `/survey` | `{ orderId, satisfactionRating, easyToUnderstand, wouldUseAgain }` | `{ id, createdAt }` | 409 if already surveyed |

- Validate: `satisfactionRating` 1–5, `easyToUnderstand` in enum, `wouldUseAgain` in enum.
- `INSERT INTO survey_responses ...` — unique constraint catches duplicates → return 409.
- `locationId` and `brandId` from JWT (not from request body).

### 5.5 Report & Export

| Method | Path | Query | Response | Notes |
|--------|------|-------|----------|-------|
| GET | `/survey/report` | `dateFrom`, `dateTo` (defaults: today) | `{ summary, responses[] }` | Scoped to JWT locationId |
| GET | `/survey/export` | `dateFrom`, `dateTo` | CSV file download | Same scope |

**Report response shape:**

```json
{
  "summary": {
    "totalOrders": 47,
    "totalSurveyed": 32,
    "surveyRate": 0.68,
    "avgSatisfaction": 4.2,
    "satisfactionDistribution": { "1": 1, "2": 2, "3": 3, "4": 12, "5": 14 },
    "easyToUnderstand": { "YES_COMPLETELY": 20, "MOSTLY": 9, "NOT_REALLY": 3 },
    "wouldUseAgain": { "YES": 22, "MAYBE": 7, "NO": 3 }
  },
  "responses": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "orderNumber": "A123",
      "orderTotal": 12.47,
      "orderTime": "2025-03-18T14:34:00Z",
      "satisfactionRating": 5,
      "easyToUnderstand": "YES_COMPLETELY",
      "wouldUseAgain": "YES",
      "createdAt": "2025-03-18T14:36:00Z"
    }
  ]
}
```

**CSV columns:**

```
Date, Time, Order Number, Order Total, Items, Satisfaction (1-5), Easy to Understand, Would Use Again
```

- CSV injection prevention: prefix `=`, `+`, `-`, `@` with `'` (same as drive-thru-analyzer).

---

## 6. UI Screens

### 6.1 Screen Flow

```
[1. Login]  →  [2. Order List]  →  [3. Survey Form]  →  [back to 2]
                     ↓
              [4. Report View]  →  [Export CSV]
```

### 6.2 Screen Details

**Screen 1 — Login (short code entry)**

- Large centered input, 4-char code, numpad-style or keyboard.
- Auto-prepend `DT-`, uppercase. Submit → resolve → JWT → navigate to order list.
- Location name shown on success confirmation before proceeding.

**Screen 2 — Order List**

- Header: location name, today's date, survey progress (e.g. "12 of 34 surveyed").
- List: card per order, newest first. Each card shows:
  - Order number + time (e.g. "A123 — 2:34 PM")
  - Item preview (first 2–3 item names, truncated)
  - Total (e.g. "$12.47")
  - POS status chip (Submitted / Rejected / Pending Retry)
  - Surveyed indicator (checkmark or "Surveyed" badge if done; tap disabled)
- Tap unsurveyed order → navigate to survey form.
- Tap surveyed order → view order detail (read-only, no re-survey).
- Bottom nav or header toggle: **Orders** | **Report**.
- Pull-to-refresh or auto-poll (30s) for new orders.

**Screen 3 — Survey Form**

- Order context at top: order number, time, items summary, total (compact version of order detail).
- Expandable/collapsible full order detail (matching ssk-menu-builder drawer layout).
- Three questions, large touch targets:
  - **Q1 Satisfaction:** 1–5 star/button row (tap to select).
  - **Q2 Easy to understand:** 3 large buttons (Yes completely / Mostly / Not really).
  - **Q3 Would use again:** 3 large buttons (Yes / Maybe / No).
- **Submit** button (disabled until all 3 answered).
- On success: toast "Survey saved", auto-navigate back to order list.
- On 409 (duplicate): toast "Already surveyed", navigate back.

**Screen 4 — Report View**

- Date range picker (defaults to today).
- **Summary cards** at top:
  - Survey rate: "32 of 47 orders (68%)"
  - Avg satisfaction: "4.2 / 5" with star visualization
  - Q2 distribution: horizontal bar (Yes completely / Mostly / Not really)
  - Q3 distribution: horizontal bar (Yes / Maybe / No)
- **Response table** below: scrollable list of individual responses (date, order #, total, 3 answers).
- **Export CSV** button in header → triggers download for current date range.

### 6.3 Mobile-First

- All screens designed for 375px+ width (phone).
- Large touch targets (min 44px).
- Bottom navigation or sticky header for Orders/Report toggle.
- No horizontal scroll; single-column layout.

---

## 7. Configuration

### 7.1 Required Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Shared with ssk-menu-builder | PostgreSQL connection string |
| `JWT_SECRET` | Survey-specific or shared | Secret for signing short-code auth JWTs |
| `PORT` | Survey API | Default: `3010` |
| `CORS_ORIGIN` | Survey API | Default: `http://localhost:5180` |
| `NODE_ENV` | Standard | `development` / `production` |

### 7.2 Zod Validation at Bootstrap

```typescript
z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  PORT: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})
```

---

## 8. Migrations (run from ssk-menu-builder)

**Migration file** in `kiosk/ssk-menu-builder/backend/src/migrations/`:

- Name: `<timestamp>-CreateSurveyResponsesTable.ts`
- Creates `survey_responses` table (see §4.1).
- Up: `CREATE TABLE`, indexes, unique constraint.
- Down: `DROP TABLE survey_responses`.

Survey app does **not** run migrations. It assumes the table exists and uses raw SQL.

---

## 9. Deployment

- **Azure Container Apps** (same pattern as drive-thru-analyzer).
- **API Dockerfile**: multi-stage Node 20 Alpine build → production runtime.
- **UI Dockerfile**: multi-stage build (Vite) → nginx serving static assets, proxy `/api` to API container.
- **GitHub Actions**: Build → push to ACR → update container apps → health check.
- **Container app names** (example): `survey-api-dev`, `survey-ui-dev`.

---

## 10. Defaults (pilot-scoped)

| Decision | Value | Rationale |
|----------|-------|-----------|
| Order list direction | Newest first | Staff finds the car that just left |
| "Today" boundary | Server date (UTC midnight to midnight) | Good enough for 1-week pilot |
| Session duration | 8 hours (JWT exp) | One shift, no re-auth needed |
| Freeform notes | No | Just the 3 structured questions per BRD |
| Brand scoping | Location only (brandId stored but not filtered) | Single brand per pilot location |
| Offline support | None — show error if offline | Pilot locations have Wi-Fi |
| Auto-refresh order list | Poll every 30 seconds | New orders appear without manual refresh |

---

## 11. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-03-18 | Initial solution design |
| 1.1 | 2025-03-18 | Resolved all build-blocking gaps: short code = auth + location; exact order status filters (SUBMITTED + REJECTED + PENDING_RETRY, PAID + PROCESSING + COMPLETED); full order detail matching ssk-menu-builder drawer (V1 + legacy items); report view with summary cards + distribution + CSV export; concrete UI screen flow; env vars and config validation; defaults table. |
