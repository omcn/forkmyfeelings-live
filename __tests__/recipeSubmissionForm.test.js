// Integration test for RecipeSubmissionForm component
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RecipeSubmissionForm from "../app/components/RecipeSubmissionForm";

describe("RecipeSubmissionForm", () => {
  test("renders form with all fields", () => {
    render(<RecipeSubmissionForm onSubmit={jest.fn()} />);
    expect(screen.getByText("Submit Your Recipe")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mood 1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Recipe Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Short description")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Step-by-step instructions (one per line)")).toBeInTheDocument();
  });

  test("starts with one mood input", () => {
    render(<RecipeSubmissionForm onSubmit={jest.fn()} />);
    expect(screen.getByPlaceholderText("Mood 1")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Mood 2")).not.toBeInTheDocument();
  });

  test("can add up to 3 mood inputs", () => {
    render(<RecipeSubmissionForm onSubmit={jest.fn()} />);
    fireEvent.click(screen.getByText("+ Add another mood"));
    expect(screen.getByPlaceholderText("Mood 2")).toBeInTheDocument();
    fireEvent.click(screen.getByText("+ Add another mood"));
    expect(screen.getByPlaceholderText("Mood 3")).toBeInTheDocument();
    // Button should disappear after 3
    expect(screen.queryByText("+ Add another mood")).not.toBeInTheDocument();
  });

  test("calls onSubmit with formatted recipe data", () => {
    const onSubmit = jest.fn();
    render(<RecipeSubmissionForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText("Mood 1"), { target: { value: "happy" } });
    fireEvent.change(screen.getByPlaceholderText("Recipe Name"), { target: { value: "Test Pasta" } });
    fireEvent.change(screen.getByPlaceholderText("Short description"), { target: { value: "A tasty pasta" } });
    fireEvent.change(screen.getByPlaceholderText("Step-by-step instructions (one per line)"), {
      target: { value: "Boil water\nCook pasta\nServe" },
    });

    fireEvent.click(screen.getByText("Submit Recipe"));

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Test Pasta",
      description: "A tasty pasta",
      moods: ["happy"],
      emoji: "👤",
      steps: ["Boil water", "Cook pasta", "Serve"],
      userSubmitted: true,
    });
  });

  test("resets form after submission", () => {
    render(<RecipeSubmissionForm onSubmit={jest.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Recipe Name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Short description"), { target: { value: "Desc" } });
    fireEvent.change(screen.getByPlaceholderText("Step-by-step instructions (one per line)"), { target: { value: "Step 1" } });
    fireEvent.submit(screen.getByText("Submit Recipe").closest("form"));

    expect(screen.getByPlaceholderText("Recipe Name").value).toBe("");
    expect(screen.getByPlaceholderText("Short description").value).toBe("");
  });

  test("filters empty lines from steps", () => {
    const onSubmit = jest.fn();
    render(<RecipeSubmissionForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText("Recipe Name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByPlaceholderText("Short description"), { target: { value: "Desc" } });
    fireEvent.change(screen.getByPlaceholderText("Step-by-step instructions (one per line)"), {
      target: { value: "Step 1\n\n\nStep 2\n  \nStep 3" },
    });

    fireEvent.click(screen.getByText("Submit Recipe"));

    expect(onSubmit.mock.calls[0][0].steps).toEqual(["Step 1", "Step 2", "Step 3"]);
  });

  test("mood inputs update independently", () => {
    render(<RecipeSubmissionForm onSubmit={jest.fn()} />);
    fireEvent.click(screen.getByText("+ Add another mood"));

    fireEvent.change(screen.getByPlaceholderText("Mood 1"), { target: { value: "happy" } });
    fireEvent.change(screen.getByPlaceholderText("Mood 2"), { target: { value: "chill" } });

    expect(screen.getByPlaceholderText("Mood 1").value).toBe("happy");
    expect(screen.getByPlaceholderText("Mood 2").value).toBe("chill");
  });
});
