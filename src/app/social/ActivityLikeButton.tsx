"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface ActivityLikeButtonProps {
  activityId: string;
  currentUserId: string;
  initialLiked: boolean;
  initialCount: number;
}

export default function ActivityLikeButton({
  activityId,
  currentUserId,
  initialLiked,
  initialCount,
}: ActivityLikeButtonProps) {
  const [supabase] = useState(() =>
    createClient()
  );

  const [liked, setLiked] =
    useState(initialLiked);

  const [count, setCount] =
    useState(initialCount);

  const [loading, setLoading] =
    useState(false);

  async function toggleLike() {
    if (loading) return;

    setLoading(true);

    if (liked) {
      const { error } =
        await supabase
          .from("activity_likes")
          .delete()
          .eq(
            "activity_id",
            activityId
          )
          .eq(
            "user_id",
            currentUserId
          );

      if (error) {
        console.error(
          "Error removing activity like:",
          error
        );

        setLoading(false);
        return;
      }

      setLiked(false);

      setCount((current) =>
        Math.max(0, current - 1)
      );

      setLoading(false);
      return;
    }

    const { error } =
      await supabase
        .from("activity_likes")
        .insert({
          activity_id:
            activityId,

          user_id:
            currentUserId,
        });

    if (error) {
      console.error(
        "Error creating activity like:",
        error
      );

      setLoading(false);
      return;
    }

    setLiked(true);

    setCount(
      (current) =>
        current + 1
    );

    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={toggleLike}
      disabled={loading}
      className={`mt-4 flex items-center gap-2 text-sm transition ${
        liked
          ? "text-red-500"
          : "text-zinc-500 hover:text-zinc-300"
      } disabled:opacity-50`}
    >
      <Heart
        size={18}
        fill={
          liked
            ? "currentColor"
            : "none"
        }
      />

      <span>
        {count}
      </span>
    </button>
  );
}