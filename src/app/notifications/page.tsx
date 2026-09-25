import Link from "next/link";

import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import NotificationsReadMarker from "@/components/NotificationsReadMarker";
import { createClient } from "@/lib/supabase/server";

type NotificationType =
  | "FOLLOW"
  | "ACTIVITY_LIKE"
  | "ACTIVITY_COMMENT";

type Notification = {
  id: string;
  actor_id: string;
  type: NotificationType;
  activity_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type Activity = {
  id: string;

  media_type:
    | "MOVIE"
    | "SERIES"
    | "BOOK"
    | "GAME";

  external_id: string;
  title: string;
};

type ActivityComment = {
  id: string;
  content: string;
};

function formatDate(
  date: string
) {
  return new Intl.DateTimeFormat(
    "es-MX",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    new Date(date)
  );
}

function getMediaHref(
  activity: Activity
) {
  if (
    activity.media_type ===
    "MOVIE"
  ) {
    return `/movies/${activity.external_id}`;
  }

  if (
    activity.media_type ===
    "SERIES"
  ) {
    return `/series/${activity.external_id}`;
  }

  if (
    activity.media_type ===
    "BOOK"
  ) {
    return `/books/${activity.external_id}`;
  }

  return `/games/${activity.external_id}`;
}

export default async function NotificationsPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  /* NOTIFICATIONS */

  const {
    data,
    error,
  } =
    await supabase
      .from("notifications")
      .select(`
        id,
        actor_id,
        type,
        activity_id,
        comment_id,
        is_read,
        created_at
      `)
      .eq(
        "recipient_id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(50);

  if (error) {
    console.error(
      "Error loading notifications:",
      error
    );
  }

  const notifications =
    (data ?? []) as Notification[];

  /* ACTORS */

  const actorIds = [
    ...new Set(
      notifications.map(
        (notification) =>
          notification.actor_id
      )
    ),
  ];

  let profiles:
    Profile[] = [];

  if (actorIds.length > 0) {
    const {
      data:
        profileData,
      error:
        profileError,
    } =
      await supabase
        .from("profiles")
        .select(`
          id,
          username,
          display_name
        `)
        .in(
          "id",
          actorIds
        );

    if (profileError) {
      console.error(
        "Error loading notification profiles:",
        profileError
      );
    }

    profiles =
      (profileData ??
        []) as Profile[];
  }

  const profilesById =
    new Map(
      profiles.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  /* ACTIVITIES */

  const activityIds = [
    ...new Set(
      notifications
        .filter(
          (notification) =>
            notification.activity_id !==
            null
        )
        .map(
          (notification) =>
            notification.activity_id as string
        )
    ),
  ];

  let activities:
    Activity[] = [];

  if (
    activityIds.length > 0
  ) {
    const {
      data:
        activityData,
      error:
        activityError,
    } =
      await supabase
        .from("activity_events")
        .select(`
          id,
          media_type,
          external_id,
          title
        `)
        .in(
          "id",
          activityIds
        );

    if (activityError) {
      console.error(
        "Error loading notification activities:",
        activityError
      );
    }

    activities =
      (activityData ??
        []) as Activity[];
  }

  const activitiesById =
    new Map(
      activities.map(
        (activity) => [
          activity.id,
          activity,
        ]
      )
    );

  /* COMMENTS */

  const commentIds = [
    ...new Set(
      notifications
        .filter(
          (notification) =>
            notification.comment_id !==
            null
        )
        .map(
          (notification) =>
            notification.comment_id as string
        )
    ),
  ];

  let comments:
    ActivityComment[] = [];

  if (
    commentIds.length > 0
  ) {
    const {
      data:
        commentData,
      error:
        commentError,
    } =
      await supabase
        .from("activity_comments")
        .select(`
          id,
          content
        `)
        .in(
          "id",
          commentIds
        );

    if (commentError) {
      console.error(
        "Error loading notification comments:",
        commentError
      );
    }

    comments =
      (commentData ??
        []) as ActivityComment[];
  }

  const commentsById =
    new Map(
      comments.map(
        (comment) => [
          comment.id,
          comment,
        ]
      )
    );

  return (
    <main className="mx-auto max-w-3xl pb-20">
      <NotificationsReadMarker />

      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3">
          <Bell
            size={26}
            className="text-fuchsia-400"
          />

          <h1 className="text-3xl font-bold">
            Notificaciones
          </h1>
        </div>

        <p className="mt-2 text-zinc-500">
          Aquí aparecerán las novedades relacionadas con tu cuenta.
        </p>
      </div>

      {/* NOTIFICATIONS */}
      {notifications.length ===
      0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 px-6 py-14 text-center">
          <Bell
            size={32}
            className="mx-auto text-zinc-700"
          />

          <p className="mt-4 text-zinc-500">
            Todavía no tienes notificaciones.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800">
          {notifications.map(
            (
              notification,
              index
            ) => {
              const actor =
                profilesById.get(
                  notification.actor_id
                );

              const actorName =
                actor?.display_name ??
                actor?.username ??
                "Usuario";

              const profileHref =
                actor?.username
                  ? `/profile/${encodeURIComponent(
                      actor.username
                    )}`
                  : null;

              const activity =
                notification.activity_id
                  ? activitiesById.get(
                      notification.activity_id
                    )
                  : undefined;

              const comment =
                notification.comment_id
                  ? commentsById.get(
                      notification.comment_id
                    )
                  : undefined;

              const activityHref =
                activity
                  ? getMediaHref(
                      activity
                    )
                  : "/social";

              return (
                <div
                  key={
                    notification.id
                  }
                  className={`flex gap-4 p-5 ${
                    index !==
                    notifications.length -
                      1
                      ? "border-b border-zinc-800"
                      : ""
                  } ${
                    notification.is_read
                      ? "bg-zinc-950"
                      : "bg-fuchsia-500/[0.04]"
                  }`}
                >
                  {/* ICON */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/10 text-fuchsia-300">
                    {notification.type ===
                    "FOLLOW" ? (
                      <UserPlus
                        size={19}
                      />
                    ) : notification.type ===
                      "ACTIVITY_LIKE" ? (
                      <Heart
                        size={19}
                        fill="currentColor"
                      />
                    ) : (
                      <MessageCircle
                        size={19}
                      />
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="min-w-0 flex-1">
                    <p className="leading-6 text-zinc-300">
                      {profileHref ? (
                        <Link
                          href={
                            profileHref
                          }
                          className="font-semibold text-zinc-100 transition hover:text-fuchsia-300"
                        >
                          {
                            actorName
                          }
                        </Link>
                      ) : (
                        <span className="font-semibold text-zinc-100">
                          {
                            actorName
                          }
                        </span>
                      )}

                      {notification.type ===
                      "FOLLOW" ? (
                        <>
                          {" "}
                          te empezó a seguir.
                        </>
                      ) : notification.type ===
                        "ACTIVITY_LIKE" ? (
                        <>
                          {" "}
                          indicó que le gusta tu actividad
                          {activity ? (
                            <>
                              {" "}
                              sobre{" "}
                              <Link
                                href={
                                  activityHref
                                }
                                className="font-medium text-zinc-100 transition hover:text-fuchsia-300"
                              >
                                {
                                  activity.title
                                }
                              </Link>
                              .
                            </>
                          ) : (
                            "."
                          )}
                        </>
                      ) : (
                        <>
                          {" "}
                          comentó en tu actividad
                          {activity ? (
                            <>
                              {" "}
                              sobre{" "}
                              <Link
                                href={
                                  activityHref
                                }
                                className="font-medium text-zinc-100 transition hover:text-fuchsia-300"
                              >
                                {
                                  activity.title
                                }
                              </Link>
                              .
                            </>
                          ) : (
                            "."
                          )}
                        </>
                      )}
                    </p>

                    {notification.type ===
                      "ACTIVITY_COMMENT" &&
                      comment && (
                        <p className="mt-2 line-clamp-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-400">
                          “{comment.content}”
                        </p>
                      )}

                    <p className="mt-2 text-sm text-zinc-600">
                      {formatDate(
                        notification.created_at
                      )}
                    </p>
                  </div>

                  {/* UNREAD */}
                  {!notification.is_read && (
                    <div
                      className="mt-2 h-2 w-2 shrink-0 rounded-full bg-fuchsia-400"
                      aria-label="Notificación sin leer"
                    />
                  )}
                </div>
              );
            }
          )}
        </div>
      )}
    </main>
  );
}