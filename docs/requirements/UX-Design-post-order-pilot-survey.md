# UX Design — Post-Order AI Drive-Thru Pilot Survey

**Version:** 1.0  
**Date:** 2025-03-18  
**Status:** Draft  
**References:** [Solution Design](./Solution-Design-post-order-pilot-survey.md) · [BRD](./BRD-post-order-pilot-survey.md)

---

## 1. Design Principles

| Principle | Why |
|-----------|-----|
| **Speed over polish** | Staff is standing at a drive-thru exit, cars are moving. Every tap counts. |
| **One-hand operation** | Phone held in one hand; all interactive elements reachable by thumb. |
| **Glanceable order matching** | Staff must instantly match the on-screen order to the car in front of them. |
| **Zero training** | New staff should be able to use the app within 30 seconds of seeing it. |
| **Forgiveness** | Mistakes (wrong order, accidental tap) are easy to undo or back out of. |

---

## 2. User Journeys

### Journey 1 — Start of Shift (Login)

```
Staff arrives at drive-thru exit position
    → Opens bookmarked URL on phone/tablet
    → Sees short code entry screen
    → Enters the lane short code (printed on equipment or known by staff)
    → App resolves code → shows location name confirmation
    → Staff is on the order list, ready to survey
```

**Time to ready:** < 15 seconds.

### Journey 2 — Conduct a Survey (Happy Path)

```
Car pulls away from pickup window with food
    → Staff glances at phone: newest order is at top of list
    → Matches order by time + total + item preview to the car
    → Taps the order card
    → Sees order detail at top (items, total) + 3 survey questions below
    → Asks customer Q1, taps rating (1-5)
    → Asks Q2, taps answer
    → Asks Q3, taps answer
    → Taps "Submit"
    → Toast: "Saved ✓" — auto-returns to order list
    → Order now shows "Surveyed" badge
    → Ready for next car
```

**Time per survey:** Target < 30 seconds.

### Journey 3 — Survey a Specific Order (Not the Latest)

```
Staff needs to survey a car from 10 minutes ago
    (e.g., customer came back, or staff is catching up)
    → Scrolls down the order list
    → Identifies order by time + total + items
    → Taps → survey form → submits
```

### Journey 4 — View Report (End of Shift / Manager Check)

```
Staff or manager wants to see how the day is going
    → Taps "Report" in bottom navigation
    → Sees summary cards: survey rate, avg satisfaction, Q2/Q3 distributions
    → Scrolls down to see individual responses
    → Optionally taps "Export CSV" → downloads file
    → Taps "Orders" to go back to surveying
```

### Journey 5 — Session Expired / New Day

```
Staff opens app the next day (JWT expired after 8 hours)
    → App detects invalid/expired token
    → Redirects to short code entry
    → Staff re-enters code → fresh session for the new day
```

---

## 3. Edge Cases & Error States

| Scenario | Behavior |
|----------|----------|
| **Invalid short code** | Shake animation on input. Message: "Invalid code — check and try again." Input stays focused for retry. |
| **Short code is inactive** | Same as invalid. Message: "This lane code is no longer active." |
| **No orders yet today** | Empty state illustration. Message: "No orders yet today. Orders will appear here automatically after they're submitted." Auto-poll every 30s. |
| **Order already surveyed** | Card shows "Surveyed ✓" badge. Tapping opens order detail in read-only mode (no survey form). |
| **Attempt to re-submit survey** | API returns 409. Toast: "This order has already been surveyed." Navigate back to list. |
| **Network error on survey submit** | Toast: "Couldn't save — check your connection and try again." Stay on survey form, preserve answers. Retry button visible. |
| **Network error loading orders** | Inline error with retry button: "Couldn't load orders. Tap to retry." |
| **JWT expired mid-session** | API returns 401. Redirect to short code entry with message: "Session expired — please re-enter your code." |
| **Staff taps back during survey** | Answers are NOT preserved (no draft state for pilot). Confirm dialog: "Leave without saving? Your answers will be lost." |
| **Order has posStatus = REJECTED** | Show in list with red "Rejected" chip. Still surveyable (customer may have had the AI experience even if POS rejected). |
| **Very long item list** | Item preview in order list: show first 3 items + "+ N more". Full list in order detail view. |

