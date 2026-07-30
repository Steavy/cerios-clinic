// @ts-nocheck
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { PortalFooter } from "../portal-footer";

describe("PortalFooter", () => {
	it("renders the portal name", () => {
		render(<PortalFooter portalName="Patient Portal" />);
		expect(screen.getByText(/Patient Portal/)).toBeInTheDocument();
	});

	it("renders the current year", () => {
		render(<PortalFooter portalName="Doctor Portal" />);
		const year = new Date().getFullYear().toString();
		expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
	});

	it("renders the copyright symbol", () => {
		render(<PortalFooter portalName="Admin Portal" />);
		expect(screen.getByText(/©/)).toBeInTheDocument();
	});

	it("does not render the logo by default", () => {
		render(<PortalFooter portalName="Test Portal" />);
		expect(screen.queryByAltText("Cerios logo")).not.toBeInTheDocument();
	});

	it("renders the logo when showLogo is true", () => {
		render(<PortalFooter portalName="Test Portal" showLogo />);
		expect(screen.getByAltText("Cerios logo")).toBeInTheDocument();
	});

	it("does not render the logo when showLogo is false", () => {
		render(<PortalFooter portalName="Test Portal" showLogo={false} />);
		expect(screen.queryByAltText("Cerios logo")).not.toBeInTheDocument();
	});

	it("has the footer element with correct classes", () => {
		const { container } = render(<PortalFooter portalName="Test Portal" />);
		const footer = container.querySelector("footer");
		expect(footer).toBeInTheDocument();
		expect(footer!.className).toContain("bg-brand-navy");
	});
});
