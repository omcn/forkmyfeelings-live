"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Supabase appends #access_token=...&type=recovery to the redirect URL.
    // Calling getSession() after page load picks it up automatically from the hash.
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
      } else {
        // Wait briefly for Supabase to parse the hash
        setTimeout(async () => {
          const { data: { session: s2 } } = await supabase.auth.getSession();
          if (s2) setReady(true);
          else setError("Invalid or expired reset link. Please request a new one.");
        }, 800);
      }
    };
    initSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      toast.success("Password updated! Logging you in… 🎉");
      setTimeout(() => router.push("/"), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-gray-900">Set a new password</h1>
          <p className="text-sm text-gray-500 mt-1">Choose something you'll remember.</p>
        </div>

        {error && !ready && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 text-center mb-4">
            {error}
            <br />
            <button
              onClick={() => router.push("/")}
              className="mt-2 text-pink-600 underline text-xs"
            >
              Go back to login
            </button>
          </div>
        )}

        {!ready && !error && (
          <div className="text-center text-gray-400 py-8 animate-pulse">Verifying link…</div>
        )}

        {ready && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="w-full border border-gray-300 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                className="w-full border border-gray-300 px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
            >
              {loading ? "Saving…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
