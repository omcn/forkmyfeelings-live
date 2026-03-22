// Integration test for FindFriends component
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// Mock next/image
jest.mock("next/image", () => ({ src, alt, ...props }) => <img src={src} alt={alt} />);

// Mock supabase
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: (table) => {
      if (table === "friends") {
        return {
          select: (...args) => {
            const result = mockSelect(...args);
            return {
              eq: function () { return this; },
              ...result,
            };
          },
          insert: mockInsert,
          update: (...args) => ({
            eq: function () { return this; },
            ...mockUpdate(...args),
          }),
          delete: () => ({
            eq: function () { return this; },
            ...mockDelete(),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            or: () => ({
              neq: () => ({
                limit: () => Promise.resolve({
                  data: [
                    { id: "u2", username: "alice", email: "alice@test.com", avatar_url: null },
                    { id: "u3", username: "bob", email: "bob@test.com", avatar_url: null },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return { select: jest.fn() };
    },
  },
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import FindFriends from "../app/components/FindFriends";

const currentUser = { id: "u1", email: "me@test.com" };

describe("FindFriends", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSelect.mockReturnValue({
      eq: function () { return this; },
      data: [],
      error: null,
      then: (cb) => Promise.resolve(cb({ data: [], error: null })),
    });
    mockInsert.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders search input and title", () => {
    render(<FindFriends currentUser={currentUser} onClose={jest.fn()} />);
    expect(screen.getByText("🔍 Find Friends")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by username...")).toBeInTheDocument();
  });

  test("close button calls onClose", () => {
    const onClose = jest.fn();
    render(<FindFriends currentUser={currentUser} onClose={onClose} />);
    fireEvent.click(screen.getByText("✕"));
    expect(onClose).toHaveBeenCalled();
  });

  test("search input updates value", () => {
    render(<FindFriends currentUser={currentUser} onClose={jest.fn()} />);
    const input = screen.getByPlaceholderText("Search by username...");
    fireEvent.change(input, { target: { value: "alice" } });
    expect(input.value).toBe("alice");
  });

  test("debounces search (300ms delay)", async () => {
    render(<FindFriends currentUser={currentUser} onClose={jest.fn()} />);
    const input = screen.getByPlaceholderText("Search by username...");

    fireEvent.change(input, { target: { value: "al" } });

    // Before debounce timeout, no results
    act(() => { jest.advanceTimersByTime(200); });

    // After debounce timeout
    await act(async () => { jest.advanceTimersByTime(200); });

    // Results should appear
    await waitFor(() => {
      expect(screen.getByText("alice")).toBeInTheDocument();
    });
  });

  test("clears results when search is empty", () => {
    render(<FindFriends currentUser={currentUser} onClose={jest.fn()} />);
    const input = screen.getByPlaceholderText("Search by username...");
    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.change(input, { target: { value: "" } });
    // No results should be shown
    expect(screen.queryByText("Add +")).not.toBeInTheDocument();
  });

  test("renders close button with ✕", () => {
    render(<FindFriends currentUser={currentUser} onClose={jest.fn()} />);
    expect(screen.getByText("✕")).toBeInTheDocument();
  });
});
