# Implementation Plan — Post-Order Pilot Survey

**Approach:** Waterfall. Each phase completes fully before the next begins.  
**Builder:** AI (Cursor agent)  
**Verification:** Lint checks + code review after each phase. User starts/tests the running apps.

---

## Phase 0 — Migration File (in ssk-menu-builder)

**Goal:** Create the `survey_responses` table in the shared database.

**Deliverables:**
- Migration file in `kiosk/ssk-menu-builder/backend/src/migrations/<timestamp>-CreateSurveyResponses.ts`
- UP: `CREATE TABLE survey_responses` with all columns, constraints, indexes per Solution Design §4.1
- DOWN: `DROP TABLE survey_responses`

**Verify:**
- Migration file follows ssk-menu-builder's existing migration conventions (check naming, class structure)
- SQL is valid (correct types, constraints, FK references to `orders.id` and `locations.id`)
- Unique index on `order_id` present

**Depends on:** Nothing. Can be done first and run independently.

---

## Phase 1 — Monorepo Scaffold

**Goal:** Empty but runnable monorepo with both apps bootstrapped.

**Deliverables:**
- `drive-thru-survey/package.json` — root with `"workspaces": ["apps/*"]`, lint/test scripts
- `drive-thru-survey/tsconfig.base.json`
- `drive-thru-survey/.gitignore`
- `apps/api/` — NestJS app: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `src/main.ts`, `src/app.module.ts`, `src/app.controller.ts` (health only)
- `apps/ui/` — Vite React app: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx` (placeholder), `tailwind.config.js`, `postcss.config.js`, `src/index.css`
- `.env.example` for API

**Verify:**
- All `package.json` files have correct dependencies (no made-up versions — use latest from npm)
- TypeScript configs extend base correctly
- Vite config has `@/` alias and proxy to API port 3010
- API main.ts has global prefix `api`, port 3010, Swagger (dev only), ValidationPipe
- No lint errors in any file

**Depends on:** Nothing.

---

## Phase 2 — API: Config, Database, Health

**Goal:** API can connect to PostgreSQL and respond to health checks.

**Deliverables:**
- `apps/api/src/config/configuration.ts` — structured config from env
- `apps/api/src/config/config.validation.ts` — Zod validation (DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN)
- `apps/api/src/common/database/database.module.ts` — `pg` Pool provider (raw SQL, not TypeORM)
- `apps/api/src/common/database/sql.service.ts` — thin wrapper: `query(sql, params)` → parameterized queries only
- `apps/api/src/health.controller.ts` — `GET /api/health` → 200 + DB ping
- `apps/api/src/common/filters/http-exception.filter.ts` — error envelope (statusCode, error, message, traceId)
- `apps/api/src/common/interceptors/request-logging.interceptor.ts`
- Update `app.module.ts` to wire everything

**Verify:**
- Config validation schema matches Solution Design §7
- `SqlService` uses parameterized queries only (no string interpolation)
- Pool uses `DATABASE_URL` with SSL handling matching analyzer pattern
- Health controller imports and uses `SqlService` correctly
- No lint errors

**Depends on:** Phase 1 complete.

---

## Phase 3 — API: Auth (Short Code → JWT)

**Goal:** Staff can authenticate with a short code and receive a JWT.

**Deliverables:**
- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/auth.controller.ts` — `POST /api/auth/short-code`
- `apps/api/src/auth/auth.service.ts` — resolve short code from `aot_lanes` via raw SQL, sign JWT
- `apps/api/src/auth/dto/short-code-login.dto.ts` — body validation (`shortCode: string`)
- `apps/api/src/auth/dto/login-response.dto.ts` — response shape (token, location, lane)
- `apps/api/src/auth/guards/jwt-auth.guard.ts` — extract + verify JWT, attach `locationId`/`brandId` to request
- `apps/api/src/auth/decorators/current-location.decorator.ts` — `@CurrentLocation()` param decorator

