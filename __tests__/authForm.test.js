// Integration test for AuthForm component
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock supabase
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockResetPassword = jest.fn();

jest.mock("../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args) => mockSignIn(...args),
      signUp: (...args) => mockSignUp(...args),
      resetPasswordForEmail: (...args) => mockResetPassword(...args),
    },
    from: () => ({
      upsert: jest.fn().mockResolvedValue({}),
    }),
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

import AuthForm from "../app/components/AuthForm";

describe("AuthForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders login form by default", () => {
    render(<AuthForm onAuthSuccess={jest.fn()} />);
    expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  test("toggles to sign up form", () => {
    render(<AuthForm onAuthSuccess={jest.fn()} />);
    fireEvent.click(screen.getByText(/Need an account/));
    expect(screen.getByRole("heading", { name: "Sign Up" })).toBeInTheDocument();
  });

  test("toggles back to login", () => {
    render(<AuthForm onAuthSuccess={jest.fn()} />);
    fireEvent.click(screen.getByText(/Need an account/));
    fireEvent.click(screen.getByText(/Already have an account/));
    expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
  });

  test("shows forgot password form", () => {
    render(<AuthForm onAuthSuccess={jest.fn()} />);
    fireEvent.click(screen.getByText("Forgot password?"));
    expect(screen.getByText("🔑 Reset Password")).toBeInTheDocument();
  });

  test("forgot password form has email input and submit", () => {
    render(<AuthForm onAuthSuccess={jest.fn()} />);
    fireEvent.click(screen.getByText("Forgot password?"));
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByText("Send Reset Link")).toBeInTheDocument();
  });

  test("back button returns to login from forgot password", () => {
    render(<AuthForm onAuthSuccess={jest.fn()} />);
    fireEvent.click(screen.getByText("Forgot password?"));
    fireEvent.click(screen.getByText("← Back to log in"));
    expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
  });

  test("email input updates value", () => {
    render(<AuthForm onAuthSuccess={jest.fn()} />);
    const emailInput = screen.getByPlaceholderText("Email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput.value).toBe("test@example.com");
  });

  test("password input updates value", () => {
    render(<AuthForm onAuthSuccess={jest.fn()} />);
    const passInput = screen.getByPlaceholderText("Password");
    fireEvent.change(passInput, { target: { value: "secret123" } });
    expect(passInput.value).toBe("secret123");
  });

  test("shows error message on login failure", async () => {
    mockSignIn.mockResolvedValue({ data: null, error: { message: "Invalid credentials" } });

    render(<AuthForm onAuthSuccess={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  test("calls onAuthSuccess on successful login", async () => {
    const onSuccess = jest.fn();
    const mockData = { session: { user: { id: "123" } } };
    mockSignIn.mockResolvedValue({ data: mockData, error: null });

    render(<AuthForm onAuthSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "pass123" } });
    fireEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });
  });

  test("shows 'Please wait…' while loading", async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})); // never resolves

    render(<AuthForm onAuthSuccess={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "pass" } });
    fireEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(screen.getByText("Please wait…")).toBeInTheDocument();
    });
  });

  test("forgot password link is only visible on login form", () => {
    render(<AuthForm onAuthSuccess={jest.fn()} />);
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Need an account/));
    expect(screen.queryByText("Forgot password?")).not.toBeInTheDocument();
  });

  test("submit button text changes between Login and Sign Up", () => {
    render(<AuthForm onAuthSuccess={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Need an account/));
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });
});
