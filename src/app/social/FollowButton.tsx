"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface FollowButtonProps {
  currentUserId: string;
  targetUserId: string;
  initialFollowing: boolean;
}

export default function FollowButton({
  currentUserId,
  targetUserId,
  initialFollowing,
}: FollowButtonProps) {
  const [supabase] = useState(() =>
    createClient()
  );

  const [following, setFollowing] =
    useState(initialFollowing);

  const [loading, setLoading] =
    useState(false);

  async function toggleFollow() {
    if (loading) return;

    setLoading(true);

    if (following) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq(
          "follower_id",
          currentUserId
        )
        .eq(
          "following_id",
          targetUserId
        );

      if (!error) {
        setFollowing(false);
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({
          follower_id:
            currentUserId,

          following_id:
            targetUserId,
        });

      if (!error) {
        setFollowing(true);
      }
    }

    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={loading}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
        following
          ? "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
          : "bg-fuchsia-500 text-white hover:bg-fuchsia-400"
      }`}
    >
      {loading
        ? "..."
        : following
          ? "Siguiendo"
          : "Seguir"}
    </button>
  );
}