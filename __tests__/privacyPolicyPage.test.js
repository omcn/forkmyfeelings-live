/**
 * Tests for app/privacy-policy/page.js — Privacy Policy static page
 *
 * Ensures the page renders all required legal sections:
 * - Heading
 * - All 5 policy sections
 * - Contact email link
 */

const react = require("react");
const { render, screen } = require("@testing-library/react");

const PrivacyPolicy = require("../app/privacy-policy/page").default;

describe("PrivacyPolicyPage", () => {
  beforeEach(() => {
    render(react.createElement(PrivacyPolicy));
  });

  it("renders the main heading", () => {
    expect(screen.getByText("Privacy Policy")).toBeTruthy();
  });

  it("renders Section 1: What We Collect", () => {
    expect(screen.getByText("1. What We Collect")).toBeTruthy();
  });

  it("lists email, mood, and recipe data collection", () => {
    expect(screen.getByText(/Email address/)).toBeTruthy();
    expect(screen.getByText(/Mood selections/)).toBeTruthy();
    expect(screen.getByText(/Recipe interaction history/)).toBeTruthy();
  });

  it("renders Section 2: How We Use It", () => {
    expect(screen.getByText("2. How We Use It")).toBeTruthy();
  });

  it("renders Section 3: Your Rights", () => {
    expect(screen.getByText("3. Your Rights")).toBeTruthy();
  });

  it("mentions Delete Account option", () => {
    expect(screen.getByText(/Delete Account/)).toBeTruthy();
  });

  it("renders Section 4: Data Storage", () => {
    expect(screen.getByText("4. Data Storage")).toBeTruthy();
  });

  it("mentions Supabase", () => {
    expect(screen.getByText(/Supabase/)).toBeTruthy();
  });

  it("renders Section 5: Contact", () => {
    expect(screen.getByText("5. Contact")).toBeTruthy();
  });

  it("has a mailto link for the contact email", () => {
    const link = screen.getByText("hello@forkmyfeelings.com");
    expect(link.getAttribute("href")).toBe("mailto:hello@forkmyfeelings.com");
  });
});