**Verify:**
- SQL matches servthru-ocb's short code query exactly (SELECT from aot_lanes WHERE shortCode = $1 AND deletedAt IS NULL AND status = 'ACTIVE')
- JWT payload contains `locationId`, `brandId`, `laneId`, `shortCode`, `exp` (8 hours)
- Guard correctly rejects missing/invalid/expired tokens with 401
- DTO validation: shortCode is required string, matches `^(DT-)?[A-Z0-9]{4}$` pattern
- Controller normalizes input (uppercase, prepend DT- if missing)
- Swagger decorators on controller
- No lint errors

**Depends on:** Phase 2 complete.

---

## Phase 4 — API: Orders

**Goal:** Authenticated staff can list and view orders for their location.

**Deliverables:**
- `apps/api/src/orders/orders.module.ts`
- `apps/api/src/orders/orders.controller.ts` — `GET /api/orders`, `GET /api/orders/:id`
- `apps/api/src/orders/orders.service.ts` — raw SQL queries
- `apps/api/src/orders/dto/list-orders-query.dto.ts` — query params (date, optional)
- `apps/api/src/orders/dto/order-summary.dto.ts` — list item shape
- `apps/api/src/orders/dto/order-detail.dto.ts` — full order shape

**Verify:**
- List query matches Solution Design §5.2 exactly (status/posStatus filter, LEFT JOIN survey_responses, location scoped, ordered DESC by createdAt)
- `locationId` comes from JWT (via guard/decorator), NOT from query params
- Date defaults to "today" (server UTC)
- Detail query returns full `orderData` JSONB
- Both endpoints use `@UseGuards(JwtAuthGuard)`
- Swagger decorators on all endpoints
- No lint errors

**Depends on:** Phase 3 complete.

---

## Phase 5 — API: Survey (Submit + Report + Export)

**Goal:** Authenticated staff can submit surveys, view reports, and export CSV.

**Deliverables:**
- `apps/api/src/survey/survey.module.ts`
- `apps/api/src/survey/survey.controller.ts` — `POST /api/survey`, `GET /api/survey/report`, `GET /api/survey/export`
- `apps/api/src/survey/survey.service.ts` — raw SQL for insert, aggregation, CSV generation
- `apps/api/src/survey/dto/submit-survey.dto.ts` — body validation
- `apps/api/src/survey/dto/survey-report-query.dto.ts` — dateFrom, dateTo
- `apps/api/src/survey/dto/survey-report.dto.ts` — response shape (summary + responses)

**Verify:**
- Submit: INSERT with ON CONFLICT (order_id) → catch unique violation → return 409
- Submit: `locationId` and `brandId` from JWT, `surveyerShortCode` from JWT
- Submit DTO validates: `satisfactionRating` 1-5, `easyToUnderstand` in enum, `wouldUseAgain` in enum
- Report: SQL aggregates (COUNT, AVG, GROUP BY) for summary; raw rows for responses; joins orders for order number/total/time
- Report: `totalOrders` counts all eligible orders for the location/date range (not just surveyed ones)
- Export: CSV with proper escaping (injection prevention for `=`, `+`, `-`, `@`)
- Export: sets `Content-Type: text/csv` and `Content-Disposition: attachment; filename=...`
- All endpoints location-scoped via JWT
- Swagger decorators
- No lint errors

**Depends on:** Phase 4 complete. (Needs auth guard and DB module; Phase 0 migration must be run before testing but not before coding.)

---

## Phase 6 — UI: Scaffold + Providers + Auth Screen

**Goal:** UI app with routing, providers, auth state, and working short code login screen.

