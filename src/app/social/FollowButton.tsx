
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { FOLLOW_TABLE } from "@/lib/follows";
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
  const router = useRouter();

  const [supabase] = useState(() =>
    createClient()
  );

  const [following, setFollowing] =
    useState(initialFollowing);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  async function toggleFollow() {
    if (loading) return;

    if (currentUserId === targetUserId) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (
        authError ||
        !user ||
        user.id !== currentUserId
      ) {
        setErrorMessage(
          "Your session has changed. Please sign in again."
        );

        return;
      }

      if (following) {
        const { error } = await supabase
          .from(FOLLOW_TABLE)
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        if (error) {
          throw error;
        }

        setFollowing(false);
      } else {
        const { error } = await supabase
          .from(FOLLOW_TABLE)
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) {
          throw error;
        }

        setFollowing(true);
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Error updating follow:",
        error
      );

      setErrorMessage(
        "Unable to update follow status. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (currentUserId === targetUserId) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleFollow}
        disabled={loading}
        aria-pressed={following}
        className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
          following
            ? "border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            : "bg-fuchsia-500 text-white hover:bg-fuchsia-400"
        }`}
      >
        {loading
          ? "..."
          : following
            ? "Following"
            : "Follow"}
      </button>

      {errorMessage && (
        <p
          role="alert"
          className="max-w-64 text-xs text-red-400"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}