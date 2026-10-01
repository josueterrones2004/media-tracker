"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import MediaActionBar from "@/components/media/MediaActionBar";
import StarRating from "@/components/media/StarRating";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  createClient,
} from "@/lib/supabase/client";

interface MovieActionsProps {
  movie: {
    id: number;
    title: string;
    original_title?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    release_date?: string;
  };
}

function getToday() {
  const now = new Date();

  const local = new Date(
    now.getTime() -
      now.getTimezoneOffset() * 60_000
  );

  return local
    .toISOString()
    .slice(0, 10);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(`${date}T12:00:00`)
  );
}

function EyeToggleIcon({
  rewatch,
}: {
  rewatch: boolean;
}) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />

      <circle
        cx="12"
        cy="12"
        r="2.6"
      />

      <path
        d="M4 4 20 20"
        pathLength="1"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: rewatch
            ? 1
            : 0,
          transition:
            "stroke-dashoffset 350ms cubic-bezier(.4,0,.2,1)",
        }}
      />
    </svg>
  );
}

function SpoilerToggleIcon({
  active,
}: {
  active: boolean;
}) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z" />

      <path
        d="m8.5 12 2.2 2.2 4.8-5"
        pathLength="1"
        style={{
          opacity: active ? 0 : 1,
          strokeDasharray: 1,
          strokeDashoffset: active
            ? 1
            : 0,
          transform: active
            ? "scale(.7)"
            : "scale(1)",
          transformOrigin: "center",
          transition:
            "opacity 200ms ease, stroke-dashoffset 300ms ease, transform 250ms ease",
        }}
      />

      <g
        style={{
          opacity: active ? 1 : 0,
          transform: active
            ? "scale(1)"
            : "scale(.7)",
          transformOrigin: "center",
          transition:
            "opacity 200ms ease, transform 250ms ease",
        }}
      >
        <path d="M12 8v5" />
        <path d="M12 16.4h.01" />
      </g>
    </svg>
  );
}

function HeartToggleIcon({
  liked,
}: {
  liked: boolean;
}) {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 24 24"
      fill={
        liked
          ? "currentColor"
          : "none"
      }
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />

      <path
        d="m13 6.5-2 4 2 2-2.2 4"
        pathLength="1"
        fill="none"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: liked
            ? 1
            : 0,
          transition:
            "stroke-dashoffset 350ms cubic-bezier(.4,0,.2,1)",
        }}
      />
    </svg>
  );
}

