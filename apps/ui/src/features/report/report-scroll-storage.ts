/** Saved Y position when opening a response from the report list */
export const REPORT_SCROLL_Y_KEY = 'report-scroll-y';

/**
 * When set, returning to /report should restore REPORT_SCROLL_Y_KEY.
 * Cleared on bottom-tab navigation so tab switches always start at the top.
 */
export const REPORT_RESTORE_PENDING_KEY = 'report-restore-pending';
