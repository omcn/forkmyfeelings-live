// Integration test for ErrorBoundary component
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "../app/components/ErrorBoundary";

// Suppress console.error for expected errors in tests
const originalError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});
afterEach(() => {
  console.error = originalError;
});

function ThrowingComponent({ shouldThrow }) {
  if (shouldThrow) throw new Error("Test explosion");
  return <div>Everything is fine</div>;
}

function ThrowOnRender() {
  throw new Error("Render bomb");
}

describe("ErrorBoundary", () => {
  test("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Hello world</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  test("renders fallback UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  test("shows the dizzy emoji on error", () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(screen.getByText("😵")).toBeInTheDocument();
  });

  test("shows Rascal message", () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Rascal hit a bump/)).toBeInTheDocument();
  });

  test("shows Refresh Page button", () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(screen.getByText("Refresh Page")).toBeInTheDocument();
  });

  test("refresh button exists and is clickable", () => {
    // Mock window.location.reload
    delete window.location;
    window.location = { reload: jest.fn() };

    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );

    const button = screen.getByText("Refresh Page");
    fireEvent.click(button);
    expect(window.location.reload).toHaveBeenCalled();
  });

  test("shows error details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Render bomb/)).toBeInTheDocument();
    process.env.NODE_ENV = originalEnv;
  });

  test("logs error to console", () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(console.error).toHaveBeenCalled();
  });
});
