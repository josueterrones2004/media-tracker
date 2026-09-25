import { getSeriesDetails } from "@/lib/tmdb";

import SeriesActions from "./SeriesActions";
import Seasons from "./Seasons";

type Genre = {
  id: number;
  name: string;
};

type Season = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path?: string | null;
};

type SeriesDetails = {
  id: number;

  name: string;
  original_name?: string;

  overview?: string;

  poster_path?: string | null;
  backdrop_path?: string | null;

  first_air_date?: string;

  number_of_seasons?: number;
  number_of_episodes?: number;

  genres?: Genre[];

  seasons?: Season[];
};

interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SeriesDetailsPage({
  params,
}: SeriesPageProps) {
  const { id } = await params;

  const show =
    (await getSeriesDetails(
      id
    )) as SeriesDetails;

  const year =
    show.first_air_date?.slice(0, 4);

  const backdrop = show.backdrop_path
    ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
    : null;

  const poster = show.poster_path
    ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
    : null;

  return (
    <main className="pb-16">
      {/* BANNER */}
      {backdrop && (
        <div className="relative -mx-8 -mt-8 h-[290px] overflow-hidden lg:-mx-10">
          <img
            src={backdrop}
            alt=""
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/20 to-black" />
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div
        className={`grid items-start gap-8 md:grid-cols-[260px_minmax(0,1fr)] ${
          backdrop
            ? "-mt-14 relative z-10"
            : ""
        }`}
      >
        {/* PORTADA */}
        <div className="self-start shrink-0">
          {poster ? (
            <img
              src={poster}
              alt={show.name}
              className="aspect-[2/3] w-full max-w-[260px] rounded-2xl object-cover shadow-2xl"
            />
          ) : (
            <div className="flex aspect-[2/3] w-full max-w-[260px] items-center justify-center rounded-2xl bg-zinc-900 text-zinc-500">
              Sin imagen
            </div>
          )}
        </div>

        {/* DERECHA */}
        <div className="min-w-0">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
            {show.name}
          </h1>

          {/* INFO */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500">
            {year && (
              <span>{year}</span>
            )}

            {show.number_of_seasons !==
              undefined && (
              <span>
                {show.number_of_seasons}{" "}
                {show.number_of_seasons === 1
                  ? "temporada"
                  : "temporadas"}
              </span>
            )}

            {show.number_of_episodes !==
              undefined && (
              <span>
                {show.number_of_episodes}{" "}
                episodios
              </span>
            )}
          </div>

          {/* GENEROS */}
          {show.genres &&
            show.genres.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {show.genres.map(
                  (genre) => (
                    <span
                      key={genre.id}
                      className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300"
                    >
                      {genre.name}
                    </span>
                  )
                )}
              </div>
            )}

          {/* SINOPSIS */}
          <p className="mt-7 max-w-4xl text-base leading-7 text-zinc-300">
            {show.overview ||
              "Sin descripción disponible."}
          </p>

          {/* ACCIONES */}
          <SeriesActions show={show} />

          {/* TEMPORADAS / EPISODIOS */}
          <Seasons
            seriesId={show.id}
            seriesTitle={show.name}
            posterPath={show.poster_path}
            seasons={
              show.seasons ?? []
            }
          />
        </div>
      </div>
    </main>
  );
}