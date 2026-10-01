import Image from "next/image";
import Link from "next/link";

import {
  type ReactNode,
} from "react";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import ProfileActivity from "./ProfileActivity";

type SectionKey =
  | "ACTIVITY"
  | "FAVORITE_MOVIES"
  | "FAVORITE_SERIES"
  | "FAVORITE_BOOKS"
  | "FAVORITE_GAMES";

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "BOOK"
  | "GAME";

type ProfileSection = {
  section_key:
    SectionKey;

  visible:
    boolean;

  position:
    number;
};

export type ProfileFavorite = {
  id: string;

  media_type:
    MediaType;

  external_id:
    string;

  title:
    string;

  cover_url:
    | string
    | null;

  position:
    number;
};

interface ProfileSectionsProps {
  profileUserId:
    string;

  username:
    string;

  sections:
    ProfileSection[];

  favorites:
    ProfileFavorite[];

  includeActivity?:
    boolean;
}

const DEFAULT_SECTIONS: ProfileSection[] =
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

function getMediaHref(
  mediaType:
    MediaType,

  externalId:
    string
) {
  switch (
    mediaType
  ) {
    case "MOVIE":
      return `/movies/${externalId}`;

    case "SERIES":
      return `/series/${externalId}`;

    case "BOOK":
      return `/books/${externalId}`;

    case "GAME":
      return `/games/${externalId}`;
  }
}

function FavoriteMedia({
  favorites,
  mediaType,
}: {
  favorites:
    ProfileFavorite[];

  mediaType:
    MediaType;
}) {
  const filtered =
    favorites
      .filter(
        (
          favorite
        ) =>
          favorite.media_type ===
          mediaType
      )
      .sort(
        (
          a,
          b
        ) =>
          a.position -
          b.position
      )
      .slice(
        0,
        6
      );

  if (
    filtered.length ===
    0
  ) {
    return (
      <p className="text-sm text-zinc-600">
        Todavía no hay favoritos en esta sección.
      </p>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 lg:gap-4">
      {filtered.map(
        (
          favorite
        ) => (
          <Link
            key={
              favorite.id
            }
            href={getMediaHref(
              favorite.media_type,
              favorite.external_id
            )}
            className="group w-[112px] shrink-0 lg:w-[135px]"
          >
            <div className="aspect-[2/3] overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 transition group-hover:border-zinc-600">
              {favorite.cover_url ? (
                <Image
                  src={
                    favorite.cover_url
                  }
                  alt={
                    favorite.title
                  }
                  width={500}
                  height={750}
                  unoptimized={
                    shouldUseOriginalImage(
                      favorite.cover_url
                    )
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-3 text-center text-xs text-zinc-600">
                  Sin portada
                </div>
              )}
            </div>

            <p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-zinc-500 transition group-hover:text-zinc-300 lg:text-sm">
              {
                favorite.title
              }
            </p>
          </Link>
        )
      )}
    </div>
  );
}

function SectionTitle({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div className="mb-4 border-b border-zinc-800 pb-2.5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {
          children
        }
      </h2>
    </div>
  );
}

export default function ProfileSections({
  profileUserId,
  username,
  sections,
  favorites,
  includeActivity = true,
}: ProfileSectionsProps) {
  const effectiveSections =
    sections.length >
    0
      ? sections
      : DEFAULT_SECTIONS;

  const visibleSections =
    effectiveSections
      .filter(
        (
          section
        ) =>
          section.visible &&
          (
            includeActivity ||
            section.section_key !==
              "ACTIVITY"
          )
      )
      .sort(
        (
          a,
          b
        ) =>
          a.position -
          b.position
      );

  return (
    <div className="space-y-10 lg:space-y-12">
      {visibleSections.map(
        (
          section
        ) => {
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
                  <SectionTitle>
                    Actividad reciente
                  </SectionTitle>

                  <ProfileActivity
                    profileUserId={
                      profileUserId
                    }
                    username={
                      username
                    }
                    mode="preview"
                  />
                </section>
              );

            case "FAVORITE_MOVIES":
              return (
                <section
                  key={
                    section.section_key
                  }
                >
                  <SectionTitle>
                    Películas favoritas
                  </SectionTitle>

                  <FavoriteMedia
                    favorites={
                      favorites
                    }
                    mediaType="MOVIE"
                  />
                </section>
              );

            case "FAVORITE_SERIES":
              return (
                <section
                  key={
                    section.section_key
                  }
                >
                  <SectionTitle>
                    Series favoritas
                  </SectionTitle>

                  <FavoriteMedia
                    favorites={
                      favorites
                    }
                    mediaType="SERIES"
                  />
                </section>
              );

            case "FAVORITE_BOOKS":
              return (
                <section
                  key={
                    section.section_key
                  }
                >
                  <SectionTitle>
                    Libros favoritos
                  </SectionTitle>

                  <FavoriteMedia
                    favorites={
                      favorites
                    }
                    mediaType="BOOK"
                  />
                </section>
              );

            case "FAVORITE_GAMES":
              return (
                <section
                  key={
                    section.section_key
                  }
                >
                  <SectionTitle>
                    Juegos favoritos
                  </SectionTitle>

                  <FavoriteMedia
                    favorites={
                      favorites
                    }
                    mediaType="GAME"
                  />
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