export default function MovieActions({
  movie,
}: MovieActionsProps) {
  const router = useRouter();

  const [supabase] = useState(
    () => createClient()
  );

  const [
    pending,
    setPending,
  ] = useState(false);

  const [
    hasWatchedBefore,
    setHasWatchedBefore,
  ] = useState(false);

  const [
    showReview,
    setShowReview,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    review,
    setReview,
  ] = useState("");

  const [
    rating,
    setRating,
  ] = useState<number | null>(
    null
  );

  const [
    liked,
    setLiked,
  ] = useState(true);

  const [
    isRewatch,
    setIsRewatch,
  ] = useState(false);

  const [
    containsSpoilers,
    setContainsSpoilers,
  ] = useState(false);

  const [
    watchedDate,
    setWatchedDate,
  ] = useState(getToday());

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    let cancelled = false;

    const timeout =
      window.setTimeout(() => {
        void (async () => {
          const {
            data: { user },
          } =
            await supabase.auth.getUser();

          if (
            !user ||
            cancelled
          ) {
            return;
          }

          const [
            libraryResult,
            reviewResult,
          ] = await Promise.all([
            supabase
              .from("library_items")
              .select("status")
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "media_type",
                "MOVIE"
              )
              .eq(
                "external_id",
                String(movie.id)
              )
              .maybeSingle(),

            supabase
              .from("reviews")
              .select("id")
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "media_type",
                "MOVIE"
              )
              .eq(
                "external_id",
                String(movie.id)
              )
              .limit(1),
          ]);

          if (
            libraryResult.error
          ) {
            console.error(
              "Error loading movie state:",
              libraryResult.error
            );
          }

          if (
            reviewResult.error
          ) {
            console.error(
              "Error loading movie reviews:",
              reviewResult.error
            );
          }

          if (cancelled) {
            return;
          }

          setPending(
            libraryResult.data
              ?.status ===
              "PENDING"
          );

          setHasWatchedBefore(
            Boolean(
              reviewResult.data &&
                reviewResult.data
                  .length > 0
            )
          );
        })();
      }, 0);

    return () => {
      cancelled = true;

      window.clearTimeout(
        timeout
      );
    };
  }, [
    movie.id,
    supabase,
  ]);

  function getMovieData(
    userId: string
  ) {
    return {
      user_id: userId,

      media_type: "MOVIE",

      external_id:
        String(movie.id),

      title: movie.title,

      original_title:
        movie.original_title ??
        null,

      cover_url:
        movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null,

      backdrop_url:
        movie.backdrop_path
          ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
          : null,

      release_year:
        movie.release_date
          ? Number(
              movie.release_date.slice(
                0,
                4
              )
            )
          : null,
    };
  }

  async function markPending(
    newStatus: string | null
  ) {
    if (loading) {
      return;
    }

    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Debes iniciar sesión."
      );

      setLoading(false);
      return;
    }

    if (newStatus === null) {
      const {
        data: deletedRows,
        error: deleteError,
      } =
        await supabase
          .from("library_items")
          .delete()
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "media_type",
            "MOVIE"
          )
          .eq(
            "external_id",
            String(movie.id)
          )
          .select("id");

      if (deleteError) {
        setMessage(
          deleteError.message
        );

        setLoading(false);
        return;
      }

      if (
        !deletedRows ||
        deletedRows.length === 0
      ) {
        setMessage(
          "No se pudo quitar la película de pendientes."
        );

        setLoading(false);
        return;
      }

      setPending(false);

      setMessage(
        "Película quitada de pendientes."
      );

      setLoading(false);

      router.refresh();

      return;
    }

    if (
      newStatus !== "PENDING"
    ) {
      setLoading(false);
      return;
    }

    const movieData =
      getMovieData(
        user.id
      );

    const { error } =
      await supabase
        .from("library_items")
        .upsert(
          {
            ...movieData,
            status:
              "PENDING",
          },
          {
            onConflict:
              "user_id,media_type,external_id",
          }
        );

    if (error) {
      setMessage(
        error.message
      );

      setLoading(false);
      return;
    }

    const {
      error: activityError,
    } =
      await supabase
        .from("activity_events")
        .insert({
          user_id:
            user.id,

          activity_type:
            "ADDED_PENDING",

          media_type:
            "MOVIE",

          external_id:
            String(movie.id),

          title:
            movie.title,

          cover_url:
            movieData.cover_url,
        });

    if (activityError) {
      console.error(
        "Error creating movie pending activity:",
        activityError
      );
    }

    setPending(true);

    setMessage(
      "Película añadida a pendientes."
    );

    setLoading(false);

    router.refresh();
  }

  async function openWatchedModal() {
    setMessage("");

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Debes iniciar sesión."
      );

      return;
    }

    const {
      data:
        previousReviews,

      error,
    } =
      await supabase
        .from("reviews")
        .select("id")
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "media_type",
          "MOVIE"
        )
        .eq(
          "external_id",
          String(movie.id)
        )
        .limit(1);

    if (error) {
      console.error(
        "Error checking previous movie reviews:",
        error
      );
    }

    const rewatch =
      Boolean(
        previousReviews &&
          previousReviews
            .length > 0
      );

    setIsRewatch(
      rewatch
    );

    setWatchedDate(
      getToday()
    );

    setRating(null);

    setLiked(true);

    setContainsSpoilers(
      false
    );

    setReview("");

    setShowReview(true);
  }

  async function saveReview() {
    if (loading) {
      return;
    }

    setLoading(true);
    setMessage("");

    const cleanReview =
      review.trim();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      setMessage(
        "Debes iniciar sesión."
      );

      setLoading(false);

      return;
    }

    const movieData =
      getMovieData(
        user.id
      );

    const {
      data:
        createdReview,

      error:
        reviewError,
    } =
      await supabase
        .from("reviews")
        .insert({
          user_id:
            user.id,

          media_type:
            "MOVIE",

          external_id:
            String(movie.id),

          title:
            movie.title,

          review_text:
            cleanReview ||
            null,

          rating,

          liked,

          is_rewatch:
            isRewatch,

          contains_spoilers:
            containsSpoilers,

          show_consumed_date:
            true,

          experience:
            isRewatch
              ? "REWATCH"
              : "FIRST_TIME",

          consumed_at:
            watchedDate,

          cover_url:
            movieData.cover_url,

          backdrop_url:
            movieData.backdrop_url,

          release_year:
            movieData.release_year,
        })
        .select("id")
        .single();

    if (
      reviewError
    ) {
      setMessage(
        reviewError.message
      );

      setLoading(false);

      return;
    }

    if (
      createdReview
    ) {
      const {
        error:
          activityError,
      } =
        await supabase
          .from(
            "activity_events"
          )
          .insert({
            user_id:
              user.id,

            activity_type:
              "REVIEWED",

            media_type:
              "MOVIE",

            external_id:
              String(
                movie.id
              ),

            title:
              movie.title,

            cover_url:
              movieData.cover_url,

            review_id:
              createdReview.id,
          });

      if (
        activityError
      ) {
        console.error(
          "Error creating movie review activity:",
          activityError
        );
      }
    }

    const {
      error:
        deleteError,
    } =
      await supabase
        .from(
          "library_items"
        )
        .delete()
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "media_type",
          "MOVIE"
        )
        .eq(
          "external_id",
          String(movie.id)
        );

    if (
      deleteError
    ) {
      setMessage(
        deleteError.message
      );

      setLoading(false);

      return;
    }

    setPending(false);

    setHasWatchedBefore(
      true
    );

    setShowReview(false);

    setMessage(
      isRewatch
        ? "Rewatch guardado."
        : "Película marcada como vista."
    );

    setLoading(false);

    router.refresh();
  }

  const poster =
    movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null;

  const year =
    movie.release_date?.slice(
      0,
      4
    );

  return (
    <>
      <MediaActionBar
        primaryLabel={
          hasWatchedBefore
            ? "Registrar rewatch"
            : "Marcar como vista"
        }
        onPrimaryAction={
          openWatchedModal
        }
        primaryDisabled={
          loading
        }
        statusOptions={[
          {
            value:
              "PENDING",
            label:
              "Pendiente",
          },
        ]}
        activeStatus={
          pending
            ? "PENDING"
            : null
        }
        statusDisabled={
          loading
        }
        onStatusChange={markPending}
        message={message}
      />

      {showReview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:p-7">
            <button
              type="button"
              onClick={() =>
                setShowReview(false)
              }
              disabled={loading}
              className="absolute right-5 top-5 text-3xl leading-none text-zinc-500 transition hover:text-white disabled:opacity-50"
              aria-label="Cerrar"
            >
              ×
            </button>

            <div className="grid gap-8 md:grid-cols-[180px_1fr] md:items-start">
              {/* POSTER */}

              <div className="flex justify-center md:justify-start md:pt-16">
                <div className="w-full max-w-[180px]">
                  {poster ? (
                    <Image
                      src={poster}
                      alt={
                        movie.title
                      }
                      width={500}
                      height={750}
                      unoptimized={
                        shouldUseOriginalImage(
                          poster
                        )
                      }
                      className="w-full rounded-xl object-cover shadow-xl"
                    />
                  ) : (
                    <div className="flex aspect-[2/3] w-full items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
                      Sin imagen
                    </div>
                  )}
                </div>
              </div>

              {/* CONTENIDO */}

              <div className="min-w-0 pt-2 md:pt-7">
                <div className="flex flex-wrap items-baseline gap-3 pr-10">
                  <h2 className="text-2xl font-bold">
                    {movie.title}
                  </h2>

                  {year && (
                    <span className="text-lg text-zinc-500">
                      {year}
                    </span>
                  )}
                </div>

                {/* FECHA SOLO VISUAL */}

                <p className="mt-5 text-sm text-zinc-500">
                  Vista el{" "}
                  <span className="text-zinc-300">
                    {formatDate(
                      watchedDate
                    )}
                  </span>
                </p>

                {/* RATING */}

                <div className="mt-6">
                  <p className="mb-2 text-sm font-medium text-zinc-300">
                    Tu puntuación
                  </p>

                  <StarRating
                    value={rating}
                    onChange={
                      setRating
                    }
                    size={34}
                    showLabel={
                      false
                    }
                  />
                </div>

                {/* REVIEW */}

                <textarea
                  value={review}
                  onChange={(
                    event
                  ) =>
                    setReview(
                      event.target.value
                    )
                  }
                  placeholder="Escribe tu review..."
                  rows={6}
                  className="mt-6 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-4 outline-none transition focus:border-fuchsia-500"
                />

                {/* OPCIONES */}

                <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-6">
                  <button
                    type="button"
                    onClick={() =>
                      setIsRewatch(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    className={`flex flex-col items-center gap-2 transition ${
                      isRewatch
                        ? "text-fuchsia-400"
                        : "text-zinc-300"
                    }`}
                  >
                    <EyeToggleIcon
                      rewatch={
                        isRewatch
                      }
                    />

                    <span className="text-center text-sm">
                      {isRewatch
                        ? "Rewatch"
                        : "Primera vez vista"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setContainsSpoilers(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    className={`flex flex-col items-center gap-2 transition ${
                      containsSpoilers
                        ? "text-fuchsia-400"
                        : "text-zinc-300"
                    }`}
                  >
                    <SpoilerToggleIcon
                      active={
                        containsSpoilers
                      }
                    />

                    <span className="text-center text-sm">
                      {containsSpoilers
                        ? "Contiene spoilers"
                        : "Sin spoilers"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLiked(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    className={`flex flex-col items-center gap-2 transition ${
                      liked
                        ? "text-red-500"
                        : "text-zinc-400"
                    }`}
                  >
                    <HeartToggleIcon
                      liked={liked}
                    />

                    <span className="text-center text-sm text-zinc-300">
                      {liked
                        ? "Me gustó"
                        : "No me gustó"}
                    </span>
                  </button>
                </div>

                {message && (
                  <p className="mt-5 text-sm text-zinc-400">
                    {message}
                  </p>
                )}

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={
                      saveReview
                    }
                    disabled={
                      loading
                    }
                    className="rounded-xl bg-fuchsia-500 px-6 py-3 font-medium text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Guardando..."
                      : isRewatch
                        ? "Guardar rewatch"
                        : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}