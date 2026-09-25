"use client";

import {
  Heart,
  Repeat2,
  ShieldAlert,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import { createClient } from "@/lib/supabase/client";

interface GameActionsProps {
  game: {
    id: string;
    title: string;

    coverUrl:
      | string
      | null;

    backdropUrl:
      | string
      | null;

    releaseYear:
      | number
      | null;
  };
}

type GameStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "DROPPED";

function getToday() {
  const now =
    new Date();

  const local =
    new Date(
      now.getTime() -
        now.getTimezoneOffset() *
          60_000
    );

  return local
    .toISOString()
    .slice(0, 10);
}

export default function GameActions({
  game,
}: GameActionsProps) {
  const router =
    useRouter();

  const [supabase] =
    useState(() =>
      createClient()
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      GameStatus | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    showReview,
    setShowReview,
  ] =
    useState(false);

  const [
    review,
    setReview,
  ] =
    useState("");

  const [
    liked,
    setLiked,
  ] =
    useState(true);

  const [
    isReplay,
    setIsReplay,
  ] =
    useState(false);

  const [
    containsSpoilers,
    setContainsSpoilers,
  ] =
    useState(false);

  const [
    showDate,
    setShowDate,
  ] =
    useState(true);

  const [
    completedDate,
    setCompletedDate,
  ] =
    useState(
      getToday()
    );

  const [
    message,
    setMessage,
  ] =
    useState("");

  /* LOAD CURRENT STATE */

  useEffect(() => {
    let cancelled =
      false;

    const timeout =
      window.setTimeout(
        () => {
          void (async () => {
            const {
              data: {
                user,
              },
            } =
              await supabase.auth.getUser();

            if (
              !user ||
              cancelled
            ) {
              return;
            }

            const {
              data,
              error,
            } =
              await supabase
                .from(
                  "library_items"
                )
                .select(
                  "status"
                )
                .eq(
                  "user_id",
                  user.id
                )
                .eq(
                  "media_type",
                  "GAME"
                )
                .eq(
                  "external_id",
                  game.id
                )
                .maybeSingle();

            if (error) {
              console.error(
                "Error loading game state:",
                error
              );

              return;
            }

            if (
              cancelled
            ) {
              return;
            }

            if (
              data?.status ===
                "PENDING" ||
              data?.status ===
                "IN_PROGRESS" ||
              data?.status ===
                "DROPPED"
            ) {
              setStatus(
                data.status
              );
            } else {
              setStatus(
                null
              );
            }
          })();
        },
        0
      );

    return () => {
      cancelled = true;

      window.clearTimeout(
        timeout
      );
    };
  }, [
    game.id,
    supabase,
  ]);

  function getGameData(
    userId: string
  ) {
    return {
      user_id:
        userId,

      media_type:
        "GAME",

      external_id:
        game.id,

      title:
        game.title,

      original_title:
        null,

      cover_url:
        game.coverUrl,

      backdrop_url:
        game.backdropUrl,

      release_year:
        game.releaseYear,
    };
  }

  async function createActivity(
    userId: string,
    activityType:
      | "STARTED"
      | "ADDED_PENDING"
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          "activity_events"
        )
        .insert({
          user_id:
            userId,

          activity_type:
            activityType,

          media_type:
            "GAME",

          external_id:
            game.id,

          title:
            game.title,

          cover_url:
            game.coverUrl,
        });

    if (error) {
      console.error(
        "Error creating game activity:",
        error
      );
    }
  }

  async function setLibraryStatus(
    newStatus:
      GameStatus
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

    const {
      error,
    } =
      await supabase
        .from(
          "library_items"
        )
        .upsert(
          {
            ...getGameData(
              user.id
            ),

            status:
              newStatus,
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

    if (
      newStatus ===
      "IN_PROGRESS"
    ) {
      await createActivity(
        user.id,
        "STARTED"
      );
    }

    if (
      newStatus ===
      "PENDING"
    ) {
      await createActivity(
        user.id,
        "ADDED_PENDING"
      );
    }

    setStatus(
      newStatus
    );

    if (
      newStatus ===
      "IN_PROGRESS"
    ) {
      setMessage(
        "Juego marcado como jugando."
      );
    }

    if (
      newStatus ===
      "PENDING"
    ) {
      setMessage(
        "Juego añadido a pendientes."
      );
    }

    if (
      newStatus ===
      "DROPPED"
    ) {
      setMessage(
        "Juego marcado como abandonado."
      );
    }

    setLoading(false);

    router.refresh();
  }

  async function openCompletedModal() {
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
          "GAME"
        )
        .eq(
          "external_id",
          game.id
        )
        .limit(1);

    if (error) {
      console.error(
        "Error checking previous game reviews:",
        error
      );
    }

    setIsReplay(
      Boolean(
        previousReviews &&
          previousReviews.length >
            0
      )
    );

    setReview("");
    setLiked(true);

    setContainsSpoilers(
      false
    );

    setShowDate(true);

    setCompletedDate(
      getToday()
    );

    setShowReview(
      true
    );
  }

  async function saveReview() {
    const cleanReview =
      review.trim();

    if (!cleanReview) {
      setMessage(
        "La review es obligatoria."
      );

      return;
    }

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
            "GAME",

          external_id:
            game.id,

          title:
            game.title,

          review_text:
            cleanReview,

          liked,

          is_rewatch:
            isReplay,

          contains_spoilers:
            containsSpoilers,

          show_consumed_date:
            showDate,

          experience:
            isReplay
              ? "REPLAY"
              : "FIRST_TIME",

          consumed_at:
            completedDate,

          cover_url:
            game.coverUrl,

          backdrop_url:
            game.backdropUrl,

          release_year:
            game.releaseYear,
        })
        .select("id")
        .single();

    if (reviewError) {
      setMessage(
        reviewError.message
      );

      setLoading(false);
      return;
    }

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
            "GAME",

          external_id:
            game.id,

          title:
            game.title,

          cover_url:
            game.coverUrl,

          review_id:
            createdReview.id,
        });

    if (
      activityError
    ) {
      console.error(
        "Error creating game review activity:",
        activityError
      );
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
          "GAME"
        )
        .eq(
          "external_id",
          game.id
        );

    if (deleteError) {
      setMessage(
        deleteError.message
      );

      setLoading(false);
      return;
    }

    setStatus(null);
    setShowReview(false);

    setMessage(
      isReplay
        ? "Replay guardado."
        : "Juego marcado como completado."
    );

    setLoading(false);

    router.refresh();
  }

  return (
    <>
      <section className="mt-10">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={
              openCompletedModal
            }
            disabled={
              loading
            }
            className="rounded-xl bg-fuchsia-500 px-5 py-3 font-medium text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
          >
            Marcar como completado
          </button>

          <button
            type="button"
            onClick={() =>
              setLibraryStatus(
                "IN_PROGRESS"
              )
            }
            disabled={
              loading ||
              status ===
                "IN_PROGRESS"
            }
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {status ===
            "IN_PROGRESS"
              ? "✓ Jugando"
              : "Jugando"}
          </button>

          <button
            type="button"
            onClick={() =>
              setLibraryStatus(
                "PENDING"
              )
            }
            disabled={
              loading ||
              status ===
                "PENDING"
            }
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {status ===
            "PENDING"
              ? "✓ Pendiente"
              : "Pendiente"}
          </button>

          <button
            type="button"
            onClick={() =>
              setLibraryStatus(
                "DROPPED"
              )
            }
            disabled={
              loading ||
              status ===
                "DROPPED"
            }
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3 font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {status ===
            "DROPPED"
              ? "✓ Abandonado"
              : "Abandonar"}
          </button>
        </div>

        {message && (
          <p className="mt-3 text-sm text-zinc-400">
            {message}
          </p>
        )}
      </section>

      {/* REVIEW MODAL */}

      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-7 shadow-2xl">
            <button
              type="button"
              onClick={() =>
                setShowReview(
                  false
                )
              }
              className="absolute right-5 top-4 text-3xl text-zinc-500 transition hover:text-white"
              aria-label="Cerrar"
            >
              ×
            </button>

            <h2 className="pr-10 text-2xl font-bold">
              {game.title}
            </h2>

            <div className="mt-6">
              <label className="text-sm text-zinc-400">
                Fecha de finalización
              </label>

              <input
                type="date"
                value={
                  completedDate
                }
                onChange={(
                  event
                ) =>
                  setCompletedDate(
                    event.target.value
                  )
                }
                className="mt-2 block rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-zinc-200 outline-none focus:border-fuchsia-500"
              />
            </div>

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
              rows={7}
              className="mt-6 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-fuchsia-500"
            />

            <div className="mt-7 grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() =>
                  setIsReplay(
                    (current) =>
                      !current
                  )
                }
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                  isReplay
                    ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300"
                    : "border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                <Repeat2
                  size={28}
                />

                <span className="text-sm">
                  {isReplay
                    ? "Replay"
                    : "Primera partida"}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setContainsSpoilers(
                    (current) =>
                      !current
                  )
                }
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                  containsSpoilers
                    ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-300"
                    : "border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                <ShieldAlert
                  size={28}
                />

                <span className="text-sm">
                  {containsSpoilers
                    ? "Con spoilers"
                    : "Sin spoilers"}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setLiked(
                    (current) =>
                      !current
                  )
                }
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                  liked
                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                    : "border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                <Heart
                  size={28}
                  fill={
                    liked
                      ? "currentColor"
                      : "none"
                  }
                />

                <span className="text-sm">
                  {liked
                    ? "Me gustó"
                    : "No me gustó"}
                </span>
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <input
                id="show-game-date"
                type="checkbox"
                checked={
                  showDate
                }
                onChange={(
                  event
                ) =>
                  setShowDate(
                    event.target.checked
                  )
                }
                className="h-4 w-4"
              />

              <label
                htmlFor="show-game-date"
                className="text-sm text-zinc-400"
              >
                Mostrar fecha públicamente
              </label>
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
                className="rounded-xl bg-fuchsia-500 px-6 py-3 font-medium text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
              >
                {loading
                  ? "Guardando..."
                  : "Guardar review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}