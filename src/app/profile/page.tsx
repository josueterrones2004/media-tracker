import Link from "next/link";
import { Settings2 } from "lucide-react";
import { redirect } from "next/navigation";

import { FOLLOW_TABLE } from "@/lib/follows";
import { createClient } from "@/lib/supabase/server";

import CroppedProfileImage, {
  ProfileCrop,
} from "./CroppedProfileImage";

import ProfileMediaHeader from "./ProfileMediaHeader";
import ProfileSections from "./ProfileSections";

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

export default async function ProfilePage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const [
    profileResult,
    sectionsResult,
    favoritesResult,
    followersResult,
    followingResult,
  ] = await Promise.all([
    supabase
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
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("profile_sections")
      .select(`
        section_key,
        visible,
        position
      `)
      .eq(
        "user_id",
        user.id
      )
      .order(
        "position",
        {
          ascending: true,
        }
      ),

    supabase
      .from("profile_favorites")
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
        user.id
      )
      .order(
        "position",
        {
          ascending: true,
        }
      ),

    supabase
      .from(FOLLOW_TABLE)
      .select(
        "follower_id",
        {
          count: "exact",
          head: true,
        }
      )
      .eq(
        "following_id",
        user.id
      ),

    supabase
      .from(FOLLOW_TABLE)
      .select(
        "following_id",
        {
          count: "exact",
          head: true,
        }
      )
      .eq(
        "follower_id",
        user.id
      ),
  ]);

  if (
    profileResult.error
  ) {
    console.error(
      "Error loading profile:",
      profileResult.error
    );
  }

  if (
    sectionsResult.error
  ) {
    console.error(
      "Error loading profile sections:",
      sectionsResult.error
    );
  }

  if (
    favoritesResult.error
  ) {
    console.error(
      "Error loading profile favorites:",
      favoritesResult.error
    );
  }

  if (
    followersResult.error
  ) {
    console.error(
      "Error loading followers count:",
      followersResult.error
    );
  }

  if (
    followingResult.error
  ) {
    console.error(
      "Error loading following count:",
      followingResult.error
    );
  }

  const typedProfile =
    profileResult.data as
      | Profile
      | null;

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

  const followersCount =
    followersResult.count ??
    0;

  const followingCount =
    followingResult.count ??
    0;

  const displayName =
    typedProfile?.display_name ??
    typedProfile?.username ??
    "Usuario";

  const username =
    typedProfile?.username;

  return (
    <main className="pb-16">
      <ProfileMediaHeader
        banner={
          typedProfile?.banner_url ? (
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
          typedProfile?.avatar_url ? (
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
        {/* ACCIONES */}
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href="/profile/customize"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
          >
            <Settings2
              size={16}
            />

            Personalizar perfil
          </Link>

          {username && (
            <Link
              href={`/profile/${username}`}
              className="inline-flex items-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              Ver perfil público
            </Link>
          )}
        </div>

        {/* INFORMACIÓN */}
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[clamp(24px,5vw,30px)] font-bold leading-tight text-zinc-100">
              {displayName}
            </h1>

            {typedProfile?.special_role ===
              "OWNER" && (
              <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-xs font-medium text-fuchsia-300">
                Owner
              </span>
            )}

            {typedProfile?.special_role ===
              "BETA_TESTER" && (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400">
                Beta Tester
              </span>
            )}
          </div>

          {username && (
            <p className="mt-1 text-zinc-500">
              @{username}
            </p>
          )}

          {typedProfile?.bio ? (
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

          {/* SEGUIDORES / SIGUIENDO */}
          {username && (
            <div className="mt-6 flex items-center gap-6">
              <Link
                href={`/profile/${username}/connections?tab=followers`}
                className="group"
              >
                <span className="font-semibold text-zinc-100 group-hover:text-white">
                  {
                    followersCount
                  }
                </span>

                <span className="ml-1.5 text-zinc-500 group-hover:text-zinc-300">
                  Seguidores
                </span>
              </Link>

              <Link
                href={`/profile/${username}/connections?tab=following`}
                className="group"
              >
                <span className="font-semibold text-zinc-100 group-hover:text-white">
                  {
                    followingCount
                  }
                </span>

                <span className="ml-1.5 text-zinc-500 group-hover:text-zinc-300">
                  Siguiendo
                </span>
              </Link>
            </div>
          )}
        </div>
      </ProfileMediaHeader>

      {/* SECCIONES CONFIGURABLES */}
      {username && (
        <ProfileSections
          profileUserId={
            user.id
          }
          username={
            username
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