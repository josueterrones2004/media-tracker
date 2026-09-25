import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  searchTMDB,
} from "@/lib/tmdb";

import {
  getOpenLibraryCoverUrl,
  getWorkIdFromKey,
  searchBooks,
} from "@/lib/openlibrary";

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "BOOK";

type TMDBResult = {
  id: number;

  media_type:
    | "movie"
    | "tv"
    | string;

  title?: string;
  name?: string;

  poster_path?: string | null;

  release_date?: string;
  first_air_date?: string;
};

type SearchResult = {
  media_type: MediaType;

  external_id: string;

  title: string;

  cover_url: string | null;

  year: string | null;

  subtitle: string | null;
};

export async function GET(
  request: NextRequest
) {
  const searchParams =
    request.nextUrl.searchParams;

  const query =
    searchParams
      .get("q")
      ?.trim();

  const type =
    searchParams.get(
      "type"
    ) as MediaType | null;

  if (
    !query ||
    query.length < 2
  ) {
    return NextResponse.json({
      results: [],
    });
  }

  if (
    type !== "MOVIE" &&
    type !== "SERIES" &&
    type !== "BOOK"
  ) {
    return NextResponse.json(
      {
        error:
          "Tipo de contenido inválido.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    /*
     * PELÍCULAS Y SERIES
     */
    if (
      type === "MOVIE" ||
      type === "SERIES"
    ) {
      const data =
        await searchTMDB(
          query
        );

      const tmdbResults =
        (
          data.results as
            | TMDBResult[]
            | undefined
        ) ?? [];

      const wantedType =
        type === "MOVIE"
          ? "movie"
          : "tv";

      const results: SearchResult[] =
        tmdbResults
          .filter(
            (item) =>
              item.media_type ===
              wantedType
          )
          .slice(0, 20)
          .map(
            (item) => {
              const isMovie =
                item.media_type ===
                "movie";

              const title =
                isMovie
                  ? item.title
                  : item.name;

              const date =
                isMovie
                  ? item.release_date
                  : item.first_air_date;

              return {
                media_type:
                  type,

                external_id:
                  String(
                    item.id
                  ),

                title:
                  title ??
                  "Sin título",

                cover_url:
                  item.poster_path
                    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                    : null,

                year:
                  date?.slice(
                    0,
                    4
                  ) ??
                  null,

                subtitle:
                  type ===
                  "MOVIE"
                    ? "Película"
                    : "Serie",
              };
            }
          );

      return NextResponse.json({
        results,
      });
    }

    /*
     * LIBROS
     */
    const data =
      await searchBooks(
        query
      );

    const results: SearchResult[] =
      data.docs
        .filter(
          (book) =>
            book.key?.startsWith(
              "/works/"
            )
        )
        .slice(0, 20)
        .map(
          (book) => {
            const workId =
              getWorkIdFromKey(
                book.key
              );

            return {
              media_type:
                "BOOK",

              external_id:
                workId,

              title:
                book.title,

              cover_url:
                getOpenLibraryCoverUrl(
                  book.cover_i,
                  "L"
                ),

              year:
                book.first_publish_year
                  ? String(
                      book.first_publish_year
                    )
                  : null,

              subtitle:
                book.author_name
                  ?.slice(0, 2)
                  .join(", ") ??
                "Libro",
            };
          }
        );

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error(
      "Favorite search error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo realizar la búsqueda.",
      },
      {
        status: 500,
      }
    );
  }
}