**Deliverables:**
- `apps/ui/src/lib/api.ts` — axios instance, baseURL `/api`, auth header interceptor, 401 redirect
- `apps/ui/src/stores/authStore.ts` — Zustand: token, locationId, locationName, shortCode, login/logout
- `apps/ui/src/app/AppProviders.tsx` — QueryClient, ThemeProvider (light only), Toaster, Router
- `apps/ui/src/app/AppRouter.tsx` — routes: `/login`, `/orders`, `/orders/:id/survey`, `/report`
- `apps/ui/src/components/ProtectedRoute.tsx` — redirect to /login if no token
- `apps/ui/src/features/auth/LoginPage.tsx` — short code entry (4-char OTP input, auto-uppercase, auto-advance, DT- prepend, submit, error handling)
- shadcn components installed: button, input, card, badge, separator, toast/sonner, dialog, collapsible
- Tailwind configured with mobile-first defaults

**Verify:**
- axios interceptor attaches `Authorization: Bearer <token>` from authStore
- 401 response clears token and redirects to /login
- LoginPage: validates `^[A-Z0-9]{4}$` before submit
- LoginPage: calls `POST /api/auth/short-code`, stores token + location in Zustand
- LoginPage: shows error state (shake + message) on failure
- ProtectedRoute checks authStore.token, redirects if missing
- Router has all 4 routes defined
- No lint errors

**Depends on:** Phase 1 (UI scaffold). Can reference Phase 3 API types but doesn't need API running to code.

---

## Phase 7 — UI: Order List

**Goal:** Staff sees today's orders for their location with auto-refresh and surveyed indicators.

