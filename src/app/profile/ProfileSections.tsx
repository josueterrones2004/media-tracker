import ProfileActivity from "./ProfileActivity";

import ProfileFavorites, {
  ProfileFavorite,
} from "./ProfileFavorites";

type SectionKey =
  | "ACTIVITY"
  | "FAVORITE_MOVIES"
  | "FAVORITE_SERIES"
  | "FAVORITE_BOOKS"
  | "FAVORITE_GAMES";

type ProfileSection = {
  section_key: SectionKey;
  visible: boolean;
  position: number;
};

interface ProfileSectionsProps {
  profileUserId: string;
  username: string;

  sections: ProfileSection[];

  favorites: ProfileFavorite[];
}

const DEFAULT_SECTIONS: ProfileSection[] =
  [
    {
      section_key:
        "ACTIVITY",
      visible: true,
      position: 1,
    },
    {
      section_key:
        "FAVORITE_MOVIES",
      visible: true,
      position: 2,
    },
    {
      section_key:
        "FAVORITE_SERIES",
      visible: true,
      position: 3,
    },
    {
      section_key:
        "FAVORITE_BOOKS",
      visible: true,
      position: 4,
    },
    {
      section_key:
        "FAVORITE_GAMES",
      visible: false,
      position: 5,
    },
  ];

export default function ProfileSections({
  profileUserId,
  username,
  sections,
  favorites,
}: ProfileSectionsProps) {
  const effectiveSections =
    sections.length > 0
      ? sections
      : DEFAULT_SECTIONS;

  const visibleSections =
    effectiveSections
      .filter(
        (section) =>
          section.visible
      )
      .sort(
        (a, b) =>
          a.position -
          b.position
      );

  return (
    <div className="mt-10 space-y-12">
      {visibleSections.map(
        (section) => {
          switch (
            section.section_key
          ) {
            case "ACTIVITY":
              return (
                <section
                  key={
                    section.section_key
                  }
                >
                  <h2 className="text-xl font-semibold text-zinc-100">
                    Actividad reciente
                  </h2>

                  <div className="mt-5">
                    <ProfileActivity
                      profileUserId={
                        profileUserId
                      }
                      username={
                        username
                      }
                      mode="preview"
                    />
                  </div>
                </section>
              );

            case "FAVORITE_MOVIES":
              return (
                <section
                  key={
                    section.section_key
                  }
                >
                  <h2 className="text-xl font-semibold text-zinc-100">
                    Películas favoritas
                  </h2>

                  <div className="mt-5">
                    <ProfileFavorites
                      favorites={
                        favorites
                      }
                      mediaType="MOVIE"
                    />
                  </div>
                </section>
              );

            case "FAVORITE_SERIES":
              return (
                <section
                  key={
                    section.section_key
                  }
                >
                  <h2 className="text-xl font-semibold text-zinc-100">
                    Series favoritas
                  </h2>

                  <div className="mt-5">
                    <ProfileFavorites
                      favorites={
                        favorites
                      }
                      mediaType="SERIES"
                    />
                  </div>
                </section>
              );

            case "FAVORITE_BOOKS":
              return (
                <section
                  key={
                    section.section_key
                  }
                >
                  <h2 className="text-xl font-semibold text-zinc-100">
                    Libros favoritos
                  </h2>

                  <div className="mt-5">
                    <ProfileFavorites
                      favorites={
                        favorites
                      }
                      mediaType="BOOK"
                    />
                  </div>
                </section>
              );

            case "FAVORITE_GAMES":
              return (
                <section
                  key={
                    section.section_key
                  }
                >
                  <h2 className="text-xl font-semibold text-zinc-100">
                    Juegos favoritos
                  </h2>

                  <p className="mt-5 text-sm text-zinc-600">
                    Disponible cuando integremos juegos.
                  </p>
                </section>
              );

            default:
              return null;
          }
        }
      )}
    </div>
  );
}