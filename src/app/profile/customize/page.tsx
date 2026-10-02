import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import ProfileCustomizeEditor from "./ProfileCustomizeEditor";

type SectionKey =
  | "ACTIVITY"
  | "FAVORITE_MOVIES"
  | "FAVORITE_SERIES"
  | "FAVORITE_BOOKS"
  | "FAVORITE_GAMES";

type SectionRow = {
  section_key:
    SectionKey;

  visible:
    boolean;

  position:
    number;
};

export default async function CustomizeProfilePage() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/auth"
    );
  }

  const [
    profileResult,
    sectionsResult,
    favoritesResult,
    activityResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "profiles"
        )
        .select(`
          username,
          display_name,
          bio,
          avatar_url,
          banner_url,
          avatar_crop,
          banner_crop
        `)
        .eq(
          "id",
          user.id
        )
        .single(),

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
          user.id
        )
        .order(
          "position",
          {
            ascending:
              true,
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
          user.id
        )
        .order(
          "position",
          {
            ascending:
              true,
          }
        ),

      supabase
        .from(
          "activity_events"
        )
        .select(`
          id,
          activity_type,
          media_type,
          external_id,
          title,
          cover_url,
          created_at
        `)
        .eq(
          "user_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          6
        ),
    ]);

  if (
    profileResult.error
  ) {
    throw new Error(
      profileResult.error.message
    );
  }

  const defaultSections:
    SectionRow[] =
    [
      {
        section_key:
          "ACTIVITY",

        visible:
          true,

        position:
          1,
      },

      {
        section_key:
          "FAVORITE_MOVIES",

        visible:
          true,

        position:
          2,
      },

      {
        section_key:
          "FAVORITE_SERIES",

        visible:
          true,

        position:
          3,
      },

      {
        section_key:
          "FAVORITE_BOOKS",

        visible:
          true,

        position:
          4,
      },

      {
        section_key:
          "FAVORITE_GAMES",

        visible:
          true,

        position:
          5,
      },
    ];

  const sections =
    sectionsResult.data &&
    sectionsResult.data.length >
      0
      ? (
          sectionsResult.data as SectionRow[]
        )
      : defaultSections;

  return (
    <main className="mx-auto w-full max-w-[1100px] border-x-0 border-zinc-800/80 bg-zinc-950 pb-20 lg:border-x">
      <ProfileCustomizeEditor
        userId={
          user.id
        }
        initialProfile={{
          username:
            profileResult.data.username,

          displayName:
            profileResult.data.display_name,

          bio:
            profileResult.data.bio,

          avatarUrl:
            profileResult.data.avatar_url,

          bannerUrl:
            profileResult.data.banner_url,

          avatarCrop:
            profileResult.data.avatar_crop,

          bannerCrop:
            profileResult.data.banner_crop,
        }}
        initialSections={
          sections
        }
        initialFavorites={
          favoritesResult.data ??
          []
        }
        recentActivity={
          activityResult.data ??
          []
        }
      />
    </main>
  );
}