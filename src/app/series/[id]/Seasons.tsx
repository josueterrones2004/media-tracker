"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type SeasonSummary = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path?: string | null;
};

type Episode = {
  id: number;
  name: string;
  overview?: string;
  episode_number: number;
  season_number: number;
  air_date?: string | null;
  still_path?: string | null;
};

type SeasonDetails = {
  id: number;
  name: string;
  season_number: number;
  episodes: Episode[];
};

type EpisodeWatch = {
  id: string;
  season_number: number;
  episode_number: number;
  is_rewatch: boolean;
  watched_at: string;
  created_at: string;
};

interface SeasonsProps {
  seriesId: number;
  seriesTitle: string;
  posterPath?: string | null;
  seasons: SeasonSummary[];
}

function getToday() {
  const now = new Date();

  const local = new Date(
    now.getTime() -
      now.getTimezoneOffset() * 60_000
  );

  return local.toISOString().slice(0, 10);
}

export default function Seasons({
  seriesId,
  seriesTitle,
  posterPath,
  seasons,
}: SeasonsProps) {
  const [supabase] = useState(() =>
    createClient()
  );

  const visibleSeasons = useMemo(
    () =>
      seasons
        .filter(
          (season) =>
            season.season_number > 0 &&
            season.episode_count > 0
        )
        .sort(
          (a, b) =>
            a.season_number -
            b.season_number
        ),
    [seasons]
  );

  const totalEpisodes = useMemo(
    () =>
      visibleSeasons.reduce(
        (total, season) =>
          total + season.episode_count,
        0
      ),
    [visibleSeasons]
  );

  const [
    selectedSeason,
    setSelectedSeason,
  ] = useState<number | null>(
    visibleSeasons[0]?.season_number ?? null
  );

  const [
    seasonData,
    setSeasonData,
  ] = useState<
    Record<number, SeasonDetails>
  >({});

  const [
    loadingSeason,
    setLoadingSeason,
  ] = useState(false);

  const [watches, setWatches] =
    useState<EpisodeWatch[]>([]);

  const [
    expandedEpisode,
    setExpandedEpisode,
  ] = useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    if (
      selectedSeason === null &&
      visibleSeasons.length > 0
    ) {
      setSelectedSeason(
        visibleSeasons[0].season_number
      );
    }
  }, [
    selectedSeason,
    visibleSeasons,
  ]);

  useEffect(() => {
    async function loadWatches() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } =
        await supabase
          .from("episode_watches")
          .select(`
            id,
            season_number,
            episode_number,
            is_rewatch,
            watched_at,
            created_at
          `)
          .eq("user_id", user.id)
          .eq(
            "series_id",
            String(seriesId)
          )
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Error loading episode watches:",
          error
        );

        return;
      }

      setWatches(data ?? []);
    }

    loadWatches();
  }, [
    seriesId,
    supabase,
  ]);

  useEffect(() => {
    if (selectedSeason === null) {
      return;
    }

    const seasonNumber =
      selectedSeason;

    if (seasonData[seasonNumber]) {
      return;
    }

    async function loadSeason() {
      setLoadingSeason(true);
      setMessage("");

      try {
        const response =
          await fetch(
            `/api/season?seriesId=${seriesId}&seasonNumber=${seasonNumber}`
          );

        if (!response.ok) {
          throw new Error(
            "No se pudo cargar la temporada."
          );
        }

        const data =
          (await response.json()) as SeasonDetails;

        setSeasonData(
          (current) => ({
            ...current,
            [seasonNumber]: data,
          })
        );
      } catch (error) {
        console.error(
          "Error loading season:",
          error
        );

        setMessage(
          "No se pudo cargar la temporada."
        );
      } finally {
        setLoadingSeason(false);
      }
    }

    loadSeason();
  }, [
    selectedSeason,
    seriesId,
    seasonData,
  ]);

  function getEpisodeWatches(
    seasonNumber: number,
    episodeNumber: number
  ) {
    return watches.filter(
      (watch) =>
        watch.season_number ===
          seasonNumber &&
        watch.episode_number ===
          episodeNumber
    );
  }

  function getUniqueEpisodeCount(
    episodeWatches: EpisodeWatch[]
  ) {
    const uniqueEpisodes =
      new Set(
        episodeWatches
          .filter(
            (watch) =>
              watch.season_number > 0
          )
          .map(
            (watch) =>
              `${watch.season_number}-${watch.episode_number}`
          )
      );

    return uniqueEpisodes.size;
  }

  function hasCompletedSeries(
    episodeWatches: EpisodeWatch[]
  ) {
    if (totalEpisodes <= 0) {
      return false;
    }

    return (
      getUniqueEpisodeCount(
        episodeWatches
      ) >= totalEpisodes
    );
  }

  async function markSeriesAsWatching(
    userId: string
  ) {
    const coverUrl =
      posterPath
        ? `https://image.tmdb.org/t/p/w500${posterPath}`
        : null;

    const { error } =
      await supabase
        .from("library_items")
        .upsert(
          {
            user_id: userId,
            media_type: "SERIES",
            external_id:
              String(seriesId),
            title: seriesTitle,
            cover_url: coverUrl,
            status: "IN_PROGRESS",
          },
          {
            onConflict:
              "user_id,media_type,external_id",
          }
        );

    if (error) {
      console.error(
        "Error marking series as watching:",
        error
      );
    }
  }

  async function createEpisodeActivity(
    userId: string,
    episode: Episode,
    episodeWatchId: string,
    coverUrl: string | null
  ) {
    const { error } =
      await supabase
        .from("activity_events")
        .insert({
          user_id: userId,

          activity_type:
            "EPISODE_WATCHED",

          media_type:
            "SERIES",

          external_id:
            String(seriesId),

          title:
            seriesTitle,

          cover_url:
            coverUrl,

          episode_watch_id:
            episodeWatchId,

          season_number:
            episode.season_number,

          episode_number:
            episode.episode_number,

          episode_title:
            episode.name,
        });

    if (error) {
      console.error(
        "Error creating episode activity:",
        error
      );
    }
  }

  async function markEpisodeWatched(
    episode: Episode,
    isRewatch: boolean
  ) {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Debes iniciar sesión."
      );

      return;
    }

    const wasCompleted =
      hasCompletedSeries(watches);

    const stillUrl =
      episode.still_path
        ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
        : null;

    const coverUrl =
      posterPath
        ? `https://image.tmdb.org/t/p/w500${posterPath}`
        : null;

    const { data, error } =
      await supabase
        .from("episode_watches")
        .insert({
          user_id:
            user.id,

          series_id:
            String(seriesId),

          series_title:
            seriesTitle,

          season_number:
            episode.season_number,

          episode_number:
            episode.episode_number,

          episode_id:
            String(episode.id),

          episode_title:
            episode.name,

          series_cover_url:
            coverUrl,

          episode_still_url:
            stillUrl,

          is_rewatch:
            isRewatch,

          watched_at:
            getToday(),
        })
        .select(`
          id,
          season_number,
          episode_number,
          is_rewatch,
          watched_at,
          created_at
        `)
        .single();

    if (error) {
      setMessage(
        error.message
      );

      return;
    }

    if (!data) {
      return;
    }

    /*
     * Crear actividad social del episodio
     */
    await createEpisodeActivity(
      user.id,
      episode,
      data.id,
      coverUrl
    );

    const updatedWatches = [
      data,
      ...watches,
    ];

    setWatches(
      updatedWatches
    );

    /*
     * Ver cualquier episodio pone
     * la serie automáticamente en Viendo.
     */
    await markSeriesAsWatching(
      user.id
    );

    setExpandedEpisode(
      null
    );

    const completedNow =
      hasCompletedSeries(
        updatedWatches
      );

    /*
     * Si justo acabamos de completar
     * todos los episodios, avisamos a
     * SeriesActions para abrir la review.
     */
    if (
      !wasCompleted &&
      completedNow &&
      !isRewatch
    ) {
      setMessage(
        "Has visto todos los episodios."
      );

      window.dispatchEvent(
        new CustomEvent(
          "series-completed",
          {
            detail: {
              seriesId,
            },
          }
        )
      );

      return;
    }

    setMessage(
      isRewatch
        ? "Rewatch del episodio guardado."
        : "Episodio marcado como visto."
    );
  }

  async function removeLatestWatch(
    episode: Episode
  ) {
    const episodeWatches =
      getEpisodeWatches(
        episode.season_number,
        episode.episode_number
      );

    if (
      episodeWatches.length === 0
    ) {
      return;
    }

    const latest =
      episodeWatches[0];

    const { error } =
      await supabase
        .from("episode_watches")
        .delete()
        .eq(
          "id",
          latest.id
        );

    if (error) {
      setMessage(
        error.message
      );

      return;
    }

    setWatches(
      (current) =>
        current.filter(
          (watch) =>
            watch.id !==
            latest.id
        )
    );

    setExpandedEpisode(
      null
    );

    setMessage(
      "Última visualización eliminada."
    );
  }

  const currentSeason =
    selectedSeason !== null
      ? seasonData[
          selectedSeason
        ]
      : undefined;

  if (
    visibleSeasons.length === 0
  ) {
    return null;
  }

  return (
    <section className="mt-14">
      <h2 className="text-2xl font-semibold">
        Temporadas
      </h2>

      {/* TEMPORADAS ARRIBA */}
      <div className="mt-5 overflow-x-auto">
        <div className="flex min-w-max gap-3 border-b border-zinc-800 pb-3">
          {visibleSeasons.map(
            (season) => {
              const active =
                selectedSeason ===
                season.season_number;

              return (
                <button
                  key={
                    season.id
                  }
                  type="button"
                  onClick={() => {
                    setExpandedEpisode(
                      null
                    );

                    setSelectedSeason(
                      season.season_number
                    );
                  }}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}
                >
                  {
                    season.name
                  }
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* EPISODIOS */}
      <div className="mt-6">
        {loadingSeason ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            Cargando episodios...
          </p>
        ) : !currentSeason ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            No se pudieron cargar los episodios.
          </p>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {currentSeason.episodes.map(
              (episode) => {
                const episodeWatches =
                  getEpisodeWatches(
                    episode.season_number,
                    episode.episode_number
                  );

                const watched =
                  episodeWatches.length >
                  0;

                const key =
                  `${episode.season_number}-${episode.episode_number}`;

                const expanded =
                  expandedEpisode ===
                  key;

                return (
                  <article
                    key={
                      episode.id
                    }
                    className="py-5"
                  >
                    <div className="flex gap-5">

                      {/* IMAGEN */}
                      <div className="hidden w-40 shrink-0 overflow-hidden rounded-lg bg-zinc-900 sm:block">
                        {episode.still_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                            alt={
                              episode.name
                            }
                            className="aspect-video w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-video items-center justify-center text-xs text-zinc-600">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      {/* INFO */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                          <div className="min-w-0">
                            <h3 className="font-medium text-zinc-100">
                              {
                                episode.episode_number
                              }
                              .{" "}
                              {
                                episode.name
                              }
                            </h3>

                            {episode.air_date && (
                              <p className="mt-1 text-sm text-zinc-500">
                                {
                                  episode.air_date
                                }
                              </p>
                            )}

                            {episode.overview && (
                              <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-zinc-400">
                                {
                                  episode.overview
                                }
                              </p>
                            )}
                          </div>

                          {!watched ? (
                            <button
                              type="button"
                              onClick={() =>
                                markEpisodeWatched(
                                  episode,
                                  false
                                )
                              }
                              className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
                            >
                              <EyeOff
                                size={16}
                              />

                              Marcar visto
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedEpisode(
                                  expanded
                                    ? null
                                    : key
                                )
                              }
                              className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:border-zinc-600"
                            >
                              <Eye
                                size={16}
                              />

                              Visto
                            </button>
                          )}
                        </div>

                        {expanded && (
                          <div className="mt-4 flex flex-wrap gap-3">

                            <button
                              type="button"
                              onClick={() =>
                                markEpisodeWatched(
                                  episode,
                                  true
                                )
                              }
                              className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
                            >
                              <RotateCcw
                                size={15}
                              />

                              Marcar rewatch
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeLatestWatch(
                                  episode
                                )
                              }
                              className="flex items-center gap-2 rounded-lg border border-red-900/50 px-3 py-2 text-sm text-red-400 transition hover:bg-red-950/30"
                            >
                              <Trash2
                                size={15}
                              />

                              Quitar último visto
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>

      {message && (
        <p className="mt-4 text-sm text-zinc-400">
          {message}
        </p>
      )}
    </section>
  );
}