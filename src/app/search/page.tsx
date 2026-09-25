import Link from "next/link";

import { searchTMDB } from "@/lib/tmdb";

import {
  getOpenLibraryCoverUrl,
  getWorkIdFromKey,
  searchBooks,
} from "@/lib/openlibrary";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

type TMDBResult = {
  id: number;
  media_type: "movie" | "tv" | string;

  title?: string;
  name?: string;

  poster_path?: string | null;

  release_date?: string;
  first_air_date?: string;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const { q } = await searchParams;

  const query = q?.trim();

  if (!query) {
    return (
      <main>
        <h1 className="text-3xl font-bold">
          Buscar
        </h1>

        <p className="mt-2 text-zinc-400">
          Escribe algo en el buscador.
        </p>
      </main>
    );
  }

  /*
   * Buscamos en TMDB y Open Library
   * al mismo tiempo.
   */
  const [tmdbData, bookData] =
    await Promise.all([
      searchTMDB(query),
      searchBooks(query),
    ]);

  const mediaResults =
    (tmdbData.results as TMDBResult[]).filter(
      (item) =>
        item.media_type === "movie" ||
        item.media_type === "tv"
    );

  const bookResults =
    bookData.docs.filter(
      (book) =>
        book.key?.startsWith("/works/")
    );

  const hasResults =
    mediaResults.length > 0 ||
    bookResults.length > 0;

  return (
    <main>
      <h1 className="text-3xl font-bold">
        Resultados para: {query}
      </h1>

      {!hasResults ? (
        <p className="mt-6 text-zinc-400">
          No se encontraron resultados.
        </p>
      ) : (
        <>
          {/* PELÍCULAS Y SERIES */}
          {mediaResults.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-zinc-100">
                Películas y series
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {mediaResults.map(
                  (item) => {
                    const isMovie =
                      item.media_type ===
                      "movie";

                    const title = isMovie
                      ? item.title
                      : item.name;

                    const image =
                      item.poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                        : null;

                    const href = isMovie
                      ? `/movies/${item.id}`
                      : `/series/${item.id}`;

                    const year = isMovie
                      ? item.release_date?.slice(
                          0,
                          4
                        )
                      : item.first_air_date?.slice(
                          0,
                          4
                        );

                    return (
                      <Link
                        href={href}
                        key={`${item.media_type}-${item.id}`}
                        className="group block"
                      >
                        <SearchCover
                          image={image}
                          title={
                            title ??
                            "Sin título"
                          }
                        />

                        <div className="mt-3">
                          <h3 className="font-semibold text-zinc-100">
                            {title ??
                              "Sin título"}
                          </h3>

                          <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-500">
                            <span>
                              {isMovie
                                ? "Película"
                                : "Serie"}
                            </span>

                            {year && (
                              <>
                                <span>·</span>
                                <span>
                                  {year}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  }
                )}
              </div>
            </section>
          )}

          {/* LIBROS */}
          {bookResults.length > 0 && (
            <section className="mt-14">
              <h2 className="text-xl font-semibold text-zinc-100">
                Libros
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {bookResults.map(
                  (book) => {
                    const workId =
                      getWorkIdFromKey(
                        book.key
                      );

                    const image =
                      getOpenLibraryCoverUrl(
                        book.cover_i,
                        "L"
                      );

                    const authors =
                      book.author_name
                        ?.slice(0, 2)
                        .join(", ");

                    return (
                      <Link
                        href={`/books/${workId}`}
                        key={book.key}
                        className="group block"
                      >
                        <SearchCover
                          image={image}
                          title={book.title}
                        />

                        <div className="mt-3">
                          <h3 className="font-semibold text-zinc-100">
                            {book.title}
                          </h3>

                          {authors && (
                            <p className="mt-1 line-clamp-1 text-sm text-zinc-400">
                              {authors}
                            </p>
                          )}

                          <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-500">
                            <span>
                              Libro
                            </span>

                            {book.first_publish_year && (
                              <>
                                <span>·</span>

                                <span>
                                  {
                                    book.first_publish_year
                                  }
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  }
                )}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function SearchCover({
  image,
  title,
}: {
  image: string | null;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-transparent bg-zinc-900 transition-colors duration-200 group-hover:border-zinc-400">
      {image ? (
        <img
          src={image}
          alt={title}
          className="aspect-[2/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[2/3] items-center justify-center px-4 text-center text-sm text-zinc-600">
          Sin imagen
        </div>
      )}
    </div>
  );
}