"use client";

import { shouldUseOriginalImage } from "@/lib/image-optimization";
import Image from "next/image";

import {
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

interface BookActionsProps {
  book: {
    id: string;
    title: string;
    coverUrl: string | null;
    authors: string[];
  };
}

function getToday() {
  const now = new Date();

  const local = new Date(
    now.getTime() -
      now.getTimezoneOffset() * 60_000
  );

  return local.toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(
    new Date(`${date}T12:00:00`)
  );
}

function ReadToggleIcon({
  reread,
}: {
  reread: boolean;
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
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z" />

      <path
        d="M6 6 18 18"
        pathLength="1"
        style={{
          strokeDasharray: 1,
          strokeDashoffset:
            reread ? 1 : 0,
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
          strokeDashoffset:
            active ? 1 : 0,
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
          strokeDashoffset:
            liked ? 1 : 0,
          transition:
            "stroke-dashoffset 350ms cubic-bezier(.4,0,.2,1)",
        }}
      />
    </svg>
  );
}

export default function BookActions({
  book,
}: BookActionsProps) {
  const [supabase] = useState(() =>
    createClient()
  );

  const [status, setStatus] = useState<
    | "PENDING"
    | "IN_PROGRESS"
    | "DROPPED"
    | null
  >(null);

  const [showReview, setShowReview] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [review, setReview] =
    useState("");

  const [liked, setLiked] =
    useState(true);

  const [isReread, setIsReread] =
    useState(false);

  const [
    containsSpoilers,
    setContainsSpoilers,
  ] = useState(false);

  const [showDate, setShowDate] =
    useState(true);

  const [
    readDate,
    setReadDate,
  ] = useState(getToday());

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function loadState() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) return;

      const { data } =
        await supabase
          .from("library_items")
          .select("status")
          .eq("user_id", user.id)
          .eq("media_type", "BOOK")
          .eq(
            "external_id",
            book.id
          )
          .maybeSingle();

      if (
        data?.status === "PENDING" ||
        data?.status === "IN_PROGRESS" ||
        data?.status === "DROPPED"
      ) {
        setStatus(data.status);
      } else {
        setStatus(null);
      }
    }

    loadState();
  }, [
    book.id,
    supabase,
  ]);

  function getBookData(
    userId: string
  ) {
    return {
      user_id: userId,
      media_type: "BOOK",
      external_id: book.id,
      title: book.title,

      original_title: null,

      cover_url:
        book.coverUrl,

      backdrop_url: null,

      release_year: null,
    };
  }

  async function createLibraryActivity(
    userId: string,
    activityType:
      | "STARTED"
      | "ADDED_PENDING"
  ) {
    const { error } =
      await supabase
        .from("activity_events")
        .insert({
          user_id: userId,

          activity_type:
            activityType,

          media_type:
            "BOOK",

          external_id:
            book.id,

          title:
            book.title,

          cover_url:
            book.coverUrl,
        });

    if (error) {
      console.error(
        "Error creating book activity:",
        error
      );
    }
  }

  async function setLibraryStatus(
    newStatus:
      | "PENDING"
      | "IN_PROGRESS"
      | "DROPPED"
  ) {
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

    const { error } =
      await supabase
        .from("library_items")
        .upsert(
          {
            ...getBookData(
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
      await createLibraryActivity(
        user.id,
        "STARTED"
      );
    }

    if (
      newStatus ===
      "PENDING"
    ) {
      await createLibraryActivity(
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
        "Libro marcado como leyendo."
      );
    }

    if (
      newStatus ===
      "PENDING"
    ) {
      setMessage(
        "Libro añadido a pendientes."
      );
    }

    if (
      newStatus ===
      "DROPPED"
    ) {
      setMessage(
        "Libro marcado como abandonado."
      );
    }

    setLoading(false);
  }

  async function openReadModal() {
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
    } =
      await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("media_type", "BOOK")
        .eq(
          "external_id",
          book.id
        )
        .limit(1);

    setIsReread(
      Boolean(
        previousReviews &&
          previousReviews.length >
            0
      )
    );

    setReadDate(
      getToday()
    );

    setLiked(true);
    setContainsSpoilers(false);
    setShowDate(true);
    setReview("");
    setShowReview(true);
  }

  async function saveReview() {
    if (!review.trim()) {
      setMessage(
        "La review es obligatoria."
      );

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
      data: createdReview,
      error: reviewError,
    } =
      await supabase
        .from("reviews")
        .insert({
          user_id:
            user.id,

          media_type:
            "BOOK",

          external_id:
            book.id,

          title:
            book.title,

          review_text:
            review.trim(),

          liked,

          is_rewatch:
            isReread,

          contains_spoilers:
            containsSpoilers,

          show_consumed_date:
            showDate,

          experience:
            isReread
              ? "REREAD"
              : "FIRST_TIME",

          consumed_at:
            readDate,

          cover_url:
            book.coverUrl,

          backdrop_url:
            null,

          release_year:
            null,
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

    if (createdReview) {
      const {
        error: activityError,
      } =
        await supabase
          .from("activity_events")
          .insert({
            user_id:
              user.id,

            activity_type:
              "REVIEWED",

            media_type:
              "BOOK",

            external_id:
              book.id,

            title:
              book.title,

            cover_url:
              book.coverUrl,

            review_id:
              createdReview.id,
          });

      if (activityError) {
        console.error(
          "Error creating book review activity:",
          activityError
        );
      }
    }

    const {
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
          "BOOK"
        )
        .eq(
          "external_id",
          book.id
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
      isReread
        ? "Relectura guardada."
        : "Libro marcado como leído."
    );

    setLoading(false);
  }

  return (
    <>
      <section className="mt-10">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={
              openReadModal
            }
            className="rounded-xl bg-fuchsia-500 px-5 py-3 font-medium text-white transition hover:bg-fuchsia-400"
          >
            Marcar como leído
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
              ? "✓ Leyendo"
              : "Leyendo"}
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

      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-7 shadow-2xl">
            <button
              type="button"
              onClick={() =>
                setShowReview(
                  false
                )
              }
              className="absolute right-5 top-5 text-3xl leading-none text-zinc-500 transition hover:text-white"
            >
              ×
            </button>

            <div className="grid gap-8 md:grid-cols-[180px_1fr] md:items-start">
              <div className="flex justify-center md:justify-start md:pt-16">
                <div className="w-full max-w-[180px]">
                  {book.coverUrl ? (
                    <Image
                      src={
                        book.coverUrl
                      }
                      alt={
                        book.title
                      }
                      className="w-full rounded-xl object-cover shadow-xl"
                    
          width={500}
          height={750}
          unoptimized={shouldUseOriginalImage(book.coverUrl)}
        />
                  ) : (
                    <div className="flex aspect-[2/3] w-full items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
                      Sin imagen
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-7">
                <h2 className="text-2xl font-bold">
                  {book.title}
                </h2>

                {book.authors.length >
                  0 && (
                  <p className="mt-2 text-sm text-zinc-500">
                    {book.authors.join(
                      ", "
                    )}
                  </p>
                )}

                <div className="mt-6">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
                    <button
                      type="button"
                      onClick={() =>
                        setShowDate(
                          !showDate
                        )
                      }
                      className="flex items-center gap-3"
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-sm border transition ${
                          showDate
                            ? "border-zinc-300 bg-zinc-300"
                            : "border-zinc-500 bg-transparent"
                        }`}
                      >
                        {showDate && (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#111827"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m5 12 4 4L19 6" />
                          </svg>
                        )}
                      </span>

                      <span>
                        Read on
                      </span>
                    </button>

                    <span className="rounded bg-zinc-800 px-2.5 py-1 text-sm text-zinc-200">
                      {formatDate(
                        readDate
                      )}
                    </span>
                  </div>
                </div>

                <textarea
                  value={
                    review
                  }
                  onChange={(
                    event
                  ) =>
                    setReview(
                      event.target
                        .value
                    )
                  }
                  placeholder="Escribe tu review..."
                  rows={7}
                  className="mt-6 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-4 outline-none transition focus:border-fuchsia-500"
                />

                <div className="mt-8 grid grid-cols-3 gap-6">
                  <button
                    type="button"
                    onClick={() =>
                      setIsReread(
                        !isReread
                      )
                    }
                    className={`flex flex-col items-center gap-2 transition ${
                      isReread
                        ? "text-fuchsia-400"
                        : "text-zinc-300"
                    }`}
                  >
                    <ReadToggleIcon
                      reread={
                        isReread
                      }
                    />

                    <span className="text-center text-sm">
                      {isReread
                        ? "Relectura"
                        : "Primera lectura"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setContainsSpoilers(
                        !containsSpoilers
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
                        !liked
                      )
                    }
                    className={`flex flex-col items-center gap-2 transition ${
                      liked
                        ? "text-red-500"
                        : "text-zinc-400"
                    }`}
                  >
                    <HeartToggleIcon
                      liked={
                        liked
                      }
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
                    className="rounded-xl bg-fuchsia-500 px-6 py-3 font-medium text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
                  >
                    {loading
                      ? "Guardando..."
                      : "Guardar review"}
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