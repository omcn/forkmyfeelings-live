
// import { render, screen, waitFor } from "@testing-library/react";
// import MealSuggestions from "../../components/MealSuggestions";  // Adjusting the path from _Tests_ to components
// import { supabase } from "../../lib/supabaseClient";  // Adjust the import path as needed

// // Mock Supabase methods
// jest.mock("../../lib/supabaseClient", () => ({
//   supabase: {
//     from: jest.fn().mockReturnThis(),
//     select: jest.fn().mockResolvedValue({
//       data: [
//         { id: 1, name: "Chocolate Cake", description: "Yummy chocolate cake", emoji: "🍰", moods: ["sad"] },
//         { id: 2, name: "Spaghetti", description: "Delicious spaghetti", emoji: "🍝", moods: ["happy"] },
//       ],
//       error: null,
//     }),
//     eq: jest.fn().mockReturnThis(),
//     in: jest.fn().mockReturnThis(),
//     order: jest.fn().mockReturnThis(),
//   },
// }));

// describe("MealSuggestions Component", () => {
//   it("fetches and displays meal suggestions based on user's ratings", async () => {
//     const user = { id: "user1" };
//     const selectedMoods = ["sad"]; // Let's assume user is sad

//     // Mock user ratings (For simplicity, let's assume user rated Chocolate Cake 5 stars for 'sad')
//     supabase.from().select.mockResolvedValueOnce({
//       data: [
//         { recipe_id: 1, rating: 5, mood: "sad" }, // User rated Chocolate Cake 5 stars
//       ],
//       error: null,
//     });

//     render(<MealSuggestions user={user} selectedMoods={selectedMoods} />);

//     // Wait for the meal to be rendered
//     await waitFor(() => expect(screen.getByText("Chocolate Cake")).toBeInTheDocument());

//     // Check if the correct meal is displayed based on user's rating
//     expect(screen.getByText("Yummy chocolate cake")).toBeInTheDocument();
//     expect(screen.getByText("🍰")).toBeInTheDocument(); // Emoji check
//   });

//   it("shows suggestions based on global ratings when the user hasn't rated anything", async () => {
//     const user = { id: "user1" };
//     const selectedMoods = ["sad"];

//     // Mock no ratings for the user
//     supabase.from().select.mockResolvedValueOnce({
//       data: [],  // No ratings from the user
//       error: null,
//     });

//     // Mock global ratings (Chocolate Cake is highly rated by others for the 'sad' mood)
//     supabase.from().select.mockResolvedValueOnce({
//       data: [
//         { recipe_id: 1, rating: 5, mood: "sad" }, // Global rating for Chocolate Cake
//       ],
//       error: null,
//     });

//     render(<MealSuggestions user={user} selectedMoods={selectedMoods} />);

//     // Wait for the meal to be rendered
//     await waitFor(() => expect(screen.getByText("Chocolate Cake")).toBeInTheDocument());

//     // Check if the correct meal (Chocolate Cake) is suggested based on global ratings
//     expect(screen.getByText("Yummy chocolate cake")).toBeInTheDocument();
//     expect(screen.getByText("🍰")).toBeInTheDocument(); // Emoji check
//   });

//   it("shows 'No suggestions available' when no meals match the selected moods", async () => {
//     const user = { id: "user1" };
//     const selectedMoods = ["angry"]; // Mood with no recipes rated for it

//     // Mock no ratings for the user and no global ratings for the selected mood
//     supabase.from().select.mockResolvedValueOnce({
//       data: [],  // No ratings for the selected mood
//       error: null,
//     });

//     render(<MealSuggestions user={user} selectedMoods={selectedMoods} />);

//     // Check if the fallback message is displayed
//     await waitFor(() => expect(screen.getByText("No suggestions available based on your mood.")).toBeInTheDocument());
//   });
// });
import React from 'react';  // Ensure React is imported (required for JSX in some versions)
import { render, screen, waitFor } from '@testing-library/react';
import MealSuggestions from '../../components/MealSuggestions';  // Correct path to your component
import { supabase } from '../../lib/supabaseClient';  // Correct path to your supabase client

// Mock Supabase methods
jest.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn(),  // Removed mockResolvedValueOnce here to control each test separately
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  },
}));

describe("MealSuggestions Component", () => {
  it("fetches and displays meal suggestions based on user's ratings", async () => {
    const user = { id: "user1" };
    const selectedMoods = ["sad"]; // Let's assume user is sad

    // Mock user ratings (For simplicity, let's assume user rated Chocolate Cake 5 stars for 'sad')
    supabase.from().select.mockResolvedValueOnce({
      data: [
        { recipe_id: 1, rating: 5, mood: "sad" }, // User rated Chocolate Cake 5 stars
      ],
      error: null,
    });

    render(<MealSuggestions user={user} selectedMoods={selectedMoods} />);

    // Wait for the meal to be rendered
    await waitFor(() => expect(screen.getByText("Chocolate Cake")).toBeInTheDocument());

    // Check if the correct meal is displayed based on user's rating
    expect(screen.getByText("Yummy chocolate cake")).toBeInTheDocument();
    expect(screen.getByText("🍰")).toBeInTheDocument(); // Emoji check
  });

  it("shows suggestions based on global ratings when the user hasn't rated anything", async () => {
    const user = { id: "user1" };
    const selectedMoods = ["sad"];

    // Mock no ratings for the user
    supabase.from().select.mockResolvedValueOnce({
      data: [],  // No ratings from the user
      error: null,
    });

    // Mock global ratings (Chocolate Cake is highly rated by others for the 'sad' mood)
    supabase.from().select.mockResolvedValueOnce({
      data: [
        { recipe_id: 1, rating: 5, mood: "sad" }, // Global rating for Chocolate Cake
      ],
      error: null,
    });

    render(<MealSuggestions user={user} selectedMoods={selectedMoods} />);

    // Wait for the meal to be rendered
    await waitFor(() => expect(screen.getByText("Chocolate Cake")).toBeInTheDocument());

    // Check if the correct meal (Chocolate Cake) is suggested based on global ratings
    expect(screen.getByText("Yummy chocolate cake")).toBeInTheDocument();
    expect(screen.getByText("🍰")).toBeInTheDocument(); // Emoji check
  });

  it("shows 'No suggestions available' when no meals match the selected moods", async () => {
    const user = { id: "user1" };
    const selectedMoods = ["angry"]; // Mood with no recipes rated for it

    // Mock no ratings for the user and no global ratings for the selected mood
    supabase.from().select.mockResolvedValueOnce({
      data: [],  // No ratings for the selected mood
      error: null,
    });

    render(<MealSuggestions user={user} selectedMoods={selectedMoods} />);

    // Check if the fallback message is displayed
    await waitFor(() => expect(screen.getByText("No suggestions available based on your mood.")).toBeInTheDocument());
  });
});