---

## 4. Screen Specifications

### 4.1 Screen 1 — Short Code Entry (Login)

```
┌─────────────────────────────┐
│                             │
│         [App Logo]          │
│                             │
│    Drive-Thru Survey        │
│                             │
│  ┌───┬───┬───┬───┐         │
│  │ _ │ _ │ _ │ _ │         │
│  └───┴───┴───┴───┘         │
│  Enter your lane code       │
│                             │
│  ┌─────────────────────┐   │
│  │      Continue →      │   │
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Details:**

- 4 individual character boxes (like an OTP input), auto-uppercase.
- Each box auto-advances focus on entry.
- Accept A-Z, 0-9. Keyboard type: `text` with `inputMode="text"` and `autocapitalize="characters"`.
- "Continue" button is disabled until all 4 chars entered.
- On submit: show brief loading spinner in button, then navigate or show error.
- No "DT-" prefix shown in UI; app prepends it internally before API call.
- Below input: small muted text "Enter the 4-character code from your lane."

### 4.2 Screen 2 — Order List

```
┌─────────────────────────────┐
│ 📍 Downtown Main St         │
│ Tuesday, Mar 18 · 12 of 34  │
│ ─────────────────────────── │
│                              │
│ ┌──────────────────────────┐│
│ │ A147 · 2:34 PM    $12.47 ││
│ │ Big Mac, Lg Fries, Coke  ││
│ │ ● Submitted               ││
│ └──────────────────────────┘│
│                              │
│ ┌──────────────────────────┐│
│ │ A146 · 2:31 PM    $8.99  ││
│ │ McChicken, Sm Fries      ││
│ │ ● Submitted   ✓ Surveyed ││
│ └──────────────────────────┘│
│                              │
│ ┌──────────────────────────┐│
│ │ A145 · 2:28 PM    $22.13 ││
│ │ 2x Big Mac Meal, ...     ││
│ │ ● Rejected                ││
│ └──────────────────────────┘│
│                              │
│ ─────────────────────────── │
│  [  Orders  ]  [  Report  ] │
└─────────────────────────────┘
```

**Details:**

**Header (sticky):**
- Location name (from `aot_lanes.name` or joined from `locations.name`).
- Today's date (formatted, e.g. "Tuesday, Mar 18").
- Survey progress: "12 of 34 surveyed" (surveyed count / total order count).

**Order cards:**
- Each card is a `<button>` or tappable area (full card is the tap target).
- **Row 1:** Order number (bold) + time (muted) + total (right-aligned, bold).
- **Row 2:** Item preview — first 3 item names comma-separated. If more: "+ N more".
  - V1 items: `orderData.items[].name`.
  - Legacy items: `orderData.items[].name`.
  - Combos (V1): show combo name, not child items in preview.
- **Row 3:** POS status chip (left) + surveyed badge (right, if applicable).
  - **Submitted:** green-ish chip.
  - **Rejected:** red chip.
  - **Pending Retry:** amber chip.
  - **Surveyed ✓:** muted badge with checkmark. Card has reduced opacity or muted background.

**Unsurveyed cards:** Normal styling, tappable → navigates to survey form.  
**Surveyed cards:** Muted styling, tappable → navigates to read-only order detail (no survey form).

**Auto-refresh:** Poll `GET /orders` every 30 seconds. New orders appear at top with subtle entrance animation.

**Pull-to-refresh:** Supported on mobile (touch drag down to refresh).

**Bottom navigation:** Two tabs — "Orders" (active) and "Report". Sticky at bottom.

### 4.3 Screen 3 — Survey Form

```
┌─────────────────────────────┐
│ ← Back          A147        │
│ ─────────────────────────── │
│                              │
│ 2:34 PM · $12.47            │
│ Big Mac, Lg Fries, Coke     │
│        [View full order ▾]  │
│ ─────────────────────────── │
│                              │
│ How satisfied were you       │
│ with your ordering           │
│ experience today?            │
│                              │
│  [1]  [2]  [3]  [4]  [5]   │
│                              │
│ ─────────────────────────── │
│                              │
│ Was the order taker easy     │
│ to understand?               │
│                              │
│ ┌─────────────────────────┐ │
│ │    Yes, completely      │ │
│ ├─────────────────────────┤ │
│ │    Mostly               │ │
│ ├─────────────────────────┤ │
│ │    Not really           │ │
│ └─────────────────────────┘ │
│                              │
│ ─────────────────────────── │
│                              │
│ Would you be comfortable     │
│ using this experience again? │
│                              │
│ ┌─────────────────────────┐ │
│ │    Yes                  │ │
│ ├─────────────────────────┤ │
│ │    Maybe                │ │
│ ├─────────────────────────┤ │
│ │    No                   │ │
│ └─────────────────────────┘ │
│                              │
│ ┌─────────────────────────┐ │
│ │       Submit Survey     │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Details:**

