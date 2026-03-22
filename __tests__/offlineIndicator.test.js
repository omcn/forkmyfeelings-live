// Integration test for OfflineIndicator component
import React from "react";
import { render, screen, act } from "@testing-library/react";

// Mock framer-motion to avoid animation issues in tests
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import OfflineIndicator from "../app/components/OfflineIndicator";

describe("OfflineIndicator", () => {
  let listeners = {};

  beforeEach(() => {
    listeners = {};
    jest.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
      listeners[event] = handler;
    });
    jest.spyOn(window, "removeEventListener").mockImplementation((event) => {
      delete listeners[event];
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("does not show banner when online", () => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    render(<OfflineIndicator />);
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
  });

  test("shows banner when initially offline", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    render(<OfflineIndicator />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  test("shows banner when going offline", () => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    render(<OfflineIndicator />);
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();

    act(() => {
      listeners.offline?.();
    });
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  test("hides banner when coming back online", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    render(<OfflineIndicator />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();

    act(() => {
      listeners.online?.();
    });
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
  });

  test("shows cooking mode still works message", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    render(<OfflineIndicator />);
    expect(screen.getByText(/cooking mode still works/i)).toBeInTheDocument();
  });

  test("cleans up event listeners on unmount", () => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    const { unmount } = render(<OfflineIndicator />);
    unmount();
    expect(window.removeEventListener).toHaveBeenCalledWith("offline", expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith("online", expect.any(Function));
  });
});
