import { describe, expect, it, vi } from "vitest";

const MockKeycloak = vi.hoisted(() => vi.fn<() => { init: () => void }>());

vi.mock("keycloak-js", () => ({ default: MockKeycloak }));

import { createKeycloak } from "../keycloak";

describe("createKeycloak", () => {
	it("creates a Keycloak instance with url, realm, and clientId from config", () => {
		MockKeycloak.mockClear();

		createKeycloak({
			apiBaseUrl: "http://api.dev",
			keycloakUrl: "http://kc.dev",
			keycloakRealm: "my-realm",
			keycloakClientId: "my-client",
		});

		expect(MockKeycloak).toHaveBeenCalledWith({
			url: "http://kc.dev",
			realm: "my-realm",
			clientId: "my-client",
		});
	});
});
