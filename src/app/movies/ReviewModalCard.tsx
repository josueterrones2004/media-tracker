"use client";

import { shouldUseOriginalImage } from "@/lib/image-optimization";
import Image from "next/image";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Eye,
  EyeOff,
  Heart,
  HeartCrack,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Pencil,
  Save,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Review = {
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
};

export default function ReviewModalCard({
  review,
}: {
  review: Review;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [reviewText, setReviewText] = useState(
    review.review_text
  );

  const [liked, setLiked] = useState(
    review.liked
  );

  const [isRewatch, setIsRewatch] = useState(
    review.is_rewatch
  );

  const [
    containsSpoilers,
    setContainsSpoilers,
  ] = useState(
    review.contains_spoilers
  );

  const [showDate, setShowDate] = useState(
    review.show_consumed_date
  );

  const [
    spoilersRevealed,
    setSpoilersRevealed,
  ] = useState(
    !review.contains_spoilers
  );

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(
      new Date(`${date}T12:00:00`)
    );
  }

  function openModal() {
    setEditing(false);

    setReviewText(
      review.review_text
    );

    setLiked(
      review.liked
    );

    setIsRewatch(
      review.is_rewatch
    );

    setContainsSpoilers(
      review.contains_spoilers
    );

    setShowDate(
      review.show_consumed_date
    );

    setSpoilersRevealed(
      !review.contains_spoilers
    );

    setMessage("");

    setOpen(true);
  }

  function closeModal() {
    if (loading) return;

    setOpen(false);
    setEditing(false);
    setMessage("");
  }

  function cancelEditing() {
    setReviewText(
      review.review_text
    );

    setLiked(
      review.liked
    );

    setIsRewatch(
      review.is_rewatch
    );

    setContainsSpoilers(
      review.contains_spoilers
    );

    setShowDate(
      review.show_consumed_date
    );

    setEditing(false);
    setMessage("");
  }

  async function saveChanges() {
    if (!reviewText.trim()) {
      setMessage(
        "La review no puede estar vacía."
      );

      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("reviews")
      .update({
        review_text:
          reviewText.trim(),

        liked,

        is_rewatch:
          isRewatch,

        contains_spoilers:
          containsSpoilers,

        show_consumed_date:
          showDate,

        experience:
          isRewatch
            ? "REWATCH"
            : "FIRST_TIME",

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", review.id);

    if (error) {
      setMessage(error.message);
      setLoading(false);

      return;
    }

    setEditing(false);

    setSpoilersRevealed(
      !containsSpoilers
    );

    setLoading(false);

    setMessage(
      "Review actualizada."
    );

    router.refresh();
  }

  async function deleteReview() {
    const confirmed =
      window.confirm(
        "¿Seguro que quieres borrar esta review? Esta acción no se puede deshacer."
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", review.id);

    if (error) {
      setMessage(error.message);
      setLoading(false);

      return;
    }

    setLoading(false);
    setOpen(false);

    router.refresh();
  }

  return (
    <>
      {/* CARD */}
      <div>
        <button
          type="button"
          onClick={openModal}
          className="block w-full text-left"
        >
          <MovieCover
            title={review.title}
            coverUrl={review.cover_url}
          />
        </button>

        <div className="mt-2 flex items-center gap-3 text-zinc-500">
          {review.liked ? (
            <Heart
              size={17}
              fill="currentColor"
            />
          ) : (
            <HeartCrack size={17} />
          )}

          {review.is_rewatch ? (
            <Eye size={17} />
          ) : (
            <EyeOff size={17} />
          )}

          {review.contains_spoilers ? (
            <ShieldAlert size={17} />
          ) : (
            <ShieldCheck size={17} />
          )}
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={closeModal}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-7 shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* CERRAR */}
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-5 top-5 text-zinc-500 transition hover:text-white"
            >
              <X size={26} />
            </button>

            <div className="grid gap-8 md:grid-cols-[170px_1fr] md:items-stretch">

              {/* PORTADA */}
              <div className="flex h-full items-center justify-center">
                <div className="w-full max-w-[150px]">
                  {review.cover_url ? (
                    <Link
                      href={`/movies/${review.external_id}`}
                      onClick={() =>
                        setOpen(false)
                      }
                      className="block"
                    >
                      <Image
                        src={review.cover_url}
                        alt={review.title}
                        className="w-full rounded-xl border border-transparent object-cover shadow-xl transition-colors duration-200 hover:border-zinc-400"
                      
          width={500}
          height={750}
          unoptimized={shouldUseOriginalImage(review.cover_url)}
        />
                    </Link>
                  ) : (
                    <Link
                      href={`/movies/${review.external_id}`}
                      onClick={() =>
                        setOpen(false)
                      }
                      className="flex aspect-[2/3] w-full items-center justify-center rounded-xl border border-transparent bg-zinc-900 text-zinc-500 transition-colors duration-200 hover:border-zinc-400"
                    >
                      Sin imagen
                    </Link>
                  )}
                </div>
              </div>

              {/* CONTENIDO */}
              <div className="min-w-0">

                {/* TITULO */}
                <div className="flex flex-wrap items-baseline gap-3 pr-10">
                  <h2 className="text-2xl font-bold">
                    {review.title}
                  </h2>

                  {review.release_year && (
                    <span className="text-lg text-zinc-500">
                      {review.release_year}
                    </span>
                  )}
                </div>

                {/* FECHA */}
                {editing ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setShowDate(
                          !showDate
                        )
                      }
                      className="flex items-center gap-3 text-sm text-zinc-300"
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-sm border transition ${
                          showDate
                            ? "border-zinc-300 bg-zinc-300"
                            : "border-zinc-600 bg-transparent"
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
                        Watched on
                      </span>
                    </button>

                    <span className="rounded bg-zinc-800 px-2.5 py-1 text-sm text-zinc-200">
                      {formatDate(
                        review.consumed_at
                      )}
                    </span>
                  </div>
                ) : (
                  showDate && (
                    <p className="mt-2 text-sm text-zinc-500">
                      Vista el{" "}
                      {formatDate(
                        review.consumed_at
                      )}
                    </p>
                  )
                )}

                {/* ICONOS */}
                <div className="mt-6 flex flex-wrap items-start gap-10">
                  <ReviewToggle
                    editing={editing}
                    active={liked}
                    onClick={() =>
                      setLiked(!liked)
                    }
                    icon={
                      liked ? (
                        <Heart
                          size={30}
                          fill="currentColor"
                        />
                      ) : (
                        <HeartCrack
                          size={30}
                        />
                      )
                    }
                    label={
                      liked
                        ? "Me gustó"
                        : "No me gustó"
                    }
                  />

                  <ReviewToggle
                    editing={editing}
                    active={isRewatch}
                    onClick={() =>
                      setIsRewatch(
                        !isRewatch
                      )
                    }
                    icon={
                      isRewatch ? (
                        <Eye size={30} />
                      ) : (
                        <EyeOff size={30} />
                      )
                    }
                    label={
                      isRewatch
                        ? "Rewatch"
                        : "Primera vez"
                    }
                  />

                  <ReviewToggle
                    editing={editing}
                    active={
                      containsSpoilers
                    }
                    onClick={() =>
                      setContainsSpoilers(
                        !containsSpoilers
                      )
                    }
                    icon={
                      containsSpoilers ? (
                        <ShieldAlert
                          size={30}
                        />
                      ) : (
                        <ShieldCheck
                          size={30}
                        />
                      )
                    }
                    label={
                      containsSpoilers
                        ? "Contiene spoilers"
                        : "Sin spoilers"
                    }
                  />
                </div>

                {/* REVIEW */}
                <div className="mt-8">
                  {editing ? (
                    <textarea
                      value={reviewText}
                      onChange={(event) =>
                        setReviewText(
                          event.target.value
                        )
                      }
                      rows={7}
                      className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-4 leading-7 text-zinc-200 outline-none transition focus:border-fuchsia-500"
                    />
                  ) : containsSpoilers &&
                    !spoilersRevealed ? (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
                      <ShieldAlert
                        size={32}
                        className="mx-auto text-zinc-400"
                      />

                      <h3 className="mt-3 font-semibold">
                        Esta review contiene spoilers
                      </h3>

                      <p className="mt-2 text-sm text-zinc-500">
                        ¿Quieres continuar y leerla?
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setSpoilersRevealed(
                            true
                          )
                        }
                        className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
                      >
                        Mostrar review
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-zinc-900/40 p-5">
                      <p className="whitespace-pre-wrap leading-7 text-zinc-300">
                        {reviewText}
                      </p>
                    </div>
                  )}
                </div>

                {message && (
                  <p className="mt-4 text-sm text-zinc-400">
                    {message}
                  </p>
                )}

                {/* BOTONES */}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={deleteReview}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl border border-red-900/50 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-950/30 disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                    Borrar
                  </button>

                  <div className="flex gap-3">
                    {!editing ? (
                      <button
                        type="button"
                        onClick={() =>
                          setEditing(true)
                        }
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50"
                      >
                        <Pencil size={17} />
                        Editar
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={
                            cancelEditing
                          }
                          disabled={
                            loading
                          }
                          className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          onClick={
                            saveChanges
                          }
                          disabled={
                            loading
                          }
                          className="flex items-center gap-2 rounded-xl bg-fuchsia-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
                        >
                          <Save size={17} />

                          {loading
                            ? "Guardando..."
                            : "Guardar"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReviewToggle({
  editing,
  active,
  onClick,
  icon,
  label,
}: {
  editing: boolean;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={!editing}
      onClick={onClick}
      className={`flex min-w-[90px] flex-col items-center gap-2 text-center ${
        editing
          ? "cursor-pointer"
          : "cursor-default"
      } ${
        active
          ? "text-zinc-300"
          : "text-zinc-500"
      }`}
    >
      {icon}

      <span className="text-xs">
        {label}
      </span>
    </button>
  );
}

function MovieCover({
  title,
  coverUrl,
}: {
  title: string;
  coverUrl: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-transparent bg-zinc-900 transition-colors duration-200 hover:border-zinc-400">
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={title}
          className="aspect-[2/3] w-full object-cover"
        
          width={500}
          height={750}
          unoptimized={shouldUseOriginalImage(coverUrl)}
        />
      ) : (
        <div className="flex aspect-[2/3] items-center justify-center bg-zinc-800 px-4 text-center text-zinc-500">
          Sin imagen
        </div>
      )}
    </div>
  );
}