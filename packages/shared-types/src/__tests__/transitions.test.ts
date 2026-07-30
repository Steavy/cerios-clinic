import { describe, expect, it } from "vitest";

import { ALLOWED_TRANSITIONS, type AppointmentStatus } from "../index";

describe("ALLOWED_TRANSITIONS", () => {
	it("covers all AppointmentStatus values exactly", () => {
		const expected: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"];
		expect(Object.keys(ALLOWED_TRANSITIONS).sort()).toEqual(expected.sort());
	});

	it("terminal states (COMPLETED, CANCELLED) have empty allowed transitions", () => {
		expect(ALLOWED_TRANSITIONS.COMPLETED).toEqual([]);
		expect(ALLOWED_TRANSITIONS.CANCELLED).toEqual([]);
	});

	it("SCHEDULED allows CONFIRMED and CANCELLED", () => {
		expect(ALLOWED_TRANSITIONS.SCHEDULED).toEqual(["CONFIRMED", "CANCELLED"]);
	});

	it("CONFIRMED allows COMPLETED and CANCELLED", () => {
		expect(ALLOWED_TRANSITIONS.CONFIRMED).toEqual(["COMPLETED", "CANCELLED"]);
	});

	it("no duplicate transitions exist", () => {
		for (const [, targets] of Object.entries(ALLOWED_TRANSITIONS)) {
			const unique = new Set(targets);
			expect(unique.size).toBe(targets.length);
		}
	});

	it("all target statuses are valid AppointmentStatus values", () => {
		const valid: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"];
		for (const targets of Object.values(ALLOWED_TRANSITIONS)) {
			for (const target of targets) {
				expect(valid).toContain(target);
			}
		}
	});
});
