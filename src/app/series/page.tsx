import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import ReviewModalCard from "./ReviewModalCard";

type LibrarySeries = {
  id: string;
  external_id: string;
  title: string;
  cover_url: string | null;
  release_year: number | null;
  status: "PENDING" | "IN_PROGRESS";
};

type ReviewRow = {
  id: string;
  external_id: string;
  title: string;
  cover_url: string | null;
  release_year: number | null;

  liked: boolean;
  is_rewatch: boolean;
  contains_spoilers: boolean;

  show_consumed_date: boolean;
  consumed_at: string;

  review_text: string;
  created_at: string;
};

type EpisodeWatchRow = {
  id: string;
  series_id: string;

  season_number: number;
  episode_number: number;

  episode_title: string;

  is_rewatch: boolean;

  watched_at: string;
  created_at: string;
};

type LastEpisode = {
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle: string;
};

export default async function SeriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  /*
   * SERIES EN BIBLIOTECA
   */
  const {
    data: libraryRows,
    error: libraryError,
  } = await supabase
    .from("library_items")
    .select(`
      id,
      external_id,
      title,
      cover_url,
      release_year,
      status
    `)
    .eq("user_id", user.id)
    .eq("media_type", "SERIES")
    .in("status", [
      "PENDING",
      "IN_PROGRESS",
    ])
    .order("updated_at", {
      ascending: false,
    });

  /*
   * REVIEWS DE SERIES COMPLETADAS
   */
  const {
    data: reviews,
    error: reviewsError,
  } = await supabase
    .from("reviews")
    .select(`
      id,
      external_id,
      title,
      cover_url,
      release_year,
      liked,
      is_rewatch,
      contains_spoilers,
      show_consumed_date,
      consumed_at,
      review_text,
      created_at
    `)
    .eq("user_id", user.id)
    .eq("media_type", "SERIES")
    .order("consumed_at", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  /*
   * HISTORIAL DE EPISODIOS
   *
   * Lo ordenamos del más reciente al
   * más antiguo para que luego podamos
   * tomar el primero de cada serie.
   */
  const {
    data: episodeRows,
    error: episodeError,
  } = await supabase
    .from("episode_watches")
    .select(`
      id,
      series_id,
      season_number,
      episode_number,
      episode_title,
      is_rewatch,
      watched_at,
      created_at
    `)
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (
    libraryError ||
    reviewsError ||
    episodeError
  ) {
    console.error(
      "Error loading series:",
      libraryError,
      reviewsError,
      episodeError
    );

    return (
      <main>
        <h1 className="text-3xl font-bold">
          Series
        </h1>

        <p className="mt-4 text-red-400">
          No se pudo cargar tu biblioteca.
        </p>
      </main>
    );
  }

  const library =
    (libraryRows ?? []) as LibrarySeries[];

  const watched =
    (reviews ?? []) as ReviewRow[];

  const episodeWatches =
    (episodeRows ?? []) as EpisodeWatchRow[];

  /*
   * SEPARAMOS VIENDO / PENDIENTES
   */
  const watching = library.filter(
    (show) =>
      show.status === "IN_PROGRESS"
  );

  const pending = library.filter(
    (show) =>
      show.status === "PENDING"
  );

  /*
   * ÚLTIMO EPISODIO POR SERIE
   *
   * Como episodeWatches viene ordenado
   * por created_at DESC, el primer registro
   * que encontramos para una serie es el
   * último episodio marcado.
   */
  const lastEpisodeBySeries =
    new Map<string, LastEpisode>();

  for (const watch of episodeWatches) {
    if (
      lastEpisodeBySeries.has(
        watch.series_id
      )
    ) {
      continue;
    }

    lastEpisodeBySeries.set(
      watch.series_id,
      {
        seasonNumber:
          watch.season_number,

        episodeNumber:
          watch.episode_number,

        episodeTitle:
          watch.episode_title,
      }
    );
  }

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">
          Series
        </h1>

        <p className="mt-2 text-zinc-400">
          Tus series en curso, vistas y pendientes
        </p>
      </div>

      {/* VIENDO */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Viendo
        </h2>

        {watching.length === 0 ? (
          <p className="mt-4 text-zinc-500">
            No estás viendo ninguna serie actualmente.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {watching.map((show) => {
              const lastEpisode =
                lastEpisodeBySeries.get(
                  show.external_id
                );

              return (
                <WatchingSeriesCard
                  key={show.id}
                  show={show}
                  lastEpisode={lastEpisode}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* VISTAS */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold">
          Vistas
        </h2>

        {watched.length === 0 ? (
          <p className="mt-4 text-zinc-500">
            Todavía no has marcado ninguna serie como vista.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {watched.map((review) => (
              <ReviewModalCard
                key={review.id}
                review={review}
              />
            ))}
          </div>
        )}
      </section>

      {/* PENDIENTES */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold">
          Pendientes
        </h2>

        {pending.length === 0 ? (
          <p className="mt-4 text-zinc-500">
            No tienes series pendientes.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {pending.map((show) => (
              <SeriesLibraryCard
                key={show.id}
                show={show}
                label="Pendiente"
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function WatchingSeriesCard({
  show,
  lastEpisode,
}: {
  show: LibrarySeries;
  lastEpisode:
    | LastEpisode
    | undefined;
}) {
  return (
    <Link
      href={`/series/${show.external_id}`}
      className="block"
    >
      <SeriesCover
        title={show.title}
        coverUrl={show.cover_url}
      />

      <div className="mt-3">
        <h3 className="font-semibold text-zinc-100">
          {show.title}
        </h3>

        <div className="mt-1 flex gap-2 text-sm text-zinc-500">
          {show.release_year && (
            <>
              <span>
                {show.release_year}
              </span>

              <span>·</span>
            </>
          )}

          <span>Viendo</span>
        </div>

        {lastEpisode ? (
          <div className="mt-3">
            <p className="text-xs text-zinc-600">
              Último episodio visto
            </p>

            <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
              T{lastEpisode.seasonNumber} E
              {lastEpisode.episodeNumber}
              {" · "}
              {lastEpisode.episodeTitle}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-600">
            Aún no has marcado episodios
          </p>
        )}
      </div>
    </Link>
  );
}

function SeriesLibraryCard({
  show,
  label,
}: {
  show: LibrarySeries;
  label: string;
}) {
  return (
    <Link
      href={`/series/${show.external_id}`}
      className="block"
    >
      <SeriesCover
        title={show.title}
        coverUrl={show.cover_url}
      />

      <div className="mt-3">
        <h3 className="font-semibold text-zinc-100">
          {show.title}
        </h3>

        <div className="mt-1 flex gap-2 text-sm text-zinc-500">
          {show.release_year && (
            <>
              <span>
                {show.release_year}
              </span>

              <span>·</span>
            </>
          )}

          <span>{label}</span>
        </div>
      </div>
    </Link>
  );
}

function SeriesCover({
  title,
  coverUrl,
}: {
  title: string;
  coverUrl: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-transparent bg-zinc-900 transition-colors duration-200 hover:border-zinc-400">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          className="aspect-[2/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[2/3] items-center justify-center bg-zinc-800 px-4 text-center text-zinc-500">
          Sin imagen
        </div>
      )}
    </div>
  );
}