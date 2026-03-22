/**
 * Tests for app/global-error.js — Global error fallback page
 *
 * Tests:
 * - Error heading and description render
 * - Sentry.captureException called with the error
 * - Try Again button calls reset()
 */

const react = require("react");
const { render, screen, fireEvent } = require("@testing-library/react");

// Mock Sentry
const mockCaptureException = jest.fn();
jest.mock("@sentry/nextjs", () => ({
  captureException: (...args) => mockCaptureException(...args),
}));

const GlobalError = require("../app/global-error").default;

describe("GlobalError", () => {
  const mockError = new Error("Test crash");
  const mockReset = jest.fn();

  beforeEach(() => {
    mockCaptureException.mockClear();
    mockReset.mockClear();
  });

  it("renders the error heading", () => {
    render(react.createElement(GlobalError, { error: mockError, reset: mockReset }));
    expect(screen.getByText("Something went wrong")).toBeTruthy();
  });

  it("renders the error description", () => {
    render(react.createElement(GlobalError, { error: mockError, reset: mockReset }));
    expect(screen.getByText(/Rascal hit a bump/)).toBeTruthy();
  });

  it("renders the emoji", () => {
    render(react.createElement(GlobalError, { error: mockError, reset: mockReset }));
    expect(screen.getByText("😵")).toBeTruthy();
  });

  it("reports error to Sentry on mount", () => {
    render(react.createElement(GlobalError, { error: mockError, reset: mockReset }));
    expect(mockCaptureException).toHaveBeenCalledWith(mockError);
  });

  it("renders Try Again button", () => {
    render(react.createElement(GlobalError, { error: mockError, reset: mockReset }));
    expect(screen.getByText("Try Again")).toBeTruthy();
  });

  it("calls reset() when Try Again is clicked", () => {
    render(react.createElement(GlobalError, { error: mockError, reset: mockReset }));
    fireEvent.click(screen.getByText("Try Again"));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("reports new error when error prop changes", () => {
    const { rerender } = render(
      react.createElement(GlobalError, { error: mockError, reset: mockReset })
    );
    const newError = new Error("Different crash");
    rerender(react.createElement(GlobalError, { error: newError, reset: mockReset }));
    expect(mockCaptureException).toHaveBeenCalledWith(newError);
  });
});
