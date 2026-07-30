import { describe, expect, it } from "vitest";

import { createAppConfig, envOrDefault, trimTrailingSlash } from "../config";

describe("envOrDefault", () => {
	it("returns the env value when it is a non-empty string", () => {
		expect(envOrDefault({ FOO: "hello" }, "FOO", "fallback")).toBe("hello");
	});

	it("returns trimmed value", () => {
		expect(envOrDefault({ FOO: "  hello  " }, "FOO", "fallback")).toBe("hello");
	});

	it("returns the fallback when value is missing", () => {
		expect(envOrDefault({}, "MISSING", "fallback")).toBe("fallback");
	});

	it("returns the fallback when value is an empty string", () => {
		expect(envOrDefault({ FOO: "" }, "FOO", "fallback")).toBe("fallback");
	});

	it("returns the fallback when value is whitespace only", () => {
		expect(envOrDefault({ FOO: "   " }, "FOO", "fallback")).toBe("fallback");
	});

	it("returns the fallback when value is not a string (number)", () => {
		expect(envOrDefault({ FOO: 42 }, "FOO", "fallback")).toBe("fallback");
	});

	it("returns the fallback when value is boolean", () => {
		expect(envOrDefault({ FOO: false }, "FOO", "fallback")).toBe("fallback");
	});
});

describe("trimTrailingSlash", () => {
	it("removes a single trailing slash", () => {
		expect(trimTrailingSlash("http://example.com/")).toBe("http://example.com");
	});

	it("removes only one trailing slash", () => {
		expect(trimTrailingSlash("http://example.com///")).toBe("http://example.com//");
	});

	it("does nothing when there is no trailing slash", () => {
		expect(trimTrailingSlash("http://example.com")).toBe("http://example.com");
	});

	it("handles empty string", () => {
		expect(trimTrailingSlash("")).toBe("");
	});

	it("handles root path", () => {
		expect(trimTrailingSlash("/")).toBe("");
	});
});

describe("createAppConfig", () => {
	const baseOptions = {
		env: {
			VITE_API_URL: "http://api.dev/",
			VITE_KEYCLOAK_CLIENT_ID: "my-client",
		},
		apiBaseUrlEnvVar: "VITE_API_URL",
		apiBaseUrlDefault: "http://default.api",
		keycloakClientIdEnvVar: "VITE_KEYCLOAK_CLIENT_ID",
		keycloakClientIdDefault: "default-client",
	};

	it("builds config from env values", () => {
		const config = createAppConfig(baseOptions);
		expect(config.apiBaseUrl).toBe("http://api.dev");
		expect(config.keycloakClientId).toBe("my-client");
		expect(config.keycloakUrl).toBe("http://localhost:8180");
		expect(config.keycloakRealm).toBe("clinic");
	});

	it("applies defaults for missing env vars", () => {
		const config = createAppConfig({
			...baseOptions,
			env: {},
		});
		expect(config.apiBaseUrl).toBe("http://default.api");
		expect(config.keycloakClientId).toBe("default-client");
		expect(config.keycloakUrl).toBe("http://localhost:8180");
		expect(config.keycloakRealm).toBe("clinic");
	});

	it("allows overriding keycloak env var names", () => {
		const config = createAppConfig({
			...baseOptions,
			keycloakUrlEnvVar: "KC_URL",
			keycloakRealmEnvVar: "KC_REALM",
			keycloakUrlDefault: "https://keycloak.dev",
			keycloakRealmDefault: "my-realm",
			env: {
				KC_URL: "https://kc.example.com/",
				KC_REALM: "custom-realm",
			},
		});
		expect(config.keycloakUrl).toBe("https://kc.example.com");
		expect(config.keycloakRealm).toBe("custom-realm");
	});

	it("trims trailing slashes from all URLs", () => {
		const config = createAppConfig({
			...baseOptions,
			keycloakUrlDefault: "http://keycloak.dev/",
			env: {
				VITE_API_URL: "http://api.dev/path/",
				VITE_KEYCLOAK_CLIENT_ID: "x",
				VITE_KEYCLOAK_URL: "http://kc.dev/",
			},
		});
		expect(config.apiBaseUrl).toBe("http://api.dev/path");
		expect(config.keycloakUrl).toBe("http://kc.dev");
	});
});
