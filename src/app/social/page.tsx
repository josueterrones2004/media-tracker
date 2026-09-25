import { shouldUseOriginalImage } from "@/lib/image-optimization";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FOLLOW_TABLE } from "@/lib/follows";
import { createClient } from "@/lib/supabase/server";
import ActivityComments from "./ActivityComments";
import ActivityLikeButton from "./ActivityLikeButton";
import FollowButton from "./FollowButton";
import SocialReviewModal from "./SocialReviewModal";

interface SocialPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;

  special_role:
    | "OWNER"
    | "BETA_TESTER"
    | null;
};

type Follow = {
  following_id: string;
};

type ActivityEvent = {
  id: string;

  user_id: string;

  activity_type:
    | "ADDED_PENDING"
    | "STARTED"
    | "EPISODE_WATCHED"
    | "COMPLETED"
    | "REVIEWED";

  media_type:
    | "MOVIE"
    | "SERIES"
    | "GAME"
    | "BOOK";

  external_id: string;

  title: string;

  cover_url: string | null;

  review_id: string | null;

  episode_watch_id:
    | string
    | null;

  season_number:
    | number
    | null;

  episode_number:
    | number
    | null;

  episode_title:
    | string
    | null;

  created_at: string;
};

type Review = {
  id: string;

  media_type:
    | "MOVIE"
    | "SERIES"
    | "GAME"
    | "BOOK";

  external_id: string;

  title: string;

  review_text: string;

  liked: boolean;

  experience:
    | "FIRST_TIME"
    | "REWATCH"
    | "REPLAY"
    | "REREAD";

  contains_spoilers: boolean;

  show_consumed_date: boolean;

  consumed_at: string;

  cover_url: string | null;

  release_year: number | null;
};

type ActivityLike = {
  activity_id: string;
  user_id: string;
};

function getDisplayName(
  profile:
    | Profile
    | undefined
) {
  return (
    profile?.display_name ??
    profile?.username ??
    "Usuario"
  );
}

function getInitial(
  profile:
    | Profile
    | undefined
) {
  return getDisplayName(profile)
    .slice(0, 1)
    .toUpperCase();
}

function getMediaHref(
  mediaType:
    ActivityEvent["media_type"],
  externalId: string
) {
  if (
    mediaType === "MOVIE"
  ) {
    return `/movies/${externalId}`;
  }

  if (
    mediaType === "SERIES"
  ) {
    return `/series/${externalId}`;
  }

  if (
    mediaType === "BOOK"
  ) {
    return `/books/${externalId}`;
  }

  if (
    mediaType === "GAME"
  ) {
    return `/games/${externalId}`;
  }

  return null;
}

function getActivityText(
  activity: ActivityEvent
) {
  if (
    activity.activity_type ===
    "ADDED_PENDING"
  ) {
    return "añadió a pendientes";
  }

  if (
    activity.activity_type ===
    "STARTED"
  ) {
    if (
      activity.media_type ===
      "SERIES"
    ) {
      return "empezó a ver";
    }

    if (
      activity.media_type ===
      "BOOK"
    ) {
      return "empezó a leer";
    }

    if (
      activity.media_type ===
      "GAME"
    ) {
      return "empezó a jugar";
    }

    return "empezó";
  }

  if (
    activity.activity_type ===
    "EPISODE_WATCHED"
  ) {
    return "vio un episodio de";
  }

  if (
    activity.activity_type ===
    "COMPLETED"
  ) {
    if (
      activity.media_type ===
      "BOOK"
    ) {
      return "terminó de leer";
    }

    if (
      activity.media_type ===
      "GAME"
    ) {
      return "completó";
    }

    return "completó";
  }

  if (
    activity.activity_type ===
    "REVIEWED"
  ) {
    if (
      activity.media_type ===
      "MOVIE"
    ) {
      return "vio";
    }

    if (
      activity.media_type ===
      "SERIES"
    ) {
      return "terminó";
    }

    if (
      activity.media_type ===
      "BOOK"
    ) {
      return "leyó";
    }

    if (
      activity.media_type ===
      "GAME"
    ) {
      return "completó";
    }

    return "escribió una review de";
  }

  return "";
}

