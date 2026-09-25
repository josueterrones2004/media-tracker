import { shouldUseOriginalImage } from "@/lib/image-optimization";
import Image from "next/image";
import Link from "next/link";

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "BOOK"
  | "GAME";

export type ProfileFavorite = {
  id: string;
  media_type: MediaType;
  external_id: string;
  title: string;
  cover_url: string | null;
  position: number;
};

interface ProfileFavoritesProps {
  favorites: ProfileFavorite[];
  mediaType: MediaType;
}

function getHref(
  mediaType: MediaType,
  externalId: string
) {
  switch (mediaType) {
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

export default function ProfileFavorites({
  favorites,
  mediaType,
}: ProfileFavoritesProps) {
  const filtered =
    favorites
      .filter(
        (favorite) =>
          favorite.media_type ===
          mediaType
      )
      .sort(
        (a, b) =>
          a.position -
          b.position
      )
      .slice(0, 6);

  if (
    filtered.length === 0
  ) {
    return (
      <p className="text-sm text-zinc-600">
        Todavía no hay favoritos en esta sección.
      </p>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {filtered.map(
        (favorite) => (
          <Link
            key={
              favorite.id
            }
            href={getHref(
              favorite.media_type,
              favorite.external_id
            )}
            className="group w-[140px] shrink-0"
          >
            <div className="aspect-[2/3] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition group-hover:border-zinc-600">
              {favorite.cover_url ? (
                <Image
                  src={
                    favorite.cover_url
                  }
                  alt={
                    favorite.title
                  }
                  className="h-full w-full object-cover"
                
          width={500}
          height={750}
          unoptimized={shouldUseOriginalImage(favorite.cover_url)}
        />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-zinc-600">
                  Sin portada
                </div>
              )}
            </div>

            <p className="mt-2 line-clamp-2 text-sm font-medium text-zinc-300">
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