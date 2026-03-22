// Test UsernamePrompt component
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock framer-motion
jest.mock("framer-motion", () => {
  const react = require("react");
  return {
    motion: {
      div: react.forwardRef((props, ref) => {
        const { initial, animate, exit, transition, whileTap, variants, ...rest } = props;
        return react.createElement("div", { ...rest, ref });
      }),
      button: react.forwardRef((props, ref) => {
        const { initial, animate, exit, transition, whileTap, variants, ...rest } = props;
        return react.createElement("button", { ...rest, ref });
      }),
    },
    AnimatePresence: ({ children }) => children,
  };
});

// Mock supabase
jest.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: () => ({
      update: () => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

import UsernamePrompt from "../app/components/UsernamePrompt";

describe("UsernamePrompt", () => {
  test("renders pick a username heading", () => {
    render(<UsernamePrompt userId="123" onDone={jest.fn()} />);
    expect(screen.getByText("Pick a username")).toBeInTheDocument();
  });

  test("shows @ prefix", () => {
    render(<UsernamePrompt userId="123" onDone={jest.fn()} />);
    expect(screen.getByText("@")).toBeInTheDocument();
  });

  test("shows error for empty username", () => {
    render(<UsernamePrompt userId="123" onDone={jest.fn()} />);
    fireEvent.submit(screen.getByText(/Let's go/).closest("form"));
    expect(screen.getByText("Please enter a username")).toBeInTheDocument();
  });

  test("shows error for short username", () => {
    render(<UsernamePrompt userId="123" onDone={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("yourname"), { target: { value: "ab" } });
    fireEvent.submit(screen.getByText(/Let's go/).closest("form"));
    expect(screen.getByText("Must be at least 3 characters")).toBeInTheDocument();
  });

  test("shows error for special characters", () => {
    render(<UsernamePrompt userId="123" onDone={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("yourname"), { target: { value: "hi there!" } });
    fireEvent.submit(screen.getByText(/Let's go/).closest("form"));
    expect(screen.getByText("Letters, numbers and underscores only")).toBeInTheDocument();
  });

  test("skip button calls onDone with null", () => {
    const onDone = jest.fn();
    render(<UsernamePrompt userId="123" onDone={onDone} />);
    fireEvent.click(screen.getByText("Skip for now"));
    expect(onDone).toHaveBeenCalledWith(null);
  });

  test("clears error when typing", () => {
    render(<UsernamePrompt userId="123" onDone={jest.fn()} />);
    // trigger error first
    fireEvent.submit(screen.getByText(/Let's go/).closest("form"));
    expect(screen.getByText("Please enter a username")).toBeInTheDocument();
    // type to clear
    fireEvent.change(screen.getByPlaceholderText("yourname"), { target: { value: "a" } });
    expect(screen.queryByText("Please enter a username")).not.toBeInTheDocument();
  });
});