**Deliverables:**
- `apps/ui/src/features/orders/OrdersPage.tsx` — header (location, date, progress), order card list, bottom nav
- `apps/ui/src/features/orders/OrderCard.tsx` — single order card (order #, time, total, items preview, status chip, surveyed badge)
- `apps/ui/src/features/orders/useOrders.ts` — TanStack Query hook: `GET /api/orders`, `refetchInterval: 30000`
- `apps/ui/src/features/orders/order-utils.ts` — helpers: extract item names from orderData (V1 + legacy), format time, format currency
- `apps/ui/src/components/BottomNav.tsx` — Orders | Report tabs
- Empty state component for "no orders yet"
- Loading skeleton for order list

**Verify:**
- `useOrders` hook sends JWT in header, passes date param
- `refetchInterval: 30000` set on the query
- OrderCard renders all fields per UX Design §4.2
- Item preview extracts names correctly for both V1 (items[].name) and legacy (items[].name) formats
- V1 combos show combo name, not child items, in preview
- Surveyed cards have muted styling and checkmark badge
- Status chips: green (SUBMITTED), red (REJECTED), amber (PENDING_RETRY)
- Newest first order
- Bottom nav has active state for Orders tab
- Empty state shown when array is empty
- Skeleton shown while loading
- No lint errors

**Depends on:** Phase 6 complete.

---

## Phase 8 — UI: Survey Form

**Goal:** Staff can tap an order, see detail, answer 3 questions, and submit.

**Deliverables:**
- `apps/ui/src/features/survey/SurveyPage.tsx` — survey form with order context + 3 questions + submit
- `apps/ui/src/features/survey/OrderContext.tsx` — compact order summary + expandable full detail
- `apps/ui/src/features/survey/OrderDetail.tsx` — full order detail (items with modifiers, combos, totals, payment)
- `apps/ui/src/features/survey/SatisfactionRating.tsx` — 1-5 button row
- `apps/ui/src/features/survey/OptionGroup.tsx` — reusable vertical button group for Q2/Q3
- `apps/ui/src/features/survey/useSubmitSurvey.ts` — TanStack mutation: `POST /api/survey`
- `apps/ui/src/features/orders/useOrderDetail.ts` — TanStack Query: `GET /api/orders/:id`

**Verify:**
- SurveyPage receives orderId from route params, fetches full order detail
- OrderContext shows: order number, time, items preview, total (compact)
- OrderDetail (expanded) renders V1 items (standalone + combos with child_items + modifiers) and legacy items (with modifiers.options)
- SatisfactionRating: 5 buttons, selected state highlighted, tap toggles
- OptionGroup: full-width stacked buttons, selected state, used for Q2 and Q3
- Submit button disabled until all 3 questions answered
- On success: toast "Survey saved", invalidate orders query (to update surveyed flag), navigate to /orders
- On 409: toast "Already surveyed", navigate to /orders
- On error: toast with retry prompt, stay on form, preserve answers
- Back button with confirm dialog if answers started
- No lint errors

**Depends on:** Phase 7 complete.

---

## Phase 9 — UI: Report View

**Goal:** Staff or manager can view survey summary, individual responses, and export CSV.

**Deliverables:**
- `apps/ui/src/features/report/ReportPage.tsx` — date filter + summary cards + response list + export button
- `apps/ui/src/features/report/SummaryCards.tsx` — survey rate card + avg satisfaction card
- `apps/ui/src/features/report/DistributionBar.tsx` — reusable horizontal bar for Q2/Q3 distributions
- `apps/ui/src/features/report/ResponseList.tsx` — scrollable list of individual responses
- `apps/ui/src/features/report/useReport.ts` — TanStack Query: `GET /api/survey/report`
- `apps/ui/src/features/report/useExportCsv.ts` — trigger `GET /api/survey/export` download
- `apps/ui/src/features/report/DateFilter.tsx` — presets (Today, Yesterday, Last 7 days) + custom range

**Verify:**
- DateFilter defaults to "Today", updates query params on change
- SummaryCards: survey rate shows "N of M (X%)", avg satisfaction shows "X.X / 5" with stars
- DistributionBar: proportional bars with percentage labels, color-coded (green/amber/red)
- ResponseList: each row shows order #, time, total, 3 answers with star visualization for Q1
- Export button triggers file download (window.open or anchor click to export URL with auth)
- Bottom nav has active state for Report tab
- Loading and empty states handled
- No lint errors

**Depends on:** Phase 7 complete (shared BottomNav). Can be built in parallel with Phase 8 conceptually, but waterfall means after Phase 8.

---

## Phase 10 — Dockerfiles + CI/CD

**Goal:** Both apps can be containerized and deployed to Azure Container Apps.

**Deliverables:**
- `apps/api/Dockerfile` — multi-stage (Node 20 Alpine: build → production runtime), expose 3010
- `apps/ui/Dockerfile` — multi-stage (Node 20 Alpine: Vite build → nginx serving static + proxy /api)
- `apps/ui/nginx.conf` — serve SPA (fallback to index.html) + proxy /api to API container
- `.github/workflows/deploy-dev.yml` — detect changes, build + push to ACR, update container apps, health check (modeled on drive-thru-analyzer)
- `.github/workflows/ci.yml` — lint + typecheck on PR

**Verify:**
- API Dockerfile: copies only dist + production deps, CMD is `node dist/main`
- UI Dockerfile: builds with Vite, copies to nginx, nginx.conf handles SPA routing
- Deploy workflow: uses `dorny/paths-filter` for selective builds, Azure login, ACR push, container app update
- CI workflow: runs lint and typecheck for both apps
- No hardcoded secrets (all via GitHub secrets/vars)
- No lint errors in workflow YAML

**Depends on:** All prior phases complete.

---

## Execution Summary

| Phase | Scope | Est. Files | Depends On |
|-------|-------|-----------|------------|
| 0 | Migration (in ssk-menu-builder) | 1 | — |
| 1 | Monorepo scaffold | ~15 | — |
| 2 | API: config + DB + health | ~8 | Phase 1 |
| 3 | API: auth (short code → JWT) | ~7 | Phase 2 |
| 4 | API: orders | ~6 | Phase 3 |
| 5 | API: survey + report + CSV | ~7 | Phase 4 |
| 6 | UI: scaffold + auth screen | ~10 | Phase 1 |
| 7 | UI: order list | ~7 | Phase 6 |
| 8 | UI: survey form | ~7 | Phase 7 |
| 9 | UI: report view | ~7 | Phase 8 |
| 10 | Dockerfiles + CI/CD | ~5 | All |

**Total: ~80 files across 11 phases.**
