/**
 * Tests for app/terms/page.js — Terms of Service page
 *
 * Tests all 10 legal sections render correctly with key content.
 */

const react = require("react");
const { render, screen } = require("@testing-library/react");

const TermsPage = require("../app/terms/page").default;

describe("TermsPage", () => {
  beforeEach(() => {
    render(react.createElement(TermsPage));
  });

  it("renders the main heading", () => {
    expect(screen.getByText("Terms of Service")).toBeTruthy();
  });

  it("shows last updated date", () => {
    expect(screen.getByText(/Last updated/)).toBeTruthy();
  });

  it("renders all 10 section headings", () => {
    expect(screen.getByText("1. Acceptance of Terms")).toBeTruthy();
    expect(screen.getByText("2. Description of Service")).toBeTruthy();
    expect(screen.getByText("3. User Accounts")).toBeTruthy();
    expect(screen.getByText("4. User Content")).toBeTruthy();
    expect(screen.getByText("5. Acceptable Use")).toBeTruthy();
    expect(screen.getByText("6. Recipe Disclaimer")).toBeTruthy();
    expect(screen.getByText("7. Termination")).toBeTruthy();
    expect(screen.getByText("8. Limitation of Liability")).toBeTruthy();
    expect(screen.getByText("9. Changes to Terms")).toBeTruthy();
    expect(screen.getByText("10. Contact")).toBeTruthy();
  });

  it("mentions minimum age requirement", () => {
    expect(screen.getByText(/at least 13 years old/)).toBeTruthy();
  });

  it("mentions content must be family-friendly", () => {
    expect(screen.getByText(/family-friendly/)).toBeTruthy();
  });

  it("mentions allergen responsibility", () => {
    expect(screen.getByText(/Always check ingredients for allergens/)).toBeTruthy();
  });

  it("mentions account deletion right", () => {
    expect(screen.getByText(/delete your account at any time/)).toBeTruthy();
  });

  it("has a contact email link", () => {
    const link = screen.getByText("hello@forkmyfeelings.com");
    expect(link.getAttribute("href")).toBe("mailto:hello@forkmyfeelings.com");
  });

  it("has a back to app link", () => {
    const link = screen.getByText(/Back to app/);
    expect(link.getAttribute("href")).toBe("/");
  });

  it("mentions provided as-is", () => {
    expect(screen.getByText(/provided "as is"/)).toBeTruthy();
  });
});
