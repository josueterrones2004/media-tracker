import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  Users,
} from "lucide-react";

import {
  notFound,
  redirect,
} from "next/navigation";

import FollowButton from "@/app/social/FollowButton";
import { createClient } from "@/lib/supabase/server";

interface ConnectionsPageProps {
  params: Promise<{
    username: string;
  }>;

  searchParams: Promise<{
    tab?: string;
    page?: string;
  }>;
}

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type Connection = {
  follower_id: string;
  following_id: string;
};

type ConnectionTab =
  | "followers"
  | "following";

const PAGE_SIZE = 20;

export default async function ConnectionsPage({
  params,
  searchParams,
}: ConnectionsPageProps) {
  const { username } = await params;

  const query = await searchParams;

  const activeTab: ConnectionTab =
    query.tab === "following"
      ? "following"
      : "followers";

  const requestedPage = Number(
    query.page ?? "1"
  );

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  /* PROFILE */

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      display_name,
      avatar_url
    `)
    .eq("username", username)
    .maybeSingle();

  if (profileError) {
    console.error(
      "Error loading profile:",
      profileError
    );

    throw new Error(
      "No se pudo cargar el perfil."
    );
  }

  if (!profile) {
    notFound();
  }

  const selectedProfile =
    profile as Profile;

  const displayName =
    selectedProfile.display_name ??
    selectedProfile.username ??
    "Usuario";

  /* FOLLOW COUNTS */

  const [
    followersResult,
    followingResult,
  ] = await Promise.all([
    supabase
      .from("profile_follows")
      .select("follower_id", {
        count: "exact",
        head: true,
      })
      .eq(
        "following_id",
        selectedProfile.id
      ),

    supabase
      .from("profile_follows")
      .select("following_id", {
        count: "exact",
        head: true,
      })
      .eq(
        "follower_id",
        selectedProfile.id
      ),
  ]);

  if (
    followersResult.error ||
    followingResult.error
  ) {
    console.error(
      "Error loading follow counts:",
      followersResult.error ??
        followingResult.error
    );

    throw new Error(
      "No se pudieron cargar los seguidores."
    );
  }

  const followersCount =
    followersResult.count ?? 0;

  const followingCount =
    followingResult.count ?? 0;

  const activeCount =
    activeTab === "followers"
      ? followersCount
      : followingCount;

  /* PAGINATION */

  const totalPages = Math.max(
    1,
    Math.ceil(
      activeCount / PAGE_SIZE
    )
  );

  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0
      ? Math.min(
          requestedPage,
          totalPages
        )
      : 1;

  const start =
    (page - 1) * PAGE_SIZE;

  const end =
    start + PAGE_SIZE - 1;

  /* CONNECTIONS */

  const connectionColumn =
    activeTab === "followers"
      ? "following_id"
      : "follower_id";

  const {
    data: connectionsData,
    error: connectionsError,
  } = await supabase
    .from("profile_follows")
    .select(`
      follower_id,
      following_id
    `)
    .eq(
      connectionColumn,
      selectedProfile.id
    )
    .order("created_at", {
      ascending: false,
    })
    .range(start, end);

  if (connectionsError) {
    console.error(
      "Error loading connections:",
      connectionsError
    );

    throw new Error(
      "No se pudo cargar la lista de usuarios."
    );
  }

  const connections =
    (connectionsData ?? []) as Connection[];

  const profileIds = connections.map(
    (connection) =>
      activeTab === "followers"
        ? connection.follower_id
        : connection.following_id
  );

  /* USER PROFILES */

  let connectedProfiles: Profile[] = [];

  if (profileIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        username,
        display_name,
        avatar_url
      `)
      .in("id", profileIds);

    if (error) {
      console.error(
        "Error loading connected profiles:",
        error
      );

      throw new Error(
        "No se pudieron cargar los usuarios."
      );
    }

    const profilesById =
      new Map<string, Profile>(
        ((data ?? []) as Profile[]).map(
          (connectedProfile) => [
            connectedProfile.id,
            connectedProfile,
          ]
        )
      );

    connectedProfiles = profileIds
      .map((id) =>
        profilesById.get(id)
      )
      .filter(
        (connectedProfile):
          connectedProfile is Profile =>
            connectedProfile !== undefined
      );
  }

  /* CURRENT USER'S FOLLOWING STATUS */

  const followingIds =
    new Set<string>();

  const otherProfileIds =
    connectedProfiles
      .filter(
        (connectedProfile) =>
          connectedProfile.id !== user.id
      )
      .map(
        (connectedProfile) =>
          connectedProfile.id
      );

  if (otherProfileIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from("profile_follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .in(
        "following_id",
        otherProfileIds
      );

    if (error) {
      console.error(
        "Error loading current follow status:",
        error
      );

      throw new Error(
        "No se pudo comprobar a quién sigues."
      );
    }

    for (const connection of data ?? []) {
      followingIds.add(
        connection.following_id
      );
    }
  }

  const profilePath =
    `/profile/${encodeURIComponent(username)}`;

  const connectionsPath =
    `${profilePath}/connections`;

  return (
    <main className="mx-auto max-w-4xl pb-20">
      {/* BACK TO PROFILE */}

      <Link
        href={profilePath}
        className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-200"
      >
        <ArrowLeft size={16} />

        Volver al perfil
      </Link>

      {/* HEADER */}

      <div className="mt-7">
        <h1 className="text-3xl font-bold text-zinc-100">
          Conexiones
        </h1>

        <p className="mt-2 text-zinc-500">
          Seguidores y seguidos de{" "}
          <span className="text-zinc-300">
            {displayName}
          </span>
        </p>
      </div>

      {/* TABS */}

      <div className="mt-8 flex gap-2 border-b border-zinc-800">
        <Link
          href={`${connectionsPath}?tab=followers`}
          aria-current={
            activeTab === "followers"
              ? "page"
              : undefined
          }
          className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === "followers"
              ? "border-fuchsia-500 text-fuchsia-300"
              : "border-transparent text-zinc-500 hover:text-zinc-200"
          }`}
        >
          Seguidores{" "}
          <span className="ml-1 text-zinc-500">
            {followersCount}
          </span>
        </Link>

        <Link
          href={`${connectionsPath}?tab=following`}
          aria-current={
            activeTab === "following"
              ? "page"
              : undefined
          }
          className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === "following"
              ? "border-fuchsia-500 text-fuchsia-300"
              : "border-transparent text-zinc-500 hover:text-zinc-200"
          }`}
        >
          Siguiendo{" "}
          <span className="ml-1 text-zinc-500">
            {followingCount}
          </span>
        </Link>
      </div>

      {/* USERS */}

      {connectedProfiles.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 px-5 py-12 text-center">
          <Users
            size={30}
            className="mx-auto text-zinc-600"
          />

          <p className="mt-4 text-sm text-zinc-500">
            {activeTab === "followers"
              ? "Este usuario todavía no tiene seguidores."
              : "Este usuario todavía no sigue a nadie."}
          </p>
        </div>
      ) : (
        <div className="mt-5 divide-y divide-zinc-800">
          {connectedProfiles.map(
            (connectedProfile) => {
              const connectedName =
                connectedProfile.display_name ??
                connectedProfile.username ??
                "Usuario";

              const isCurrentUser =
                connectedProfile.id === user.id;

              return (
                <div
                  key={connectedProfile.id}
                  className="flex items-center gap-4 py-4"
                >
                  {/* AVATAR */}

                  <Link
                    href={
                      connectedProfile.username
                        ? `/profile/${encodeURIComponent(
                            connectedProfile.username
                          )}`
                        : "/profile"
                    }
                    className="shrink-0"
                  >
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
                      {connectedProfile.avatar_url ? (
                        <Image
                          src={
                            connectedProfile.avatar_url
                          }
                          alt={connectedName}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-semibold text-zinc-400">
                          {connectedName
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* USER INFORMATION */}

                  <div className="min-w-0 flex-1">
                    <Link
                      href={
                        connectedProfile.username
                          ? `/profile/${encodeURIComponent(
                              connectedProfile.username
                            )}`
                          : "/profile"
                      }
                      className="block truncate font-medium text-zinc-100 hover:text-fuchsia-300"
                    >
                      {connectedName}
                    </Link>

                    {connectedProfile.username && (
                      <p className="truncate text-sm text-zinc-500">
                        @{connectedProfile.username}
                      </p>
                    )}
                  </div>

                  {/* FOLLOW BUTTON */}

                  {!isCurrentUser && (
                    <FollowButton
                      currentUserId={user.id}
                      targetUserId={
                        connectedProfile.id
                      }
                      initialFollowing={
                        followingIds.has(
                          connectedProfile.id
                        )
                      }
                    />
                  )}
                </div>
              );
            }
          )}
        </div>
      )}

      {/* PAGINATION */}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between gap-4">
          {page > 1 ? (
            <Link
              href={`${connectionsPath}?tab=${activeTab}&page=${page - 1}`}
              className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
            >
              Anterior
            </Link>
          ) : (
            <span />
          )}

          <span className="text-sm text-zinc-500">
            Página {page} de {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={`${connectionsPath}?tab=${activeTab}&page=${page + 1}`}
              className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
            >
              Siguiente
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </main>
  );
}