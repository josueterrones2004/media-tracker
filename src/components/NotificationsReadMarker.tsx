"use client";

import {
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

export default function NotificationsReadMarker() {
  const [supabase] = useState(() =>
    createClient()
  );

  useEffect(() => {
    let cancelled = false;

    async function markNotificationsAsRead() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (
        !user ||
        cancelled
      ) {
        return;
      }

      const { error } =
        await supabase
          .from("notifications")
          .update({
            is_read: true,
          })
          .eq(
            "recipient_id",
            user.id
          )
          .eq(
            "is_read",
            false
          );

      if (error) {
        console.error(
          "Error marking notifications as read:",
          error
        );

        return;
      }

      if (!cancelled) {
        window.dispatchEvent(
          new Event(
            "notifications-read"
          )
        );
      }
    }

    markNotificationsAsRead();

    return () => {
      cancelled = true;
    };
  }, [
    supabase,
  ]);

  return null;
}