function formatActivityDate(
  dateString: string
) {
  const date =
    new Date(dateString);

  const now =
    new Date();

  const difference =
    now.getTime() -
    date.getTime();

  const minutes =
    Math.floor(
      difference /
        (1000 * 60)
    );

  const hours =
    Math.floor(
      difference /
        (1000 *
          60 *
          60)
    );

  if (
    minutes < 1
  ) {
    return "Ahora";
  }

  if (
    minutes < 60
  ) {
    return `Hace ${minutes} min`;
  }

  if (
    hours < 24
  ) {
    return hours === 1
      ? "Hace 1 h"
      : `Hace ${hours} h`;
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function getMediaLabel(
  mediaType:
    ActivityEvent["media_type"]
) {
  if (
    mediaType === "MOVIE"
  ) {
    return "Película";
  }

  if (
    mediaType === "SERIES"
  ) {
    return "Serie";
  }

  if (
    mediaType === "BOOK"
  ) {
    return "Libro";
  }

  if (
    mediaType === "GAME"
  ) {
    return "Juego";
  }

  return "";
}

export default async function SocialPage({
  searchParams,
}: SocialPageProps) {
  const { q } =
    await searchParams;

  const query =
    q?.trim() ?? "";

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  /*
   * PERSONAS QUE SIGUES
   */
  const {
    data: followRows,
    error: followError,
  } =
    await supabase
      .from(FOLLOW_TABLE)
      .select(
        "following_id"
      )
      .eq(
        "follower_id",
        user.id
      );

  if (followError) {
    console.error(
      "Error loading follows:",
      followError
    );
  }

  const follows =
    (followRows ??
      []) as Follow[];

  const followingIds =
    follows.map(
      (follow) =>
        follow.following_id
    );

  const followingSet =
    new Set(
      followingIds
    );

  const feedUserIds = [
    user.id,
    ...followingIds,
  ];

  /*
   * ACTIVIDAD
   */
  const {
    data: activityRows,
    error:
      activityError,
  } =
    await supabase
      .from(
        "activity_events"
      )
      .select(`
        id,
        user_id,
        activity_type,
        media_type,
        external_id,
        title,
        cover_url,
        review_id,
        episode_watch_id,
        season_number,
        episode_number,
        episode_title,
        created_at
      `)
      .in(
        "user_id",
        feedUserIds
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(50);

  if (
    activityError
  ) {
    console.error(
      "Error loading activity:",
      activityError
    );
  }

  const activities =
    (activityRows ??
      []) as ActivityEvent[];

  /*
   * PERFILES DEL FEED
   */
  const profileIds =
    Array.from(
      new Set(
        activities.map(
          (activity) =>
            activity.user_id
        )
      )
    );

  let feedProfiles: Profile[] =
    [];

  if (
    profileIds.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from("profiles")
        .select(`
          id,
          username,
          display_name,
          bio,
          avatar_url,
          special_role
        `)
        .in(
          "id",
          profileIds
        );

    if (error) {
      console.error(
        "Error loading activity profiles:",
        error
      );
    }

    feedProfiles =
      (data ??
        []) as Profile[];
  }

  const profilesById =
    new Map(
      feedProfiles.map(
        (profile) => [
          profile.id,
          profile,
        ]
      )
    );

  /*
   * REVIEWS DEL FEED
   */
  const reviewIds =
    Array.from(
      new Set(
        activities
          .filter(
            (activity) =>
              activity.review_id
          )
          .map(
            (activity) =>
              activity.review_id as string
          )
      )
    );

  let feedReviews: Review[] =
    [];

  if (
    reviewIds.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from("reviews")
        .select(`
          id,
          media_type,
          external_id,
          title,
          review_text,
          liked,
          experience,
          contains_spoilers,
          show_consumed_date,
          consumed_at,
          cover_url,
          release_year
        `)
        .in(
          "id",
          reviewIds
        );

    if (error) {
      console.error(
        "Error loading feed reviews:",
        error
      );
    }

    feedReviews =
      (data ??
        []) as Review[];
  }

  const reviewsById =
    new Map(
      feedReviews.map(
        (review) => [
          review.id,
          review,
        ]
      )
    );

  /*
   * LIKES DE ACTIVIDAD
   */
  const activityIds =
    activities.map(
      (activity) =>
        activity.id
    );

  let activityLikes: ActivityLike[] =
    [];

  if (
    activityIds.length >
    0
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from("activity_likes")
        .select(`
          activity_id,
          user_id
        `)
        .in(
          "activity_id",
          activityIds
        );

    if (error) {
      console.error(
        "Error loading activity likes:",
        error
      );
    }

    activityLikes =
      (data ??
        []) as ActivityLike[];
  }

  const likeCounts =
    new Map<
      string,
      number
    >();

  const likedByCurrentUser =
    new Set<string>();

  for (
    const like of activityLikes
  ) {
    likeCounts.set(
      like.activity_id,
      (
        likeCounts.get(
          like.activity_id
        ) ?? 0
      ) + 1
    );

    if (
      like.user_id ===
      user.id
    ) {
      likedByCurrentUser.add(
        like.activity_id
      );
    }
  }

  /*
   * BUSCADOR
   */
  let profileQuery =
    supabase
      .from("profiles")
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_url,
        special_role
      `)
      .neq(
        "id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(30);

  if (query) {
    profileQuery =
      profileQuery.or(
        `username.ilike.%${query}%,display_name.ilike.%${query}%`
      );
  }

  const {
    data: profiles,
    error:
      profilesError,
  } =
    await profileQuery;

  if (
    profilesError
  ) {
    console.error(
      "Error loading profiles:",
      profilesError
    );
  }

  const users =
    (profiles ??
      []) as Profile[];

  return (
    <main className="mx-auto max-w-4xl pb-20">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">
          Social
        </h1>

        <p className="mt-2 text-zinc-400">
          Mira qué están viendo,
          leyendo y siguiendo tus
          amigos.
        </p>
      </div>

      {/* FEED */}
      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-zinc-100">
            Actividad
          </h2>

          <span className="text-sm text-zinc-600">
            Tú y las personas que
            sigues
          </span>
        </div>

        {activities.length ===
        0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center">
            <p className="text-zinc-400">
              Todavía no hay
              actividad para mostrar.
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              Sigue personas o
              empieza a añadir
              películas, series y
              libros.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {activities.map(
              (
                activity
              ) => {
                const profile =
                  profilesById.get(
                    activity.user_id
                  );

                const displayName =
                  getDisplayName(
                    profile
                  );

                const username =
                  profile?.username;

                const mediaHref =
                  getMediaHref(
                    activity.media_type,
                    activity.external_id
                  );

                const isEpisode =
                  activity.activity_type ===
                  "EPISODE_WATCHED";

                const review =
                  activity.review_id
                    ? reviewsById.get(
                        activity.review_id
                      )
                    : undefined;

                const likeCount =
                  likeCounts.get(
                    activity.id
                  ) ?? 0;

                const initialLiked =
                  likedByCurrentUser.has(
                    activity.id
                  );

                return (
                  <article
                    key={
                      activity.id
                    }
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5"
                  >
                    <div className="flex gap-4">
                      {/* AVATAR */}
                      {username ? (
                        <Link
                          href={`/profile/${username}`}
                          className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-zinc-800"
                        >
                          {profile?.avatar_url ? (
                            <Image
                              src={
                                profile.avatar_url
                              }
                              alt={
                                displayName
                              }
                              width={256}
                              height={256}
                              unoptimized={
                                shouldUseOriginalImage(
                                  profile.avatar_url
                                )
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-semibold text-zinc-500">
                              {getInitial(
                                profile
                              )}
                            </div>
                          )}
                        </Link>
                      ) : (
                        <div className="h-11 w-11 shrink-0 rounded-full bg-zinc-800">
                          <div className="flex h-full w-full items-center justify-center font-semibold text-zinc-500">
                            {getInitial(
                              profile
                            )}
                          </div>
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        {/* USUARIO */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {username ? (
                            <Link
                              href={`/profile/${username}`}
                              className="font-semibold text-zinc-100 transition hover:text-fuchsia-300"
                            >
                              {
                                displayName
                              }
                            </Link>
                          ) : (
                            <span className="font-semibold text-zinc-100">
                              {
                                displayName
                              }
                            </span>
                          )}

                          {profile?.special_role ===
                            "OWNER" && (
                            <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-medium text-fuchsia-300">
                              Owner
                            </span>
                          )}

                          {profile?.special_role ===
                            "BETA_TESTER" && (
                            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">
                              Beta Tester
                            </span>
                          )}

                          <span className="text-sm text-zinc-600">
                            ·
                          </span>

                          <span className="text-sm text-zinc-600">
                            {formatActivityDate(
                              activity.created_at
                            )}
                          </span>
                        </div>

                        {/* ACTIVIDAD */}
                        <p className="mt-2 leading-6 text-zinc-300">
                          <span className="text-zinc-400">
                            {getActivityText(
                              activity
                            )}{" "}
                          </span>

                          {mediaHref &&
                          !isEpisode ? (
                            <Link
                              href={
                                mediaHref
                              }
                              className="font-medium text-zinc-100 transition hover:text-fuchsia-300"
                            >
                              {
                                activity.title
                              }
                            </Link>
                          ) : (
                            <span className="font-medium text-zinc-100">
                              {
                                activity.title
                              }
                            </span>
                          )}
                        </p>

                        {/* REVIEW */}
                        {review ? (
                          <SocialReviewModal
                            review={
                              review
                            }
                          />
                        ) : isEpisode ? (
                          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                            <p className="text-sm font-medium text-zinc-200">
                              T
                              {
                                activity.season_number
                              }{" "}
                              E
                              {
                                activity.episode_number
                              }

                              {activity.episode_title &&
                                ` · ${activity.episode_title}`}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-4 flex gap-4">
                            {activity.cover_url ? (
                              mediaHref ? (
                                <Link
                                  href={
                                    mediaHref
                                  }
                                  className="w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-800"
                                >
                                  <Image
                                    src={
                                      activity.cover_url
                                    }
                                    alt={
                                      activity.title
                                    }
                                    width={500}
                                    height={750}
                                    unoptimized={
                                      shouldUseOriginalImage(
                                        activity.cover_url
                                      )
                                    }
                                    className="aspect-[2/3] w-full object-cover"
                                  />
                                </Link>
                              ) : (
                                <Image
                                  src={
                                    activity.cover_url
                                  }
                                  alt={
                                    activity.title
                                  }
                                  width={500}
                                  height={750}
                                  unoptimized={
                                    shouldUseOriginalImage(
                                      activity.cover_url
                                    )
                                  }
                                  className="aspect-[2/3] w-16 shrink-0 rounded-lg object-cover"
                                />
                              )
                            ) : (
                              <div className="flex aspect-[2/3] w-16 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-center text-[10px] text-zinc-600">
                                Sin portada
                              </div>
                            )}

                            <div className="flex min-w-0 flex-col justify-center">
                              <span className="text-xs uppercase tracking-wide text-zinc-600">
                                {getMediaLabel(
                                  activity.media_type
                                )}
                              </span>

                              {mediaHref ? (
                                <Link
                                  href={
                                    mediaHref
                                  }
                                  className="mt-1 line-clamp-2 font-medium text-zinc-200 transition hover:text-fuchsia-300"
                                >
                                  {
                                    activity.title
                                  }
                                </Link>
                              ) : (
                                <p className="mt-1 line-clamp-2 font-medium text-zinc-200">
                                  {
                                    activity.title
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* LIKE */}
                        <ActivityLikeButton
                          activityId={
                            activity.id
                          }
                          currentUserId={
                            user.id
                          }
                          initialLiked={
                            initialLiked
                          }
                          initialCount={
                            likeCount
                          }
                        />

                        {/* COMENTARIOS */}
                        <ActivityComments
                          activityId={
                            activity.id
                          }
                          currentUserId={
                            user.id
                          }
                        />
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* BUSCAR PERSONAS */}
      <section className="mt-14 border-t border-zinc-800 pt-10">
        <h2 className="text-xl font-semibold text-zinc-100">
          Buscar personas
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Encuentra amigos por
          nombre o usuario.
        </p>

        <form
          method="GET"
          className="mt-6"
        >
          <div className="flex gap-3">
            <input
              type="text"
              name="q"
              defaultValue={
                query
              }
              placeholder="Buscar por nombre o usuario..."
              className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-500"
            />

            <button
              type="submit"
              className="rounded-xl bg-fuchsia-500 px-5 py-3 font-medium text-white transition hover:bg-fuchsia-400"
            >
              Buscar
            </button>
          </div>
        </form>

        <div className="mt-6">
          <h3 className="font-medium text-zinc-300">
            {query
              ? `Resultados para "${query}"`
              : "Personas"}
          </h3>

          {users.length ===
          0 ? (
            <p className="mt-5 text-zinc-500">
              No se encontraron
              usuarios.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {users.map(
                (
                  profile
                ) => {
                  const displayName =
                    getDisplayName(
                      profile
                    );

                  const profileHref =
                    profile.username
                      ? `/profile/${profile.username}`
                      : null;

                  return (
                    <article
                      key={
                        profile.id
                      }
                      className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4"
                    >
                      {profileHref ? (
                        <Link
                          href={
                            profileHref
                          }
                          className="flex min-w-0 flex-1 items-center gap-4"
                        >
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                            {profile.avatar_url ? (
                              <Image
                                src={
                                  profile.avatar_url
                                }
                                alt={
                                  displayName
                                }
                                width={256}
                                height={256}
                                unoptimized={
                                  shouldUseOriginalImage(
                                    profile.avatar_url
                                  )
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-zinc-500">
                                {getInitial(
                                  profile
                                )}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-zinc-100 transition hover:text-fuchsia-300">
                                {
                                  displayName
                                }
                              </h4>

                              {profile.special_role ===
                                "OWNER" && (
                                <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-xs font-medium text-fuchsia-300">
                                  Owner
                                </span>
                              )}

                              {profile.special_role ===
                                "BETA_TESTER" && (
                                <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-400">
                                  Beta Tester
                                </span>
                              )}
                            </div>

                            {profile.username && (
                              <p className="mt-0.5 text-sm text-zinc-500">
                                @
                                {
                                  profile.username
                                }
                              </p>
                            )}

                            {profile.bio && (
                              <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                                {
                                  profile.bio
                                }
                              </p>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                            {profile.avatar_url ? (
                              <Image
                                src={
                                  profile.avatar_url
                                }
                                alt={
                                  displayName
                                }
                                width={256}
                                height={256}
                                unoptimized={
                                  shouldUseOriginalImage(
                                    profile.avatar_url
                                  )
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-zinc-500">
                                {getInitial(
                                  profile
                                )}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-zinc-100">
                              {
                                displayName
                              }
                            </h4>
                          </div>
                        </div>
                      )}

                      <FollowButton
                        currentUserId={
                          user.id
                        }
                        targetUserId={
                          profile.id
                        }
                        initialFollowing={
                          followingSet.has(
                            profile.id
                          )
                        }
                      />
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}