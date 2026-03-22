// Integration test for FeedOverlay component
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import FeedOverlay from "../app/components/FeedOverlay";

const mockPosts = [
  {
    id: "p1",
    user_id: "u1",
    moods: ["happy"],
    rating: 5,
    created_at: "2024-01-01T10:00:00Z",
    photo_url: "https://example.com/photo1.jpg",
    profiles: { username: "alice", avatar_url: null },
    recipes: { emoji: "🍝", name: "Pasta" },
  },
  {
    id: "p2",
    user_id: "u2",
    moods: ["sad", "tired"],
    rating: 3,
    created_at: "2024-01-01T11:00:00Z",
    photo_url: null,
    profiles: { username: null, avatar_url: null },
    recipes: { emoji: "🍲", name: "Soup" },
  },
  {
    id: "p3",
    user_id: "u3",
    moods: "chill",
    rating: 0,
    created_at: "2024-01-01T12:00:00Z",
    photo_url: "https://example.com/photo3.jpg",
    profiles: { username: "bob", avatar_url: "https://example.com/bob.jpg" },
    recipes: null,
  },
];

const defaultProps = {
  posts: mockPosts,
  feedTab: "all",
  setFeedTab: jest.fn(),
  feedReactions: {},
  reactionCounts: {},
  friendIds: new Set(["u1"]),
  feedRefreshing: false,
  onRefresh: jest.fn(),
  onReact: jest.fn(),
  onClose: jest.fn(),
  isGuest: false,
  onRequireAuth: jest.fn(),
};

describe("FeedOverlay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the title", () => {
    render(<FeedOverlay {...defaultProps} />);
    expect(screen.getByText("📸 Today's Forks")).toBeInTheDocument();
  });

  test("renders all posts in 'all' tab", () => {
    render(<FeedOverlay {...defaultProps} />);
    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("Anonymous Chef")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
  });

  test("filters to friends only in 'friends' tab", () => {
    render(<FeedOverlay {...defaultProps} feedTab="friends" />);
    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.queryByText("@bob")).not.toBeInTheDocument();
    expect(screen.queryByText("Anonymous Chef")).not.toBeInTheDocument();
  });

  test("shows empty state for friends tab with no friend posts", () => {
    render(<FeedOverlay {...defaultProps} feedTab="friends" friendIds={new Set()} />);
    expect(screen.getByText("No friend posts yet today!")).toBeInTheDocument();
  });

  test("shows empty state for all tab with no posts", () => {
    render(<FeedOverlay {...defaultProps} posts={[]} />);
    expect(screen.getByText("No posts yet today!")).toBeInTheDocument();
  });

  test("close button calls onClose", () => {
    render(<FeedOverlay {...defaultProps} />);
    fireEvent.click(screen.getByText("✕ Close"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test("refresh button calls onRefresh", () => {
    render(<FeedOverlay {...defaultProps} />);
    fireEvent.click(screen.getByText("↻ Refresh"));
    expect(defaultProps.onRefresh).toHaveBeenCalled();
  });

  test("shows loading text when refreshing", () => {
    render(<FeedOverlay {...defaultProps} feedRefreshing={true} />);
    expect(screen.getByText("↻ Loading…")).toBeInTheDocument();
  });

  test("tab buttons work", () => {
    render(<FeedOverlay {...defaultProps} />);
    fireEvent.click(screen.getByText("👥 Friends"));
    expect(defaultProps.setFeedTab).toHaveBeenCalledWith("friends");
  });

  test("renders 5 reaction emojis per post", () => {
    render(<FeedOverlay {...defaultProps} />);
    const heartReactions = screen.getAllByLabelText("React with ❤️");
    expect(heartReactions).toHaveLength(3); // one per post
  });

  test("clicking reaction calls onReact", () => {
    render(<FeedOverlay {...defaultProps} />);
    const reactions = screen.getAllByLabelText("React with 😍");
    fireEvent.click(reactions[0]);
    expect(defaultProps.onReact).toHaveBeenCalledWith("p1", "😍");
  });

  test("guest clicking reaction calls onRequireAuth", () => {
    render(<FeedOverlay {...defaultProps} isGuest={true} />);
    const reactions = screen.getAllByLabelText("React with 😍");
    fireEvent.click(reactions[0]);
    expect(defaultProps.onRequireAuth).toHaveBeenCalled();
    expect(defaultProps.onReact).not.toHaveBeenCalled();
  });

  test("shows reaction count when > 0", () => {
    const props = {
      ...defaultProps,
      reactionCounts: { p1: { "😍": 5, "🔥": 2 } },
    };
    render(<FeedOverlay {...props} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("highlights user's own reaction", () => {
    const props = {
      ...defaultProps,
      feedReactions: { p1: "😍" },
    };
    const { container } = render(<FeedOverlay {...props} />);
    // The selected reaction button should have ring-1 class
    const selectedBtn = container.querySelector(".ring-1.ring-pink-300");
    expect(selectedBtn).toBeTruthy();
  });

  test("displays recipe name and emoji", () => {
    render(<FeedOverlay {...defaultProps} />);
    expect(screen.getByText("🍝 Pasta")).toBeInTheDocument();
    expect(screen.getByText("🍲 Soup")).toBeInTheDocument();
  });

  test("shows moods as comma-separated when array", () => {
    render(<FeedOverlay {...defaultProps} />);
    expect(screen.getByText(/sad, tired/)).toBeInTheDocument();
  });

  test("shows moods as string when not array", () => {
    render(<FeedOverlay {...defaultProps} />);
    expect(screen.getByText(/chill/)).toBeInTheDocument();
  });

  test("shows star rating when > 0", () => {
    render(<FeedOverlay {...defaultProps} />);
    // Post p1 has rating 5, post p2 has rating 3
    // Stars should be visible
    expect(screen.getAllByText(/⭐/).length).toBeGreaterThan(0);
  });

  test("shows Anonymous Chef when no username", () => {
    render(<FeedOverlay {...defaultProps} />);
    expect(screen.getByText("Anonymous Chef")).toBeInTheDocument();
  });

  test("renders post photos", () => {
    const { container } = render(<FeedOverlay {...defaultProps} />);
    const images = container.querySelectorAll("img");
    // Avatars + post photos
    expect(images.length).toBeGreaterThan(0);
  });

  test("All and Friends tabs have correct aria roles", () => {
    render(<FeedOverlay {...defaultProps} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
  });
});
