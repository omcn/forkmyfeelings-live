/**
 * Tests for app/not-found.js — 404 page
 *
 * Tests:
 * - 404 heading renders
 * - Rascal-themed description
 * - Back to Kitchen link points to /
 */

const react = require("react");
const { render, screen } = require("@testing-library/react");

// Mock next/link
jest.mock("next/link", () => {
  const r = require("react");
  return {
    __esModule: true,
    default: function MockLink({ href, children, ...rest }) {
      return r.createElement("a", { href, ...rest }, children);
    },
  };
});

const NotFound = require("../app/not-found").default;

describe("NotFoundPage", () => {
  beforeEach(() => {
    render(react.createElement(NotFound));
  });

  it("renders the 404 heading", () => {
    expect(screen.getByText(/404/)).toBeTruthy();
  });

  it("includes Page Not Found text", () => {
    expect(screen.getByText(/Page Not Found/)).toBeTruthy();
  });

  it("renders the fork emoji", () => {
    expect(screen.getByText("🍴")).toBeTruthy();
  });

  it("shows Rascal-themed description", () => {
    expect(screen.getByText(/Rascal looked everywhere/)).toBeTruthy();
  });

  it("shows humorous secondary text", () => {
    expect(screen.getByText(/Maybe it was eaten/)).toBeTruthy();
  });

  it("has a Back to Kitchen link", () => {
    const link = screen.getByText("Back to Kitchen");
    expect(link.getAttribute("href")).toBe("/");
  });
});
