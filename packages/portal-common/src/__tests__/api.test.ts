import type { AxiosInstance } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.hoisted(() =>
	vi.fn<() => AxiosInstance>(
		() =>
			({
				interceptors: { request: { use: vi.fn<() => void>() } },
			}) as never
	)
);

vi.mock("axios", () => ({
	default: { create: mockCreate },
	create: mockCreate,
}));

import { createApi } from "../api";

afterEach(() => {
	mockCreate.mockClear();
});

function lastHandler(): (config: Record<string, unknown>) => Promise<Record<string, unknown>> {
	const results = mockCreate.mock.results;
	const last = results[results.length - 1];
	const use = (
		last?.value as never as { interceptors: { request: { use: { mock: { calls: Array<Array<unknown>> } } } } }
	)?.interceptors?.request?.use;
	if (!use) throw new Error("no interceptor registered");
	return use.mock.calls[0][0] as (config: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

describe("createApi", () => {
	it("creates an axios instance with the given baseUrl", () => {
		createApi({ baseUrl: "http://api.dev", keycloak: { token: "tok" } as never });
		expect(mockCreate).toHaveBeenCalledWith({ baseURL: "http://api.dev" });
	});

	it("registers a request interceptor", () => {
		const use = vi.fn<(handler: unknown) => void>();
		const instance = { interceptors: { request: { use } } };
		mockCreate.mockReturnValueOnce(instance as never);

		createApi({ baseUrl: "http://api.dev", keycloak: { token: "tok" } as never });

		expect(use).toHaveBeenCalledOnce();
	});

	it("adds bearer token to request header", async () => {
		const keycloak = { token: "my-token", isTokenExpired: () => false } as never;
		createApi({ baseUrl: "http://api.dev", keycloak });

		const config = { headers: {} as Record<string, string> };
		const result = await lastHandler()(config);

		expect(result.headers.Authorization).toBe("Bearer my-token");
	});

	it("does not refresh token when it is fresh", async () => {
		const isTokenExpired = vi.fn<() => boolean>(() => false);
		const updateToken = vi.fn<() => Promise<boolean>>(() => Promise.resolve(true));
		const keycloak = { token: "tok", isTokenExpired, updateToken } as never;

		createApi({ baseUrl: "http://api.dev", keycloak });
		await lastHandler()({ headers: {} });

		expect(isTokenExpired).toHaveBeenCalledWith(30);
		expect(updateToken).not.toHaveBeenCalled();
	});

	it("refreshes token when it is expired", async () => {
		const updateToken = vi.fn<() => Promise<boolean>>(() => Promise.resolve(true));
		const keycloak = { token: "tok", isTokenExpired: () => true, updateToken } as never;

		createApi({ baseUrl: "http://api.dev", keycloak });
		await lastHandler()({ headers: {} });

		expect(updateToken).toHaveBeenCalledWith(30);
	});

	it("skips auth header when no token exists", async () => {
		const keycloak = { token: undefined, isTokenExpired: () => false } as never;

		createApi({ baseUrl: "http://api.dev", keycloak });
		const result = await lastHandler()({ headers: {} });

		expect((result.headers as Record<string, string>).Authorization).toBeUndefined();
	});

	it("uses custom minValiditySeconds when provided", async () => {
		const isTokenExpired = vi.fn<() => boolean>(() => true);
		const keycloak = { token: "tok", isTokenExpired, updateToken: () => Promise.resolve(true) } as never;

		createApi({ baseUrl: "http://api.dev", keycloak, minValiditySeconds: 60 });
		await lastHandler()({ headers: {} });

		expect(isTokenExpired).toHaveBeenCalledWith(60);
	});

	it("calls login when token refresh fails", async () => {
		const login = vi.fn();
		const keycloak = {
			token: "tok",
			isTokenExpired: () => true,
			updateToken: () => Promise.reject(new Error("auth error")),
			login,
		} as never;

		createApi({ baseUrl: "http://api.dev", keycloak });
		await lastHandler()({ headers: {} });

		expect(login).toHaveBeenCalledOnce();
	});
});
