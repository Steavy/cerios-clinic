// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest";

import { formatDateOnly } from "../date-only";

describe("formatDateOnly", () => {
	it("formats a YYYY-MM-DD string", () => {
		const result = formatDateOnly("2025-12-25");
		expect(result).toBe("12/25/2025");
	});

	it("formats an ISO datetime string by extracting the date portion", () => {
		const result = formatDateOnly("2025-12-25T10:30:00.000Z");
		expect(result).toBe("12/25/2025");
	});

	it("returns empty string for null input", () => {
		expect(formatDateOnly(null)).toBe("");
	});

	it("returns empty string for undefined input", () => {
		expect(formatDateOnly(undefined)).toBe("");
	});

	it("returns empty string for empty string input", () => {
		expect(formatDateOnly("")).toBe("");
	});

	it("returns empty string for unparseable input", () => {
		expect(formatDateOnly("not-a-date")).toBe("");
	});

	it("returns empty string when text precedes the date (anchored regex)", () => {
		expect(formatDateOnly("abc2025-12-25")).toBe("");
	});

	it("returns empty string when text follows the date", () => {
		expect(formatDateOnly("2025-12-25abc")).toBe("");
	});

	it("returns Invalid Date string for partially valid input (month 13)", () => {
		expect(formatDateOnly("2025-13-01")).toBe("Invalid Date");
	});

	it("respects the locale option", () => {
		const result = formatDateOnly("2025-12-25", "de-DE");
		expect(result).toBe("25.12.2025");
	});

	it("handles single-digit month and day", () => {
		const result = formatDateOnly("2025-03-04");
		expect(result).toBe("3/4/2025");
	});

	it("uses UTC anchoring so timezone never shifts the day", () => {
		const result = formatDateOnly("2025-01-01");
		expect(result).toBe("1/1/2025");
	});

	it("applies timeZone UTC regardless of process TZ", () => {
		const originalTZ = process.env.TZ;
		process.env.TZ = "America/New_York";
		try {
			const result = formatDateOnly("2025-01-01");
			expect(result).toBe("1/1/2025");
		} finally {
			process.env.TZ = originalTZ;
		}
	});
});
