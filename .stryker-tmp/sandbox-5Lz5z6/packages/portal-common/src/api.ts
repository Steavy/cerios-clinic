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
import axios, { type AxiosInstance } from "axios";
import Keycloak from "keycloak-js";
export interface CreateApiOptions {
	baseUrl: string;
	keycloak: Keycloak;
	/** Seconds remaining on the access token that trigger a refresh (default 30). */
	minValiditySeconds?: number;
}

/**
 * Builds a shared axios client that:
 * 1. Prefixes requests with `baseUrl`.
 * 2. Before each request, if a token exists, proactively refreshes it when
 *    within `minValiditySeconds` of expiry (falling back to `login()` on failure).
 * 3. Attaches the current bearer token to `Authorization`.
 *
 * Matches the behavior of the previous per-portal api.ts files (patient-portal's
 * unconditional updateToken and doctor/assistant's isTokenExpired gate collapse
 * to the same outcome because updateToken is a no-op when the token is fresh).
 */
export function createApi(options: CreateApiOptions): AxiosInstance {
	if (stryMutAct_9fa48("0")) {
		{
		}
	} else {
		stryCov_9fa48("0");
		const minValidity = stryMutAct_9fa48("1")
			? options.minValiditySeconds && 30
			: (stryCov_9fa48("1"), options.minValiditySeconds ?? 30);
		const instance = axios.create(
			stryMutAct_9fa48("2")
				? {}
				: (stryCov_9fa48("2"),
					{
						baseURL: options.baseUrl,
					})
		);
		instance.interceptors.request.use(async config => {
			if (stryMutAct_9fa48("3")) {
				{
				}
			} else {
				stryCov_9fa48("3");
				const kc = options.keycloak;
				if (stryMutAct_9fa48("5") ? false : stryMutAct_9fa48("4") ? true : (stryCov_9fa48("4", "5"), kc.token)) {
					if (stryMutAct_9fa48("6")) {
						{
						}
					} else {
						stryCov_9fa48("6");
						if (
							stryMutAct_9fa48("8")
								? false
								: stryMutAct_9fa48("7")
									? true
									: (stryCov_9fa48("7", "8"), kc.isTokenExpired(minValidity))
						) {
							if (stryMutAct_9fa48("9")) {
								{
								}
							} else {
								stryCov_9fa48("9");
								await kc
									.updateToken(minValidity)
									.catch(stryMutAct_9fa48("10") ? () => undefined : (stryCov_9fa48("10"), () => kc.login()));
							}
						}
						config.headers.Authorization = stryMutAct_9fa48("11") ? `` : (stryCov_9fa48("11"), `Bearer ${kc.token}`);
					}
				}
				return config;
			}
		});
		return instance;
	}
}
