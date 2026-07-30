/**
 * Formats a `YYYY-MM-DD` (or ISO date-time) string for display, anchored to
 * UTC so the rendered day never shifts by browser timezone. Returns an empty
 * string for nullish or unparseable input — call sites should provide their
 * own placeholder (e.g. `"—"`) if needed.
 */
// @ts-nocheck
function stryNS_9fa48() {
	var g =
		(typeof globalThis === "object" && globalThis && globalThis.Math === Math && globalThis) ||
		new Function("return this")();
	var ns = g.__stryker__ || (g.__stryker__ = {});
	if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
		ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
	}
	function retrieveNS() {
		return ns;
	}
	stryNS_9fa48 = retrieveNS;
	return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
	var ns = stryNS_9fa48();
	var cov =
		ns.mutantCoverage ||
		(ns.mutantCoverage = {
			static: {},
			perTest: {},
		});
	function cover() {
		var c = cov.static;
		if (ns.currentTestId) {
			c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
		}
		var a = arguments;
		for (var i = 0; i < a.length; i++) {
			c[a[i]] = (c[a[i]] || 0) + 1;
		}
	}
	stryCov_9fa48 = cover;
	cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
	var ns = stryNS_9fa48();
	function isActive(id) {
		if (ns.activeMutant === id) {
			if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
				throw new Error("Stryker: Hit count limit reached (" + ns.hitCount + ")");
			}
			return true;
		}
		return false;
	}
	stryMutAct_9fa48 = isActive;
	return isActive(id);
}
export function formatDateOnly(value: string | null | undefined, locale?: string | string[]): string {
	if (stryMutAct_9fa48("40")) {
		{
		}
	} else {
		stryCov_9fa48("40");
		// Stryker disable next-line ConditionalExpression: equivalent — falsy values are caught by !match guard
		if (stryMutAct_9fa48("41") ? value : (stryCov_9fa48("41"), !value))
			return stryMutAct_9fa48("44") ? "Stryker was here!" : (stryCov_9fa48("44"), "");
		const match = (
			stryMutAct_9fa48("52")
				? /^(\d{4})-(\d{2})-(\d{2})(?:T)/
				: stryMutAct_9fa48("51")
					? /^(\d{4})-(\d{2})-(\D{2})(?:$|T)/
					: stryMutAct_9fa48("50")
						? /^(\d{4})-(\d{2})-(\d)(?:$|T)/
						: stryMutAct_9fa48("49")
							? /^(\d{4})-(\D{2})-(\d{2})(?:$|T)/
							: stryMutAct_9fa48("48")
								? /^(\d{4})-(\d)-(\d{2})(?:$|T)/
								: stryMutAct_9fa48("47")
									? /^(\D{4})-(\d{2})-(\d{2})(?:$|T)/
									: stryMutAct_9fa48("46")
										? /^(\d)-(\d{2})-(\d{2})(?:$|T)/
										: stryMutAct_9fa48("45")
											? /(\d{4})-(\d{2})-(\d{2})(?:$|T)/
											: (stryCov_9fa48("45", "46", "47", "48", "49", "50", "51", "52"),
												/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/)
		).exec(value);
		if (
			stryMutAct_9fa48("55")
				? false
				: stryMutAct_9fa48("54")
					? true
					: stryMutAct_9fa48("53")
						? match
						: (stryCov_9fa48("53", "54", "55"), !match)
		)
			return stryMutAct_9fa48("56") ? "Stryker was here!" : (stryCov_9fa48("56"), "");
		// Stryker disable next-line ObjectLiteral: equivalent — jsdom default TZ is UTC
		return new Date(
			stryMutAct_9fa48("57") ? `` : (stryCov_9fa48("57"), `${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`)
		).toLocaleDateString(locale, {
			timeZone: stryMutAct_9fa48("59") ? "" : (stryCov_9fa48("59"), "UTC"),
		});
	}
}
