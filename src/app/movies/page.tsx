import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import ReviewModalCard from "./ReviewModalCard";

type PendingMovie = {
  id: string;
  external_id: string;
  title: string;
  cover_url: string | null;
  release_year: number | null;
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

export default async function MoviesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  /* =========================
     PELÍCULAS PENDIENTES
     ========================= */

  const {
    data: pendingMovies,
    error: pendingError,
  } = await supabase
    .from("library_items")
    .select(`
      id,
      external_id,
      title,
      cover_url,
      release_year
    `)
    .eq("user_id", user.id)
    .eq("media_type", "MOVIE")
    .eq("status", "PENDING")
    .order("created_at", {
      ascending: false,
    });

  /* =========================
     PELÍCULAS VISTAS / REVIEWS
     ========================= */

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
    .eq("media_type", "MOVIE")
    .order("consumed_at", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (pendingError || reviewsError) {
    console.error(
      "Error loading movies:",
      pendingError,
      reviewsError
    );

    return (
      <main>
        <h1 className="text-3xl font-bold">
          Películas
        </h1>

        <p className="mt-4 text-red-400">
          No se pudo cargar tu biblioteca.
        </p>
      </main>
    );
  }

  const pending =
    (pendingMovies ?? []) as PendingMovie[];

  const watched =
    (reviews ?? []) as ReviewRow[];

  return (
    <main>
      {/* CABECERA */}
      <div>
        <h1 className="text-3xl font-bold">
          Películas
        </h1>

        <p className="mt-2 text-zinc-400">
          Tus películas vistas y pendientes
        </p>
      </div>

      {/* =========================
          VISTAS
          ========================= */}

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Vistas
        </h2>

        {watched.length === 0 ? (
          <p className="mt-4 text-zinc-500">
            Todavía no has marcado ninguna película como vista.
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

      {/* =========================
          PENDIENTES
          ========================= */}

      <section className="mt-14">
        <h2 className="text-xl font-semibold">
          Pendientes
        </h2>

        {pending.length === 0 ? (
          <p className="mt-4 text-zinc-500">
            No tienes películas pendientes.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {pending.map((movie) => (
              <Link
                key={movie.id}
                href={`/movies/${movie.external_id}`}
                className="block"
              >
                <MovieCover
                  title={movie.title}
                  coverUrl={movie.cover_url}
                />

                <div className="mt-3">
                  <h3 className="font-semibold text-zinc-100">
                    {movie.title}
                  </h3>

                  <div className="mt-1 flex gap-2 text-sm text-zinc-500">
                    {movie.release_year && (
                      <>
                        <span>
                          {movie.release_year}
                        </span>

                        <span>·</span>
                      </>
                    )}

                    <span>
                      Pendiente
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/* =========================
   PORTADA DE PENDIENTES
   ========================= */

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