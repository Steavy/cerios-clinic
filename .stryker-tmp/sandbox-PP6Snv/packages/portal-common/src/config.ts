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
export function envOrDefault(env: ImportMetaEnv | Record<string, unknown>, name: string, fallback: string): string {
	if (stryMutAct_9fa48("12")) {
		{
		}
	} else {
		stryCov_9fa48("12");
		const value = (env as Record<string, unknown>)[name];
		if (
			stryMutAct_9fa48("15")
				? typeof value === "string" || value.trim().length > 0
				: stryMutAct_9fa48("14")
					? false
					: stryMutAct_9fa48("13")
						? true
						: (stryCov_9fa48("13", "14", "15"),
							(stryMutAct_9fa48("17")
								? typeof value !== "string"
								: stryMutAct_9fa48("16")
									? true
									: (stryCov_9fa48("16", "17"),
										typeof value === (stryMutAct_9fa48("18") ? "" : (stryCov_9fa48("18"), "string")))) &&
								(stryMutAct_9fa48("21")
									? value.trim().length <= 0
									: stryMutAct_9fa48("20")
										? value.trim().length >= 0
										: stryMutAct_9fa48("19")
											? true
											: (stryCov_9fa48("19", "20", "21"),
												(stryMutAct_9fa48("22") ? value.length : (stryCov_9fa48("22"), value.trim().length)) > 0)))
		) {
			if (stryMutAct_9fa48("23")) {
				{
				}
			} else {
				stryCov_9fa48("23");
				return stryMutAct_9fa48("24") ? value : (stryCov_9fa48("24"), value.trim());
			}
		}
		return fallback;
	}
}
export function trimTrailingSlash(value: string): string {
	if (stryMutAct_9fa48("25")) {
		{
		}
	} else {
		stryCov_9fa48("25");
		return (
			stryMutAct_9fa48("26")
				? value.startsWith("/")
				: (stryCov_9fa48("26"), value.endsWith(stryMutAct_9fa48("27") ? "" : (stryCov_9fa48("27"), "/")))
		)
			? stryMutAct_9fa48("28")
				? value
				: (stryCov_9fa48("28"), value.slice(0, stryMutAct_9fa48("29") ? +1 : (stryCov_9fa48("29"), -1)))
			: value;
	}
}
export interface PortalAppConfig {
	apiBaseUrl: string;
	keycloakUrl: string;
	keycloakRealm: string;
	keycloakClientId: string;
}
export interface CreateAppConfigOptions {
	/** Vite `import.meta.env` — pass directly from the caller to preserve static replacement. */
	env: ImportMetaEnv | Record<string, unknown>;
	apiBaseUrlEnvVar: string;
	apiBaseUrlDefault: string;
	keycloakClientIdEnvVar: string;
	keycloakClientIdDefault: string;
	/** Optional override for the `VITE_KEYCLOAK_URL` env var name (defaults to VITE_KEYCLOAK_URL). */
	keycloakUrlEnvVar?: string;
	keycloakUrlDefault?: string;
	keycloakRealmEnvVar?: string;
	keycloakRealmDefault?: string;
}

/**
 * Builds the standard per-portal runtime config from Vite env vars with sensible defaults.
 * All four portals share the same shape; only the env var names and defaults differ.
 */
export function createAppConfig(options: CreateAppConfigOptions): PortalAppConfig {
	if (stryMutAct_9fa48("30")) {
		{
		}
	} else {
		stryCov_9fa48("30");
		return stryMutAct_9fa48("31")
			? {}
			: (stryCov_9fa48("31"),
				{
					apiBaseUrl: trimTrailingSlash(envOrDefault(options.env, options.apiBaseUrlEnvVar, options.apiBaseUrlDefault)),
					keycloakUrl: trimTrailingSlash(
						envOrDefault(
							options.env,
							stryMutAct_9fa48("32")
								? options.keycloakUrlEnvVar && "VITE_KEYCLOAK_URL"
								: (stryCov_9fa48("32"),
									options.keycloakUrlEnvVar ??
										(stryMutAct_9fa48("33") ? "" : (stryCov_9fa48("33"), "VITE_KEYCLOAK_URL"))),
							stryMutAct_9fa48("34")
								? options.keycloakUrlDefault && "http://localhost:8180"
								: (stryCov_9fa48("34"),
									options.keycloakUrlDefault ??
										(stryMutAct_9fa48("35") ? "" : (stryCov_9fa48("35"), "http://localhost:8180")))
						)
					),
					keycloakRealm: envOrDefault(
						options.env,
						stryMutAct_9fa48("36")
							? options.keycloakRealmEnvVar && "VITE_KEYCLOAK_REALM"
							: (stryCov_9fa48("36"),
								options.keycloakRealmEnvVar ??
									(stryMutAct_9fa48("37") ? "" : (stryCov_9fa48("37"), "VITE_KEYCLOAK_REALM"))),
						stryMutAct_9fa48("38")
							? options.keycloakRealmDefault && "clinic"
							: (stryCov_9fa48("38"),
								options.keycloakRealmDefault ?? (stryMutAct_9fa48("39") ? "" : (stryCov_9fa48("39"), "clinic")))
					),
					keycloakClientId: envOrDefault(options.env, options.keycloakClientIdEnvVar, options.keycloakClientIdDefault),
				});
	}
}

// Vite ambient type fallback so this package compiles without depending on vite/client in devDeps.
interface ImportMetaEnv {
	readonly [key: string]: string | boolean | undefined;
}
