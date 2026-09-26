import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ProfileDetailsEditor from "./ProfileDetailsEditor";
import ProfileFavoritesEditor from "./ProfileFavoritesEditor";
import ProfileSectionsEditor from "./ProfileSectionsEditor";
import UsernameEditor from "./UsernameEditor";

type SectionKey =
  | "ACTIVITY"
  | "FAVORITE_MOVIES"
  | "FAVORITE_SERIES"
  | "FAVORITE_BOOKS"
  | "FAVORITE_GAMES";

type SectionRow = {
  section_key: SectionKey;
  visible: boolean;
  position: number;
};

export default async function CustomizeProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const [
    profileResult,
    sectionsResult,
    favoritesResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(`
        username,
        display_name,
        bio,
        avatar_url,
        banner_url,
        avatar_crop,
        banner_crop
      `)
      .eq("id", user.id)
      .single(),

    supabase
      .from("profile_sections")
      .select(`
        section_key,
        visible,
        position
      `)
      .eq("user_id", user.id)
      .order("position", {
        ascending: true,
      }),

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
      .eq("user_id", user.id)
      .order("media_type", {
        ascending: true,
      })
      .order("position", {
        ascending: true,
      }),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (sectionsResult.error) {
    console.error(
      "Error loading sections:",
      sectionsResult.error
    );
  }

  if (favoritesResult.error) {
    console.error(
      "Error loading favorites:",
      favoritesResult.error
    );
  }

  const profile = profileResult.data;

  const defaultSections: SectionRow[] = [
    {
      section_key: "ACTIVITY",
      visible: true,
      position: 1,
    },
    {
      section_key: "FAVORITE_MOVIES",
      visible: true,
      position: 2,
    },
    {
      section_key: "FAVORITE_SERIES",
      visible: true,
      position: 3,
    },
    {
      section_key: "FAVORITE_BOOKS",
      visible: true,
      position: 4,
    },
    {
      section_key: "FAVORITE_GAMES",
      visible: false,
      position: 5,
    },
  ];

  const sections =
    sectionsResult.data && sectionsResult.data.length > 0
      ? (sectionsResult.data as SectionRow[])
      : defaultSections;

  return (
    <main className="pb-16">
      <div>
        <h1 className="text-3xl font-bold text-zinc-100">
          Personalizar perfil
        </h1>

        <p className="mt-2 text-zinc-500">
          Cambia cómo se ve tu perfil y qué contenido quieres destacar.
        </p>
      </div>

      {/* USERNAME */}

      <section className="mt-10">
        <UsernameEditor
          userId={user.id}
          initialUsername={profile.username}
        />
      </section>

      {/* PROFILE */}

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-100">
          Perfil
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Personaliza tu foto, banner, nombre y biografía.
        </p>

        <div className="mt-5">
          <ProfileDetailsEditor
            userId={user.id}
            initialProfile={{
              username: profile.username,
              displayName: profile.display_name,
              bio: profile.bio,
              avatarUrl: profile.avatar_url,
              bannerUrl: profile.banner_url,
              avatarCrop: profile.avatar_crop,
              bannerCrop: profile.banner_crop,
            }}
          />
        </div>
      </section>

      {/* FAVORITES */}

      <section className="mt-14 border-t border-zinc-900 pt-10">
        <h2 className="text-xl font-semibold text-zinc-100">
          Favoritos
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Busca películas, series o libros y elige hasta seis favoritos por categoría.
        </p>

        <div className="mt-6">
          <ProfileFavoritesEditor
            userId={user.id}
            initialFavorites={favoritesResult.data ?? []}
          />
        </div>
      </section>

      {/* SECTIONS */}

      <section className="mt-14 border-t border-zinc-900 pt-10">
        <h2 className="text-xl font-semibold text-zinc-100">
          Secciones
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          Decide qué aparece en tu perfil y en qué orden.
        </p>

        <div className="mt-6">
          <ProfileSectionsEditor
            userId={user.id}
            initialSections={sections}
          />
        </div>
      </section>
    </main>
  );
}