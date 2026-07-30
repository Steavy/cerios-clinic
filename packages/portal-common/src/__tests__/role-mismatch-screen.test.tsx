import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { AuthServiceUnavailableScreen, RoleMismatchScreen } from "../role-mismatch-screen";

describe("RoleMismatchScreen", () => {
	it("renders Access Denied heading", () => {
		render(<RoleMismatchScreen audienceLabel="doctors" onSignOut={() => {}} />);
		expect(screen.getByText("Access Denied")).toBeInTheDocument();
	});

	it("renders the audience label in the description", () => {
		render(<RoleMismatchScreen audienceLabel="patients" onSignOut={() => {}} />);
		expect(screen.getByText(/patients only/)).toBeInTheDocument();
	});

	it("renders a Sign out button", () => {
		render(<RoleMismatchScreen audienceLabel="assistants" onSignOut={() => {}} />);
		expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
	});

	it("calls onSignOut when the button is clicked", async () => {
		const onSignOut = vi.fn<() => void>();
		render(<RoleMismatchScreen audienceLabel="admins" onSignOut={onSignOut} />);
		await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
		expect(onSignOut).toHaveBeenCalledOnce();
	});

	it("renders the custom emoji when provided", () => {
		render(<RoleMismatchScreen audienceLabel="doctors" onSignOut={() => {}} emoji="🔒" />);
		expect(screen.getByText("🔒")).toBeInTheDocument();
	});

	it("renders the default emoji when not provided", () => {
		render(<RoleMismatchScreen audienceLabel="doctors" onSignOut={() => {}} />);
		expect(screen.getByText("🚫")).toBeInTheDocument();
	});
});

describe("AuthServiceUnavailableScreen", () => {
	it("renders Service Unavailable heading", () => {
		render(<AuthServiceUnavailableScreen />);
		expect(screen.getByText("Service Unavailable")).toBeInTheDocument();
	});

	it("renders the description text", () => {
		render(<AuthServiceUnavailableScreen />);
		expect(screen.getByText(/Authentication service is unavailable/)).toBeInTheDocument();
	});
});
