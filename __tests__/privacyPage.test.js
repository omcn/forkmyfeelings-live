/**
 * Tests for app/privacy/page.js — Full privacy policy page
 *
 * Tests all 8 legal sections render correctly with key content.
 */

const react = require("react");
const { render, screen } = require("@testing-library/react");

const PrivacyPage = require("../app/privacy/page").default;

describe("PrivacyPage", () => {
  beforeEach(() => {
    render(react.createElement(PrivacyPage));
  });

  it("renders the main heading", () => {
    expect(screen.getByText("Privacy Policy")).toBeTruthy();
  });

  it("shows last updated date", () => {
    expect(screen.getByText(/Last updated/)).toBeTruthy();
  });

  it("renders all 8 section headings", () => {
    expect(screen.getByText("1. Information We Collect")).toBeTruthy();
    expect(screen.getByText("2. How We Use Your Information")).toBeTruthy();
    expect(screen.getByText("3. Data Storage & Security")).toBeTruthy();
    expect(screen.getByText("4. Third-Party Services")).toBeTruthy();
    expect(screen.getByText("5. Your Rights")).toBeTruthy();
    expect(screen.getByText("6. Children's Privacy")).toBeTruthy();
    expect(screen.getByText("7. Changes to This Policy")).toBeTruthy();
    expect(screen.getByText("8. Contact Us")).toBeTruthy();
  });

  it("mentions Supabase in data storage", () => {
    expect(screen.getByText(/Supabase, which provides encrypted/)).toBeTruthy();
  });

  it("mentions no data selling", () => {
    expect(screen.getByText(/do not sell your data/)).toBeTruthy();
  });

  it("mentions children under 13", () => {
    expect(screen.getByText(/not directed at children under 13/)).toBeTruthy();
  });

  it("has a contact email link", () => {
    const links = screen.getAllByText("hello@forkmyfeelings.com");
    expect(links[0].getAttribute("href")).toBe("mailto:hello@forkmyfeelings.com");
  });

  it("has a back to app link", () => {
    const link = screen.getByText(/Back to app/);
    expect(link.getAttribute("href")).toBe("/");
  });

  it("mentions location data is not stored", () => {
    expect(screen.getByText(/We do not store your location/)).toBeTruthy();
  });
});
