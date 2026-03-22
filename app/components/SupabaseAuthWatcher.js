"use client";
import { useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function SupabaseAuthWatcher() {
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "SIGNED_IN") {
          const { data: sessionData } = await supabase.auth.getSession();
          const user = sessionData.session?.user;

          if (!user) return;

          const { data: existing } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();

          if (!existing) {
            await supabase.from("profiles").insert({
              id: user.id,
              email: user.email ?? "",
              username: "",
              bio: "",
            });
          }
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return null;
}
