// Integration test for RecipeCard component
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock framer-motion
jest.mock("framer-motion", () => {
  const react = require("react");
  return {
    motion: {
      div: react.forwardRef(({ children, initial, animate, exit, transition, whileTap, drag, dragConstraints, dragElastic, onDrag, onDragEnd, ...rest }, ref) => {
        return react.createElement("div", { ref, ...rest }, children);
      }),
      button: ({ children, whileTap, ...props }) => react.createElement("button", props, children),
    },
    useMotionValue: () => ({ set: jest.fn(), get: () => 0 }),
    useTransform: () => ({ get: () => 0 }),
  };
});

import RecipeCard from "../app/components/RecipeCard";

const defaultProps = {
  recipe: {
    id: "r1",
    name: "Mac & Cheese",
    emoji: "🧀",
    description: "Creamy comfort food",
    ingredients: ["pasta", "cheese", "butter", "milk"],
    steps: ["Boil pasta", "Make sauce", "Combine"],
    created_at: "2024-01-15T10:00:00Z",
  },
  recipeAvgRating: 4.2,
  savedIds: new Set(),
  onToggleFavourite: jest.fn(),
  onMakeIt: jest.fn(),
  onReshuffle: jest.fn(),
  onShare: jest.fn(),
  onShoppingList: jest.fn(),
  haptic: jest.fn(),
  bloopSound: { play: jest.fn() },
  submitRecipeRating: jest.fn(),
};

describe("RecipeCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders recipe name with emoji", () => {
    render(<RecipeCard {...defaultProps} />);
    expect(screen.getByText(/Mac & Cheese/)).toBeInTheDocument();
  });

  test("renders recipe description", () => {
    render(<RecipeCard {...defaultProps} />);
    expect(screen.getByText("Creamy comfort food")).toBeInTheDocument();
  });

  test("renders average rating", () => {
    render(<RecipeCard {...defaultProps} />);
    expect(screen.getByText(/4\.2/)).toBeInTheDocument();
  });

  test("hides rating when null", () => {
    render(<RecipeCard {...defaultProps} recipeAvgRating={null} />);
    expect(screen.queryByText(/\/ 5/)).not.toBeInTheDocument();
  });

  test("renders ingredients list", () => {
    render(<RecipeCard {...defaultProps} />);
    expect(screen.getByText("pasta")).toBeInTheDocument();
    expect(screen.getByText("cheese")).toBeInTheDocument();
    expect(screen.getByText("butter")).toBeInTheDocument();
    expect(screen.getByText("milk")).toBeInTheDocument();
  });

  test("shows 🤍 when not saved", () => {
    render(<RecipeCard {...defaultProps} savedIds={new Set()} />);
    expect(screen.getByText("🤍")).toBeInTheDocument();
  });

  test("shows ❤️ when saved", () => {
    render(<RecipeCard {...defaultProps} savedIds={new Set(["r1"])} />);
    // Both the swipe hint and save button show ❤️
    expect(screen.getAllByText("❤️").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Remove from saved")).toBeInTheDocument();
  });

  test("heart button calls onToggleFavourite", () => {
    const onToggle = jest.fn();
    render(<RecipeCard {...defaultProps} onToggleFavourite={onToggle} />);
    fireEvent.click(screen.getByTitle("Save recipe"));
    expect(onToggle).toHaveBeenCalledWith(defaultProps.recipe);
  });

  test("heart button calls haptic on save", () => {
    const haptic = jest.fn();
    render(<RecipeCard {...defaultProps} haptic={haptic} />);
    fireEvent.click(screen.getByTitle("Save recipe"));
    expect(haptic).toHaveBeenCalledWith("success");
  });

  test("Let's Make It button calls onMakeIt", () => {
    render(<RecipeCard {...defaultProps} />);
    fireEvent.click(screen.getByText("Let's Make It →"));
    expect(defaultProps.onMakeIt).toHaveBeenCalled();
  });

  test("Reshuffle button calls onReshuffle and plays sound", () => {
    render(<RecipeCard {...defaultProps} />);
    fireEvent.click(screen.getByText("🔄 Reshuffle"));
    expect(defaultProps.onReshuffle).toHaveBeenCalled();
    expect(defaultProps.bloopSound.play).toHaveBeenCalled();
  });

  test("Shopping List button calls onShoppingList", () => {
    render(<RecipeCard {...defaultProps} />);
    fireEvent.click(screen.getByText("🛒 Shopping List"));
    expect(defaultProps.onShoppingList).toHaveBeenCalled();
  });

  test("renders schema.org structured data", () => {
    const { container } = render(<RecipeCard {...defaultProps} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const schema = JSON.parse(script.innerHTML);
    expect(schema["@type"]).toBe("Recipe");
    expect(schema.name).toBe("Mac & Cheese");
  });

  test("handles JSON string ingredients", () => {
    const props = {
      ...defaultProps,
      recipe: {
        ...defaultProps.recipe,
        ingredients: '["flour","sugar"]',
      },
    };
    render(<RecipeCard {...props} />);
    expect(screen.getByText("flour")).toBeInTheDocument();
    expect(screen.getByText("sugar")).toBeInTheDocument();
  });

  test("hides Let's Make It when no steps", () => {
    const props = {
      ...defaultProps,
      recipe: { ...defaultProps.recipe, steps: null },
    };
    render(<RecipeCard {...props} />);
    expect(screen.queryByText("Let's Make It →")).not.toBeInTheDocument();
  });

  test("save button has correct aria-label when not saved", () => {
    render(<RecipeCard {...defaultProps} savedIds={new Set()} />);
    expect(screen.getByLabelText("Save recipe")).toBeInTheDocument();
  });

  test("save button has correct aria-label when saved", () => {
    render(<RecipeCard {...defaultProps} savedIds={new Set(["r1"])} />);
    expect(screen.getByLabelText("Remove from saved")).toBeInTheDocument();
  });
});