**Header:** Back arrow (← navigates to order list with confirm if answers started) + order number.

**Order context (compact, top of form):**
- Time + total on one line.
- Item names (same preview as list card).
- "View full order" expandable: collapses/expands the full order detail (items with modifiers, child items for combos, totals breakdown, payment info). Uses an accordion/collapsible — default collapsed so the survey questions are immediately visible.

**Q1 — Satisfaction (1–5):**
- 5 large square/circle buttons in a row.
- Numbers 1–5 inside. Labels beneath: 1 = "Poor", 5 = "Excellent" (only endpoints labeled).
- Selected state: filled/highlighted with accent color.
- Tap to select; tap again to deselect (allows changing before submit).

**Q2 — Easy to understand:**
- 3 vertically stacked buttons (full width, tall — min 48px height each).
- "Yes, completely" / "Mostly" / "Not really".
- Selected state: filled accent color, others remain outlined.

**Q3 — Would use again:**
- Same layout as Q2: 3 vertically stacked buttons.
- "Yes" / "Maybe" / "No".

**Submit button:**
- Fixed at bottom or flows after Q3.
- **Disabled** (grayed out) until all 3 questions are answered.
- On tap: loading spinner in button → API call → success toast → navigate to order list.
- On 409 (duplicate): error toast → navigate to order list.
- On network error: error toast with "try again" prompt; stay on form, preserve answers.

**Full order detail (expanded):**
- Same rendering as ssk-menu-builder `OrderDetailDrawer`:
  - Items with quantities, modifiers, special instructions.
  - Combos: combo name → indented child items with modifiers.
  - Subtotal, tax, tip (if any), total.
  - Payment: card brand + last 4 (if present).

### 4.4 Screen 4 — Report View

```
┌─────────────────────────────┐
│ 📍 Downtown Main St         │
│ Report                       │
│ ─────────────────────────── │
│ [  Today  ▾ ]  [Export CSV] │
│ ─────────────────────────── │
│                              │
│ ┌───────────┬──────────────┐│
│ │  Surveys  │ Avg Rating   ││
│ │  32 / 47  │  ★ 4.2 / 5  ││
│ │   68%     │              ││
│ └───────────┴──────────────┘│
│                              │
│ Easy to understand?          │
│ ██████████████████░░░  63%  │
│ █████████░░░░░░░░░░░  28%  │
│ ███░░░░░░░░░░░░░░░░░   9%  │
│ Yes completely / Mostly / …  │
│                              │
│ Would use again?             │
│ ████████████████████░  69%  │
│ ██████░░░░░░░░░░░░░░  22%  │
│ ███░░░░░░░░░░░░░░░░░   9%  │
│ Yes / Maybe / No             │
│                              │
│ ─────────────────────────── │
│ Individual Responses         │
│                              │
│ A147 · 2:34 PM · $12.47    │
│ ★★★★★  Yes completely  Yes  │
│                              │
│ A146 · 2:31 PM · $8.99     │
│ ★★★★☆  Mostly  Maybe        │
│                              │
│ A145 · 2:28 PM · $22.13    │
│ ★★☆☆☆  Not really  No       │
│                              │
│ ... (scrollable)             │
│                              │
│ ─────────────────────────── │
│  [  Orders  ]  [  Report  ] │
└─────────────────────────────┘
```

