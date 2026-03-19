/**
 * Calculate UTC-based start/end timestamps for "today" in a given IANA timezone.
 *
 * Example: locationTimezone = "America/New_York", UTC-4
 *   Local midnight start = 2026-03-18 00:00:00 ET  => 2026-03-18T04:00:00.000Z
 *   Local midnight end   = 2026-03-18 23:59:59 ET  => 2026-03-19T03:59:59.999Z
 *
 * This ensures orders created between 00:00 and 23:59 in the location's timezone
 * are always visible, even if the server is running in a different timezone.
 */
export function getTodayBoundsInUtc(timezone: string): { startUtc: string; endUtc: string } {
  try {
    // Determine the current date string in the location's timezone
    const now = new Date();
    const localDateStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // "YYYY-MM-DD"

    return getDayBoundsInUtc(localDateStr, timezone);
  } catch {
    // Fallback to server UTC day if timezone is invalid
    const today = new Date().toISOString().slice(0, 10);
    return {
      startUtc: `${today}T00:00:00.000Z`,
      endUtc: `${today}T23:59:59.999Z`,
    };
  }
}

/**
 * For a given YYYY-MM-DD date string interpreted in the location's timezone,
 * return the UTC start and end of that local day.
 */
export function getDayBoundsInUtc(dateStr: string, timezone: string): { startUtc: string; endUtc: string } {
  try {
    const startUtcMs = localToUtcMs(dateStr, '00:00:00', timezone);
    const endUtcMs = localToUtcMs(dateStr, '23:59:59.999', timezone);

    return {
      startUtc: new Date(startUtcMs).toISOString(),
      endUtc: new Date(endUtcMs).toISOString(),
    };
  } catch {
    return {
      startUtc: `${dateStr}T00:00:00.000Z`,
      endUtc: `${dateStr}T23:59:59.999Z`,
    };
  }
}

/**
 * Get the current local date string (YYYY-MM-DD) for a given IANA timezone.
 */
export function getLocalDateString(timezone: string): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Convert a local date+time string to UTC milliseconds for a given timezone.
 * Uses the Intl API to determine the timezone offset at that specific moment.
 * Handles milliseconds by stripping them for the offset calculation then re-adding.
 */
function localToUtcMs(dateStr: string, timeStr: string, timezone: string): number {
  // Split off milliseconds so Intl formatter (which lacks ms precision) doesn't skew the offset
  const [timePart, msPart] = timeStr.split('.');
  const ms = msPart ? parseInt(msPart.padEnd(3, '0').slice(0, 3)) : 0;

  // Work with second-precision only for offset calculation
  const isoNoMs = `${dateStr}T${timePart}`;
  const naiveUtcNoMs = new Date(isoNoMs + 'Z');

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const localParts = formatter.formatToParts(naiveUtcNoMs);
  const localYear = parseInt(getPart(localParts, 'year'));
  const localMonth = parseInt(getPart(localParts, 'month')) - 1;
  const localDay = parseInt(getPart(localParts, 'day'));
  const localHour = parseInt(getPart(localParts, 'hour'));
  const localMinute = parseInt(getPart(localParts, 'minute'));
  const localSecond = parseInt(getPart(localParts, 'second'));

  // offset = how many ms to add to a "naive UTC" time to get the real UTC equivalent
  const localAsUtc = Date.UTC(localYear, localMonth, localDay, localHour, localMinute, localSecond);
  const offset = naiveUtcNoMs.getTime() - localAsUtc;

  return naiveUtcNoMs.getTime() + ms + offset;
}

function getPart(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find(p => p.type === type)?.value ?? '0';
}
