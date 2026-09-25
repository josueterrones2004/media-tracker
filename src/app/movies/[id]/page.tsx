import { getMovieDetails } from "@/lib/tmdb";
import MovieActions from "./MovieActions";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function MoviePage({
  params,
}: Props) {
  const { id } = await params;

  const movie = await getMovieDetails(id);

  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const backdrop = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;

  return (
    <main className="mx-auto max-w-6xl">
      {/* Banner */}
      <div className="relative h-[360px] overflow-hidden rounded-2xl bg-zinc-900">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            className="h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
      </div>

      {/* Portada + información */}
      <div className="relative -mt-20 px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-end">

          <div className="shrink-0">
            {poster ? (
              <img
                src={poster}
                alt={movie.title}
                className="w-56 rounded-xl border-4 border-zinc-950 object-cover shadow-2xl"
              />
            ) : (
              <div className="flex aspect-[2/3] w-56 items-center justify-center rounded-xl bg-zinc-800 text-zinc-500">
                Sin imagen
              </div>
            )}
          </div>

          <div className="pb-4">
            <h1 className="text-4xl font-bold">
              {movie.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-zinc-400">

              {movie.release_date && (
                <span>
                  {movie.release_date.slice(
                    0,
                    4
                  )}
                </span>
              )}

              {movie.runtime > 0 && (
                <>
                  <span>·</span>

                  <span>
                    {movie.runtime} min
                  </span>
                </>
              )}
            </div>

            {movie.genres?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {movie.genres.map(
                  (genre: {
                    id: number;
                    name: string;
                  }) => (
                    <span
                      key={genre.id}
                      className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-zinc-300"
                    >
                      {genre.name}
                    </span>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sinopsis */}
        <section className="mt-10 max-w-3xl">
          <h2 className="text-lg font-semibold">
            Sinopsis
          </h2>

          <p className="mt-3 leading-7 text-zinc-300">
            {movie.overview ||
              "No hay sinopsis disponible."}
          </p>
        </section>

        <MovieActions movie={movie} />
      </div>
    </main>
  );
}