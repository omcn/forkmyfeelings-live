// Integration test for CookingMode component
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock react-confetti
jest.mock("react-confetti", () => () => null);

// Mock RascalSpaceGlide
jest.mock("../app/components/RascalSpaceGlide", () => () => <div data-testid="space-glide" />);

// Mock MoodSelector (for moodEmojis export)
jest.mock("../app/components/MoodSelector", () => ({
  __esModule: true,
  moodEmojis: {
    tired: "😴", happy: "😊", sad: "😢", rushed: "⏰",
    "date-night": "💘", chill: "🧊", overwhelmed: "😵‍💫",
  },
}));

import CookingMode from "../app/components/CookingMode";

const defaultProps = {
  recipe: {
    name: "Test Pasta",
    emoji: "🍝",
    steps: ["Boil water", "Cook pasta for 10 minutes", "Drain and serve"],
  },
  selectedMoods: ["happy"],
  moodRating: 0,
  setMoodRating: jest.fn(),
  timeLeft: null,
  setTimeLeft: jest.fn(),
  isTiming: false,
  setIsTiming: jest.fn(),
  haptic: jest.fn(),
  windowWidth: 390,
  onDone: jest.fn(),
  onPostCapture: jest.fn(),
  submitRecipeRating: jest.fn(),
};

describe("CookingMode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the cooking video", () => {
    const { container } = render(<CookingMode {...defaultProps} />);
    const video = container.querySelector("video");
    expect(video).toBeTruthy();
    expect(video.src).toContain("rascal-cooking.mp4");
  });

  test("shows current mood", () => {
    render(<CookingMode {...defaultProps} />);
    expect(screen.getByText(/happy/i)).toBeInTheDocument();
  });

  test("shows step 1 of 3", () => {
    render(<CookingMode {...defaultProps} />);
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Boil water")).toBeInTheDocument();
  });

  test("Back button is disabled on first step", () => {
    render(<CookingMode {...defaultProps} />);
    const backBtn = screen.getByText("← Back");
    expect(backBtn).toBeDisabled();
  });

  test("Next button advances to next step", () => {
    render(<CookingMode {...defaultProps} />);
    fireEvent.click(screen.getByText("Next →"));
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Cook pasta for 10 minutes")).toBeInTheDocument();
  });

  test("Back button goes to previous step", () => {
    render(<CookingMode {...defaultProps} />);
    fireEvent.click(screen.getByText("Next →"));
    fireEvent.click(screen.getByText("← Back"));
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  test("shows Done button on last step", () => {
    render(<CookingMode {...defaultProps} />);
    fireEvent.click(screen.getByText("Next →")); // step 2
    fireEvent.click(screen.getByText("Next →")); // step 3
    expect(screen.getByText("Done ✓")).toBeInTheDocument();
  });

  test("shows timer button when step mentions minutes", () => {
    render(<CookingMode {...defaultProps} />);
    fireEvent.click(screen.getByText("Next →")); // step 2: "Cook pasta for 10 minutes"
    expect(screen.getByText(/Start 10-Minute Timer/)).toBeInTheDocument();
  });

  test("no timer button on steps without time", () => {
    render(<CookingMode {...defaultProps} />);
    // Step 1: "Boil water" — no minutes mentioned
    expect(screen.queryByText(/Start.*Timer/)).not.toBeInTheDocument();
  });

  test("calls haptic on Next click", () => {
    render(<CookingMode {...defaultProps} />);
    fireEvent.click(screen.getByText("Next →"));
    expect(defaultProps.haptic).toHaveBeenCalledWith("light");
  });

  test("handles JSON string steps", () => {
    const props = {
      ...defaultProps,
      recipe: {
        ...defaultProps.recipe,
        steps: '["Step A","Step B"]',
      },
    };
    render(<CookingMode {...props} />);
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Step A")).toBeInTheDocument();
  });

  test("handles single step recipe", () => {
    const props = {
      ...defaultProps,
      recipe: { ...defaultProps.recipe, steps: ["Just cook it"] },
    };
    render(<CookingMode {...props} />);
    expect(screen.getByText("Step 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("Done ✓")).toBeInTheDocument();
  });
});

describe("CookingMode rating modal", () => {
  function navigateToRatingModal(props = defaultProps) {
    const result = render(<CookingMode {...props} />);
    fireEvent.click(screen.getByText("Next →"));
    fireEvent.click(screen.getByText("Next →"));
    fireEvent.click(screen.getByText("Done ✓"));
    act(() => { jest.advanceTimersByTime(1500); });
    return result;
  }

  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  test("Done button triggers celebration and rating modal", () => {
    navigateToRatingModal();
    expect(screen.getByText("⭐ Rate This Recipe")).toBeInTheDocument();
  });

  test("submit button is disabled until star is tapped", () => {
    navigateToRatingModal();
    expect(screen.getByText("Tap a star ↑")).toBeDisabled();
  });

  test("submit button shows star count after selection", () => {
    navigateToRatingModal({ ...defaultProps, moodRating: 4 });
    expect(screen.getByText("Submit 4★")).toBeInTheDocument();
    expect(screen.getByText("Submit 4★")).not.toBeDisabled();
  });

  test("Skip button calls onDone and closes modal", () => {
    const onDone = jest.fn();
    navigateToRatingModal({ ...defaultProps, onDone });
    fireEvent.click(screen.getByText("Skip"));
    expect(onDone).toHaveBeenCalled();
  });

  test("5 star buttons are rendered in modal", () => {
    navigateToRatingModal();
    const starButtons = screen.getAllByLabelText(/Rate \d star/);
    expect(starButtons).toHaveLength(5);
  });

  test("tapping a star calls setMoodRating and haptic", () => {
    const setMoodRating = jest.fn();
    const haptic = jest.fn();
    navigateToRatingModal({ ...defaultProps, setMoodRating, haptic });
    fireEvent.click(screen.getByLabelText("Rate 3 stars"));
    expect(setMoodRating).toHaveBeenCalledWith(3);
    expect(haptic).toHaveBeenCalledWith("light");
  });
});
