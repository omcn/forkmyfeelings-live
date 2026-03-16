"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function AuthForm({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (!isLogin) {
      const userId = data?.user?.id || data?.session?.user?.id;
      const userEmail = data?.user?.email || data?.session?.user?.email;
      if (userId && userEmail) {
        await supabase.from("profiles").upsert({ id: userId, email: userEmail, username: "", bio: "" });
      }
    }

    onAuthSuccess?.(data);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
    } else {
      toast.success("Password reset link sent! Check your email 📬");
      setIsForgot(false);
    }
  };

  if (isForgot) {
    return (
      <form
        onSubmit={handleForgot}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-bold text-gray-800">🔑 Reset Password</h2>
        <p className="text-sm text-gray-500">Enter your email and we'll send you a reset link.</p>
        <input
          type="email"
          placeholder="Email"
          className="w-full border border-gray-300 px-3 py-2 rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-semibold py-2 rounded-md"
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
        <p
          className="text-sm text-center text-pink-600 cursor-pointer"
          onClick={() => setIsForgot(false)}
        >
          ← Back to log in
        </p>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleAuth}
      className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4"
    >
      <h2 className="text-xl font-bold text-gray-800">
        {isLogin ? "Log In" : "Sign Up"}
      </h2>

      <input
        type="email"
        placeholder="Email"
        className="w-full border border-gray-300 px-3 py-2 rounded-md"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full border border-gray-300 px-3 py-2 rounded-md"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-semibold py-2 rounded-md"
      >
        {loading ? "Please wait…" : isLogin ? "Log In" : "Sign Up"}
      </button>

      {isLogin && (
        <p
          className="text-sm text-center text-gray-400 cursor-pointer hover:text-pink-500"
          onClick={() => setIsForgot(true)}
        >
          Forgot password?
        </p>
      )}

      <p
        className="text-sm text-center text-pink-600 cursor-pointer"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
      </p>
    </form>
  );
}


