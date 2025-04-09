

// import { createClient } from "@supabase/supabase-js";

// // Admin client with service role key (safe for server-side only)
// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY
// );

// export async function GET() {
//   const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

//   if (error) {
//     console.error("Error fetching users:", error);
//     return new Response("❌ Failed to fetch users", { status: 500 });
//   }

//   let created = 0;

//   for (const user of users) {
//     const { data: existing, error: fetchError } = await supabaseAdmin
//       .from("profiles")
//       .select("id")
//       .eq("id", user.id)
//       .single();

//     if (!existing && !fetchError) {
//       await supabaseAdmin.from("profiles").insert({
//         id: user.id,
//         email: user.email,
//         username: "", // optional
//         bio: "",      // optional
//       });
//       created++;
//     }
//   }

//   return new Response(`✅ Backfill complete: ${created} profiles created`, { status: 200 });
// }

// /app/api/backfill-profiles/route.js
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) return new Response("❌ Failed to fetch users", { status: 500 });

  let created = 0;

  for (const user of data.users) {
    const { id } = user;
    const email = user.email ?? null;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", id)
      .single();

    if (!fetchError && existing) {
      // Update if email is currently null
      if (!existing.email && email) {
        await supabaseAdmin
          .from("profiles")
          .update({ email })
          .eq("id", id);
        created++;
      }
    } else if (email) {
      // Insert new row if it doesn't exist
      await supabaseAdmin.from("profiles").insert({
        id,
        email,
        username: "",
        bio: "",
      });
      created++;
    }
  }

  return new Response(`✅ Backfill complete: ${created} profiles updated or created`, {
    status: 200,
  });
}
