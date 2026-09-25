import Link from "next/link";

import {
  notFound,
  redirect,
} from "next/navigation";

import FollowButton from "@/app/social/FollowButton";
import { createClient } from "@/lib/supabase/server";

import CroppedProfileImage, {
  ProfileCrop,
} from "../CroppedProfileImage";

import ProfileMediaHeader from "../ProfileMediaHeader";
import ProfileSections from "../ProfileSections";

interface PublicProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;

  avatar_url: string | null;
  banner_url: string | null;

  avatar_crop: ProfileCrop | null;
  banner_crop: ProfileCrop | null;

  special_role:
    | "OWNER"
    | "BETA_TESTER"
    | null;
};

type SectionKey =
  | "ACTIVITY"
  | "FAVORITE_MOVIES"
  | "FAVORITE_SERIES"
  | "FAVORITE_BOOKS"
  | "FAVORITE_GAMES";

type ProfileSectionRow = {
  section_key: SectionKey;
  visible: boolean;
  position: number;
};

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "BOOK"
  | "GAME";

type ProfileFavoriteRow = {
  id: string;
  media_type: MediaType;
  external_id: string;
  title: string;
  cover_url: string | null;
  position: number;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const {
    username,
  } = await params;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_url,
        banner_url,
        avatar_crop,
        banner_crop,
        special_role
      `)
      .eq(
        "username",
        username
      )
      .maybeSingle();

  if (
    profileError
  ) {
    console.error(
      "Error loading public profile:",
      profileError
    );
  }

  if (!profile) {
    notFound();
  }

  const typedProfile =
    profile as Profile;

  const displayName =
    typedProfile.display_name ??
    typedProfile.username ??
    "Usuario";

  const isOwnProfile =
    typedProfile.id ===
    user.id;

  let initialFollowing =
    false;

  if (!isOwnProfile) {
    const {
      data: follow,
      error:
        followError,
    } =
      await supabase
        .from("follows")
        .select("id")
        .eq(
          "follower_id",
          user.id
        )
        .eq(
          "following_id",
          typedProfile.id
        )
        .maybeSingle();

    if (
      followError
    ) {
      console.error(
        "Error checking follow:",
        followError
      );
    }

    initialFollowing =
      Boolean(follow);
  }

  const [
    followersResult,
    followingResult,
    sectionsResult,
    favoritesResult,
  ] =
    await Promise.all([
      supabase
        .from("follows")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "following_id",
          typedProfile.id
        ),

      supabase
        .from("follows")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "follower_id",
          typedProfile.id
        ),

      supabase
        .from(
          "profile_sections"
        )
        .select(`
          section_key,
          visible,
          position
        `)
        .eq(
          "user_id",
          typedProfile.id
        )
        .order(
          "position",
          {
            ascending: true,
          }
        ),

      supabase
        .from(
          "profile_favorites"
        )
        .select(`
          id,
          media_type,
          external_id,
          title,
          cover_url,
          position
        `)
        .eq(
          "user_id",
          typedProfile.id
        )
        .order(
          "position",
          {
            ascending: true,
          }
        ),
    ]);

  if (
    sectionsResult.error
  ) {
    console.error(
      "Error loading public profile sections:",
      sectionsResult.error
    );
  }

  if (
    favoritesResult.error
  ) {
    console.error(
      "Error loading public profile favorites:",
      favoritesResult.error
    );
  }

  const followersCount =
    followersResult.count ??
    0;

  const followingCount =
    followingResult.count ??
    0;

  const sections =
    (
      sectionsResult.data ??
      []
    ) as ProfileSectionRow[];

  const favorites =
    (
      favoritesResult.data ??
      []
    ) as ProfileFavoriteRow[];

  return (
    <main className="pb-16">
      <ProfileMediaHeader
        banner={
          typedProfile.banner_url ? (
            <CroppedProfileImage
              src={
                typedProfile.banner_url
              }
              crop={
                typedProfile.banner_crop
              }
              alt={`Banner de ${displayName}`}
            />
          ) : null
        }
        avatar={
          typedProfile.avatar_url ? (
            <CroppedProfileImage
              src={
                typedProfile.avatar_url
              }
              crop={
                typedProfile.avatar_crop
              }
              alt={
                displayName
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-zinc-500">
              {displayName
                .slice(
                  0,
                  1
                )
                .toUpperCase()}
            </div>
          )
        }
      >
        {/* ACCIÓN */}
        <div className="flex justify-end">
          {isOwnProfile ? (
            <Link
              href="/profile/customize"
              className="inline-flex rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              Personalizar perfil
            </Link>
          ) : (
            <FollowButton
              currentUserId={
                user.id
              }
              targetUserId={
                typedProfile.id
              }
              initialFollowing={
                initialFollowing
              }
            />
          )}
        </div>

        {/* INFORMACIÓN */}
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[clamp(24px,5vw,30px)] font-bold leading-tight text-zinc-100">
              {displayName}
            </h1>

            {typedProfile.special_role ===
              "OWNER" && (
              <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-xs font-medium text-fuchsia-300">
                Owner
              </span>
            )}

            {typedProfile.special_role ===
              "BETA_TESTER" && (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400">
                Beta Tester
              </span>
            )}
          </div>

          {typedProfile.username && (
            <p className="mt-1 text-zinc-500">
              @
              {
                typedProfile.username
              }
            </p>
          )}

          {typedProfile.bio ? (
            <p className="mt-5 max-w-2xl whitespace-pre-wrap leading-7 text-zinc-300">
              {
                typedProfile.bio
              }
            </p>
          ) : (
            <p className="mt-5 text-zinc-600">
              Sin biografía.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-5 text-sm text-zinc-500">
            <span>
              <strong className="font-semibold text-zinc-200">
                {
                  followingCount
                }
              </strong>{" "}
              Siguiendo
            </span>

            <span>
              <strong className="font-semibold text-zinc-200">
                {
                  followersCount
                }
              </strong>{" "}
              Seguidores
            </span>
          </div>
        </div>
      </ProfileMediaHeader>

      {/* SECCIONES CONFIGURABLES */}
      {typedProfile.username && (
        <ProfileSections
          profileUserId={
            typedProfile.id
          }
          username={
            typedProfile.username
          }
          sections={
            sections
          }
          favorites={
            favorites
          }
        />
      )}
    </main>
  );
}