**Details:**

**Date filter:**
- Dropdown or date picker. Presets: "Today" (default), "Yesterday", "Last 7 days", or custom range.
- Changing the date re-fetches report data.

**Export CSV button:**
- In header row next to date filter.
- Triggers `GET /survey/export?dateFrom=...&dateTo=...` → browser downloads CSV.

**Summary cards (top):**
- **Survey rate:** "32 / 47" large number + "68%" below. Denominator = total orders for the location/date range that match the survey-eligible status filter.
- **Avg satisfaction:** "4.2 / 5" with filled star visualization.

**Distribution bars:**
- Q2 (easy to understand): 3 horizontal bars, each labeled with option and percentage.
  - Color coding: "Yes completely" = green, "Mostly" = amber, "Not really" = red.
- Q3 (would use again): same layout.
  - "Yes" = green, "Maybe" = amber, "No" = red.
- Bars are proportional to count. Percentages shown right-aligned.

**Individual responses (scrollable list below summary):**
- Each row: order number + time + total, then the 3 answers on the next line.
- Satisfaction shown as filled stars (e.g. ★★★★☆).
- Q2 and Q3 shown as text, color-coded same as distribution bars.
- Newest first (matches order list direction).
- Tapping a row does nothing (read-only for pilot; no drill-through to order detail from report).

---

## 5. Navigation

```
Bottom tab bar (sticky, always visible):

┌──────────────┬──────────────┐
│   Orders     │   Report     │
└──────────────┴──────────────┘
```

- Two tabs only. Active tab has accent color + bold label.
- Tab state persists (switching to Report and back to Orders doesn't lose scroll position).

**Back navigation:**
- Survey form has a back arrow → order list.
- Browser back works naturally (React Router).
- No deep nesting — max 2 levels (list → detail/form).

---

## 6. Visual Design Notes

| Element | Spec |
|---------|------|
| **Font** | System font stack (fast load, native feel) |
| **Colors** | Light theme only (outdoor/bright environment). High contrast. Accent color for selected states and CTAs. |
| **Cards** | Rounded corners, subtle shadow. White on light gray background. |
| **Status chips** | Small rounded pills: green (Submitted), red (Rejected), amber (Pending Retry). |
| **Surveyed badge** | Muted green checkmark + "Surveyed" text. Card background slightly grayed. |
| **Touch targets** | All interactive elements min 44×44px. Q2/Q3 option buttons full-width, 52px height. |
| **Animations** | Minimal: card entrance (fade up), selection state (color transition), toast (slide up). No decorative animation. |
| **Loading** | Skeleton screens for order list. Inline spinner for submit button. No full-page loaders. |

---

## 7. Accessibility (Pilot Baseline)

- All interactive elements are focusable and have visible focus rings.
- Color is not the only indicator (chips have text labels, not just color).
- Form questions have proper `<label>` associations.
- Selected states have both color and visual weight change (not color alone).
- Toast notifications use `role="status"` for screen readers.

---

## 8. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-03-18 | Initial UX design: 5 user journeys, 4 screen specs with wireframes, edge cases, navigation, visual design notes. |
