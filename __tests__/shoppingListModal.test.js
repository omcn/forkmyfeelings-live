// Test ShoppingListModal component
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

import ShoppingListModal from "../app/components/ShoppingListModal";

describe("ShoppingListModal", () => {
  const mockRecipe = {
    name: "Test Pasta",
    ingredients: ["flour", "eggs", "salt", "water"],
  };

  test("renders shopping list title", () => {
    render(<ShoppingListModal recipe={mockRecipe} onClose={jest.fn()} />);
    expect(screen.getByText(/Shopping List/)).toBeInTheDocument();
  });

  test("displays all ingredients", () => {
    render(<ShoppingListModal recipe={mockRecipe} onClose={jest.fn()} />);
    expect(screen.getByText("flour")).toBeInTheDocument();
    expect(screen.getByText("eggs")).toBeInTheDocument();
    expect(screen.getByText("salt")).toBeInTheDocument();
    expect(screen.getByText("water")).toBeInTheDocument();
  });

  test("close button calls onClose", () => {
    const onClose = jest.fn();
    render(<ShoppingListModal recipe={mockRecipe} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close shopping list"));
    expect(onClose).toHaveBeenCalled();
  });

  test("copy button is enabled when ingredients exist", () => {
    render(<ShoppingListModal recipe={mockRecipe} onClose={jest.fn()} />);
    const copyBtn = screen.getByText(/Copy to Clipboard/);
    expect(copyBtn).not.toBeDisabled();
  });

  test("shows empty message when no ingredients", () => {
    render(<ShoppingListModal recipe={{ name: "Empty", ingredients: [] }} onClose={jest.fn()} />);
    expect(screen.getByText(/No ingredients found/)).toBeInTheDocument();
  });

  test("copy button is disabled when no ingredients", () => {
    render(<ShoppingListModal recipe={{ name: "Empty", ingredients: [] }} onClose={jest.fn()} />);
    const copyBtn = screen.getByText(/Copy to Clipboard/);
    expect(copyBtn).toBeDisabled();
  });

  test("download link has correct filename", () => {
    render(<ShoppingListModal recipe={mockRecipe} onClose={jest.fn()} />);
    const downloadLink = screen.getByText(/Save to Notes/);
    expect(downloadLink.getAttribute("download")).toBe("shopping-list-test-pasta.txt");
  });

  test("parses JSON string ingredients", () => {
    const recipe = { name: "Test", ingredients: '["flour","sugar"]' };
    render(<ShoppingListModal recipe={recipe} onClose={jest.fn()} />);
    expect(screen.getByText("flour")).toBeInTheDocument();
    expect(screen.getByText("sugar")).toBeInTheDocument();
  });
});
