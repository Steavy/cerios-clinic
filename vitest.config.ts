import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["packages/portal-common/src/**/*.test.{ts,tsx}", "packages/shared-types/src/**/*.test.{ts,tsx}"],
		environment: "jsdom",
		globals: true,
		setupFiles: ["./vitest.setup.ts"],
		deps: {
			inline: ["@clinic/portal-common"],
		},
	},
	resolve: {
		alias: {
			"@clinic/portal-common": path.resolve(__dirname, "packages/portal-common/src"),
			"@clinic/shared-types": path.resolve(__dirname, "packages/shared-types/src"),
		},
	},
});
