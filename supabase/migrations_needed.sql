-- ============================================================
-- Fork My Feels — New Tables Migration
-- Run these in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Post Reactions
-- Stores one emoji reaction per user per post.
create table if not exists post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references recipe_posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);
alter table post_reactions enable row level security;
create policy "Anyone can read reactions" on post_reactions for select using (true);
create policy "Authenticated users can react" on post_reactions for insert with check (auth.uid() = user_id);
create policy "Users can update their own reaction" on post_reactions for update using (auth.uid() = user_id);
create policy "Users can delete their own reaction" on post_reactions for delete using (auth.uid() = user_id);


-- 2. Saved Recipes
-- Cross-device saved recipes (synced from localStorage).
create table if not exists saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  recipe_id int references recipes(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, recipe_id)
);
alter table saved_recipes enable row level security;
create policy "Users can read their own saved recipes" on saved_recipes for select using (auth.uid() = user_id);
create policy "Users can save recipes" on saved_recipes for insert with check (auth.uid() = user_id);
create policy "Users can unsave recipes" on saved_recipes for delete using (auth.uid() = user_id);


-- 3. Notifications
-- In-app alerts for reactions, friend requests, and acceptances.
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,  -- recipient
  type text not null,                                          -- "reaction" | "friend_request" | "friend_accepted"
  actor_id uuid references auth.users(id) on delete cascade, -- who triggered it
  resource_id text,                                           -- post_id or user_id depending on type
  read boolean default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "Users can read their own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Authenticated users can create notifications" on notifications for insert with check (auth.uid() = actor_id);
create policy "Users can mark their own notifications as read" on notifications for update using (auth.uid() = user_id);

-- Foreign key join alias for notification actor profile (for the select in notifications page)
-- The query uses: .select("*, actor:actor_id(username, avatar_url)")
-- This works automatically because actor_id references auth.users and profiles have matching ids.
-- Make sure your profiles table has RLS allowing public reads of username + avatar_url.
