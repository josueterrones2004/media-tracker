import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ReviewModalCard from "./ReviewModalCard";

type LibraryBook = {
  id: string;
  external_id: string;
  title: string;
  cover_url: string | null;
  release_year: number | null;

  status:
    | "PENDING"
    | "IN_PROGRESS"
    | "DROPPED";
};

type ReviewRow = {
  id: string;
  external_id: string;
  title: string;
  cover_url: string | null;

  liked: boolean;
  is_rewatch: boolean;
  contains_spoilers: boolean;

  show_consumed_date: boolean;
  consumed_at: string;

  review_text: string;
  created_at: string;
};

export default async function BooksPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  /*
   * LIBROS EN BIBLIOTECA
   */
  const {
    data: libraryRows,
    error: libraryError,
  } =
    await supabase
      .from("library_items")
      .select(`
        id,
        external_id,
        title,
        cover_url,
        release_year,
        status
      `)
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "media_type",
        "BOOK"
      )
      .in(
        "status",
        [
          "PENDING",
          "IN_PROGRESS",
          "DROPPED",
        ]
      )
      .order(
        "updated_at",
        {
          ascending: false,
        }
      );

  /*
   * LIBROS LEÍDOS
   */
  const {
    data: reviewRows,
    error: reviewsError,
  } =
    await supabase
      .from("reviews")
      .select(`
        id,
        external_id,
        title,
        cover_url,
        liked,
        is_rewatch,
        contains_spoilers,
        show_consumed_date,
        consumed_at,
        review_text,
        created_at
      `)
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "media_type",
        "BOOK"
      )
      .order(
        "consumed_at",
        {
          ascending: false,
        }
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  if (
    libraryError ||
    reviewsError
  ) {
    console.error(
      "Error loading books:",
      libraryError,
      reviewsError
    );

    return (
      <main>
        <h1 className="text-3xl font-bold">
          Libros
        </h1>

        <p className="mt-4 text-red-400">
          No se pudieron cargar tus libros.
        </p>
      </main>
    );
  }

  const books =
    (libraryRows ??
      []) as LibraryBook[];

  const readBooks =
    (reviewRows ??
      []) as ReviewRow[];

  const reading =
    books.filter(
      (book) =>
        book.status ===
        "IN_PROGRESS"
    );

  const pending =
    books.filter(
      (book) =>
        book.status ===
        "PENDING"
    );

  const dropped =
    books.filter(
      (book) =>
        book.status ===
        "DROPPED"
    );

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">
          Libros
        </h1>

        <p className="mt-2 text-zinc-400">
          Mis libros leyendo, leídos,
          pendientes y abandonados
        </p>
      </div>

      {/* LEYENDO */}
      <LibrarySection
        title="Leyendo"
        books={reading}
        emptyText="No estás leyendo ningún libro actualmente."
        label="Leyendo"
      />

      {/* LEÍDOS */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold">
          Leídos
        </h2>

        {readBooks.length ===
        0 ? (
          <p className="mt-4 text-zinc-500">
            Todavía no has marcado ningún libro como leído.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {readBooks.map(
              (review) => (
                <ReviewModalCard
                  key={
                    review.id
                  }
                  review={
                    review
                  }
                />
              )
            )}
          </div>
        )}
      </section>

      {/* PENDIENTES */}
      <LibrarySection
        title="Pendientes"
        books={pending}
        emptyText="No tienes libros pendientes."
        label="Pendiente"
      />

      {/* ABANDONADOS */}
      <LibrarySection
        title="Abandonados"
        books={dropped}
        emptyText="No tienes libros abandonados."
        label="Abandonado"
      />
    </main>
  );
}

function LibrarySection({
  title,
  books,
  emptyText,
  label,
}: {
  title: string;
  books: LibraryBook[];
  emptyText: string;
  label: string;
}) {
  return (
    <section className="mt-14">
      <h2 className="text-xl font-semibold">
        {title}
      </h2>

      {books.length === 0 ? (
        <p className="mt-4 text-zinc-500">
          {emptyText}
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {books.map(
            (book) => (
              <BookLibraryCard
                key={
                  book.id
                }
                book={
                  book
                }
                label={
                  label
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

function BookLibraryCard({
  book,
  label,
}: {
  book: LibraryBook;
  label: string;
}) {
  return (
    <Link
      href={`/books/${book.external_id}`}
      className="group block"
    >
      <div className="overflow-hidden rounded-xl border border-transparent bg-zinc-900 transition-colors duration-200 group-hover:border-zinc-400">
        {book.cover_url ? (
          <img
            src={
              book.cover_url
            }
            alt={
              book.title
            }
            className="aspect-[2/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center bg-zinc-800 px-4 text-center text-zinc-500">
            Sin imagen
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="font-semibold text-zinc-100">
          {book.title}
        </h3>

        <div className="mt-1 flex gap-2 text-sm text-zinc-500">
          {book.release_year && (
            <>
              <span>
                {
                  book.release_year
                }
              </span>

              <span>·</span>
            </>
          )}

          <span>
            {label}
          </span>
        </div>
      </div>
    </Link>
  );
}