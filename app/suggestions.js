/// pages/suggestions.js
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import MealSuggestions from "../components/MealSuggestions";  // You can create a dedicated component for suggestions

export default function SuggestionsPage() {
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [user, setUser] = useState(null);

  // Fetch user session and update the user state
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUser(session.user);
    };

    fetchUser();
  }, []);

  return (
    <div>
      <h1>Meal Suggestions Based on Your Mood</h1>
      <MealSuggestions user={user} selectedMoods={selectedMoods} setSelectedMoods={setSelectedMoods} />
    </div>
  );
}

