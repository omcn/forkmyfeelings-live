"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

// Admin emails — add yours here or use a DB role column
const ADMIN_EMAILS = [];

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // "pending" | "approved" | "all"
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user;
      if (!u) { router.push("/"); return; }
      setUser(u);

      // Check admin status: either email is in ADMIN_EMAILS list or profile has is_admin = true
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", u.id).single();
      const admin = profile?.is_admin === true || ADMIN_EMAILS.includes(u.email);
      setIsAdmin(admin);
      if (!admin) { setLoading(false); return; }

      await loadRecipes("pending");
      setLoading(false);
    };
    init();
  }, []);

  const loadRecipes = async (status) => {
    const query = supabase.from("recipes").select("*").order("created_at", { ascending: false });
    const { data, error } = status === "all" ? await query : await query.eq("status", status);
    if (!error) setRecipes(data || []);
  };

  const changeFilter = async (f) => {
    setFilter(f);
    setLoading(true);
    await loadRecipes(f);
    setLoading(false);
  };

  const approve = async (id) => {
    const { error } = await supabase.from("recipes").update({ status: "approved" }).eq("id", id);
    if (error) { toast.error("Failed to approve"); return; }
    toast.success("Recipe approved ✅");
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const reject = async (id) => {
    const { error } = await supabase.from("recipes").update({ status: "rejected" }).eq("id", id);
    if (error) { toast.error("Failed to reject"); return; }
    toast("Recipe rejected", { icon: "🗑️" });
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">You don't have admin access.</p>
        <button onClick={() => router.push("/")} className="bg-pink-500 text-white px-6 py-2 rounded-full font-semibold">← Home</button>
      </div>
    );
  }

  const ingredients = (r) => {
    try { return Array.isArray(r.ingredients) ? r.ingredients : JSON.parse(r.ingredients || "[]"); }
    catch { return []; }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🛠️ Recipe Admin</h1>
        <button onClick={() => router.push("/")} className="text-sm text-pink-600 hover:text-pink-800">← Back</button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {["pending", "approved", "all"].map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${filter === f ? "bg-pink-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">✨</div>
          <p className="font-medium">Nothing to review!</p>
          <p className="text-sm mt-1">All caught up.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recipes.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{r.emoji} {r.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submitted {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold shrink-0 ${r.status === "approved" ? "bg-green-100 text-green-700" : r.status === "rejected" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>
                  {r.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">{r.description}</p>

              {ingredients(r).length > 0 && (
                <details className="mb-3">
                  <summary className="text-xs font-semibold text-gray-500 cursor-pointer">🧂 Ingredients ({ingredients(r).length})</summary>
                  <ul className="mt-1 space-y-0.5 text-xs text-gray-600 list-disc list-inside">
                    {ingredients(r).map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </details>
              )}

              <div className="flex gap-2 mt-3">
                {r.status !== "approved" && (
                  <button
                    onClick={() => approve(r.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl text-sm transition"
                  >
                    ✅ Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    onClick={() => reject(r.id)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded-xl text-sm transition"
                  >
                    🗑️ Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
