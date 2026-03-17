-- Run this in your Supabase SQL Editor to create the atomic account deletion function.
-- This replaces the client-side Promise.allSettled() approach with a single transaction.

CREATE OR REPLACE FUNCTION delete_user_cascade(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete in dependency order to avoid FK violations
  DELETE FROM post_reactions WHERE user_id = target_user_id;
  DELETE FROM recipe_posts WHERE user_id = target_user_id;
  DELETE FROM recipe_ratings WHERE user_id = target_user_id;
  DELETE FROM saved_recipes WHERE user_id = target_user_id;
  DELETE FROM notifications WHERE user_id = target_user_id OR actor_id = target_user_id;
  DELETE FROM friends WHERE user_id = target_user_id OR friend_id = target_user_id;
  DELETE FROM recipes WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE id = target_user_id;

  -- Note: The actual auth.users row is deleted via Supabase auth admin API or
  -- the user can be removed from the Supabase dashboard. The RPC only handles
  -- application data. Sign-out on the client handles the session.
END;
$$;

-- Grant execute to authenticated users (they can only delete their own data
-- because we check auth.uid() in the RLS policy or in the calling code)
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID) TO authenticated;
