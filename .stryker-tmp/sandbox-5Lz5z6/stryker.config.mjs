// @ts-nocheck
export default {
	packageManager: "pnpm",
	plugins: ["@stryker-mutator/vitest-runner"],
	testRunner: "vitest",
	mutate: [
		"packages/portal-common/src/**/*.ts",
		"packages/shared-types/src/**/*.ts",
		"!packages/portal-common/src/**/*.test.*",
		"!packages/shared-types/src/**/*.test.*",
	],
	vitest: {
		configFile: "vitest.config.ts",
	},
	reporters: ["clear-text", "progress", "html"],
	thresholds: {
		high: 80,
		low: 60,
		break: null,
	},
	cleanTempDir: true,
};
