# Business Requirements Document (BRD)  
## Post-Order AI Drive-Thru Pilot Survey

**Version:** 1.0  
**Date:** 2025-03-18  
**Status:** Draft

---

## 1. Purpose & Objectives

### 1.1 Purpose

Capture structured customer feedback immediately after the AI drive-thru experience so the QSR and pilot owners can assess whether the experience is right or needs changes. Feedback is collected by staff at the drive-thru exit (post handoff) and tied to the specific order and location.

### 1.2 Objectives

- **Measure satisfaction** with the AI ordering experience at the moment of truth (after the customer receives their food).
- **Correlate feedback to orders** so order details can be used to better understand the customer’s point of view (e.g., order complexity, items, issues).
- **Support decisions** for operators, location managers, pilot owners, and the QSR on experience quality and required changes.
- **One response per order** to enable clear metrics (e.g., % of orders surveyed, satisfaction by location/day).

---

## 2. Stakeholders

| Stakeholder | Interest |
|-------------|-----------|
| **QSR / Brand** | Whether the AI drive-thru experience is right; need for changes. |
| **Location managers / Operators** | How their location is performing; daily/real-time feedback. |
| **Pilot owners** | Aggregate pilot health; trends across locations and time. |
| **Product / Experience** | Input for improvements; link to order and (later) conversation context. |

---

## 3. Scope

### 3.1 In Scope

- Survey application used by **staff** on a **mobile device (phone or tablet)** at the drive-thru exit, after the customer has received their food.
- Staff **asks the customer** the survey questions and records answers in the app (staff-operated, not customer self-serve).
- **Three questions** per survey:
  1. **Satisfaction with ordering experience today** — Scale 1 to 5.
  2. **Was the drive-thru order taker easy to understand and communicate with?** — Yes completely / Mostly / Not really.
  3. **Would you be comfortable using this drive-thru experience again?** — Yes / Maybe / No.
- Survey responses are **tied to a specific order and location**; order list is **chronological for that day and location**, with orders appearing automatically after they are submitted to the POS.
- **One survey response per order** (no duplicate surveys for the same order).
- **Simple 5-digit PIN** authentication for app access.
- Use of **same database and configuration (.env)** as the existing ssk-menu-builder system; **new, separate codebase** for the survey app.
- Data available to inform all parties listed above (consumption/reporting may be in other systems or a later phase).

### 3.2 Out of Scope (for this BRD / initial release)

- Linking survey responses to **drive-thru conversation** (e.g., transcript/session); to be added later in the ssk-menu-builder codebase.
- Customer self-serve survey entry (e.g., kiosk or customer-facing tablet).
- Post-visit surveys (SMS, email, in-app) or any channel other than staff at drive-thru exit.
- Detailed technical stack, architecture, or solution design (covered in a separate Solution Design document).
- Advanced analytics, dashboards, or reporting UI within the survey app (beyond what is needed to collect and store responses).

---

## 4. User Roles & Actors

| Actor | Description |
|-------|-------------|
| **Surveyer (staff)** | Employee at the drive-thru exit who asks the customer the three questions and records answers in the survey app on a mobile device. Authenticates with a 5-digit PIN. |
| **Customer** | Drive-thru customer who has just received their order; provides verbal answers to the surveyer. Does not interact with the app. |

---

## 5. Business Requirements

### 5.1 Order Selection & Survey Trigger

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-1 | The app SHALL display a list of orders for the **current day** and the **selected location**, in **chronological order** (e.g., newest or oldest first—to be confirmed in design). | Must |
| BR-2 | Orders SHALL appear in the list **automatically** after they are **submitted to the POS** (no manual import for normal flow). | Must |
| BR-3 | Staff SHALL be able to **select an order** from the list to **start a survey** for that order. | Must |
| BR-4 | The app SHALL prevent starting or submitting a second survey for an order that **already has a response** (one response per order). | Must |

### 5.2 Survey Content & Capture

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-5 | Each survey SHALL capture exactly **three questions**: (1) Satisfaction 1–5, (2) Easy to understand — Yes completely / Mostly / Not really, (3) Comfortable using again — Yes / Maybe / No. | Must |
| BR-6 | The app SHALL allow the surveyer to **submit** the three answers as a single response tied to the selected order and location. | Must |
| BR-7 | Each response SHALL be **stored** and **associated with** the chosen order and location so that order details can be used to understand the customer’s POV. | Must |

### 5.3 Location & Configuration

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-8 | The app SHALL operate in the context of a **location** (e.g., selected at login or device/location binding) so that the order list and all responses are scoped to that location. | Must |
| BR-9 | The app SHALL use the **same database and .env-based configuration** as ssk-menu-builder (same logical “system” for orders/locations; separate codebase). | Must |

### 5.4 Authentication & Access

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-10 | Access to the survey app SHALL be protected by **authentication** using a **simple 5-digit PIN** for now. | Must |
| BR-11 | PIN SHALL be sufficient for staff to open the app and perform survey actions (no separate customer-facing login). | Must |

### 5.5 Data Use & Correlation

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-12 | Stored responses SHALL be **available** to support reporting and analysis for operators, location managers, pilot owners, and the QSR (consumption may be via exports, APIs, or other tools; mechanism TBD in solution design). | Must |
| BR-13 | Correlation of survey responses to **drive-thru conversation** (e.g., session/transcript) is **out of scope** for this app; it will be added later in the ssk-menu-builder codebase. | Must |

---

## 6. Success Criteria

- Staff can reliably **select an order** from the day’s order list for a location and **record one survey response** per order.
- **One response per order** is enforced; no duplicate surveys for the same order.
- Responses are **tied to order and location** so that order details can be used to understand the customer’s POV.
- All three questions are captured and stored for every submitted survey.
- App is usable on **mobile devices (phone/tablet)** at the drive-thru exit with **5-digit PIN** access only.
- Data is stored in the **same configuration/database** as ssk-menu-builder and is available to inform whether the experience is right or needs changes (per stakeholder needs).

---

## 7. Assumptions

- Orders submitted to the POS are available (via the same DB or integration used by ssk-menu-builder) so the survey app can show the chronological order list for the day and location.
- Location is known in the app (e.g., selected at login, device assignment, or config) so that orders and responses are always location-scoped.
- Staff will use the app in good faith (one survey per order, accurate entry); no separate fraud/prevention requirements for v1.
- PIN management (creation, rotation, revocation) can be simple for pilot (e.g., config or minimal admin); detailed auth policy is out of scope for BRD.

---

## 8. Constraints

- **One response per order** — no multiple submissions per order.
- **Same DB and .env** as ssk-menu-builder; no separate survey-only database for this pilot.
- **New codebase** — survey functionality is a separate application, not inside ssk-menu-builder.
- **Auth:** 5-digit PIN only for this phase; no broader SSO or role model in scope.
- **Conversation linkage:** Not in this app; to be added later in ssk-menu-builder.

---

## 9. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-03-18 | — | Initial BRD (post-order pilot survey, staff-conducted, 3 questions, one per order, same DB/config, PIN auth). |

---

*Technical stack, architecture, and solution design will be documented separately.*
