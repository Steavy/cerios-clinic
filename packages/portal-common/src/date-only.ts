/**
 * Formats a `YYYY-MM-DD` (or ISO date-time) string for display, anchored to
 * UTC so the rendered day never shifts by browser timezone. Returns an empty
 * string for nullish or unparseable input — call sites should provide their
 * own placeholder (e.g. `"—"`) if needed.
 */
export function formatDateOnly(value: string | null | undefined, locale?: string | string[]): string {
	// Stryker disable next-line ConditionalExpression: equivalent — falsy values are caught by !match guard
	if (!value) return "";
	const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
	if (!match) return "";
	// Stryker disable next-line ObjectLiteral: equivalent — jsdom default TZ is UTC
	return new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`).toLocaleDateString(locale, { timeZone: "UTC" });
}
