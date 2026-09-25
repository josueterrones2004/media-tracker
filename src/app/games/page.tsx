import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { shouldUseOriginalImage } from "@/lib/image-optimization";
import { createClient } from "@/lib/supabase/server";

type LibraryGame = {
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

type ReviewGame = {
  id: string;
  external_id: string;
  title: string;
  cover_url: string | null;
  release_year: number | null;
};

export default async function GamesPage() {
  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

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
        "GAME"
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
        release_year
      `)
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "media_type",
        "GAME"
      )
      .order(
        "consumed_at",
        {
          ascending: false,
        }
      );

  if (
    libraryError ||
    reviewsError
  ) {
    console.error(
      "Error loading games:",
      libraryError,
      reviewsError
    );

    return (
      <main>
        <h1 className="text-3xl font-bold">
          Juegos
        </h1>

        <p className="mt-4 text-red-400">
          No se pudieron cargar tus juegos.
        </p>
      </main>
    );
  }

  const games =
    (libraryRows ??
      []) as LibraryGame[];

  const completed =
    (reviewRows ??
      []) as ReviewGame[];

  const playing =
    games.filter(
      (game) =>
        game.status ===
        "IN_PROGRESS"
    );

  const pending =
    games.filter(
      (game) =>
        game.status ===
        "PENDING"
    );

  const dropped =
    games.filter(
      (game) =>
        game.status ===
        "DROPPED"
    );

  return (
    <main>
      <div>
        <h1 className="text-3xl font-bold">
          Juegos
        </h1>

        <p className="mt-2 text-zinc-400">
          Tus juegos en progreso, completados, pendientes y abandonados
        </p>
      </div>

      <GameSection
        title="Jugando"
        games={playing}
        emptyText="No estás jugando ningún juego actualmente."
        label="Jugando"
      />

      <section className="mt-14">
        <h2 className="text-xl font-semibold">
          Completados
        </h2>

        {completed.length ===
        0 ? (
          <p className="mt-4 text-zinc-500">
            Todavía no has completado ningún juego.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {completed.map(
              (game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  label="Completado"
                />
              )
            )}
          </div>
        )}
      </section>

      <GameSection
        title="Pendientes"
        games={pending}
        emptyText="No tienes juegos pendientes."
        label="Pendiente"
      />

      <GameSection
        title="Abandonados"
        games={dropped}
        emptyText="No tienes juegos abandonados."
        label="Abandonado"
      />
    </main>
  );
}

function GameSection({
  title,
  games,
  emptyText,
  label,
}: {
  title: string;
  games: LibraryGame[];
  emptyText: string;
  label: string;
}) {
  return (
    <section className="mt-14">
      <h2 className="text-xl font-semibold">
        {title}
      </h2>

      {games.length === 0 ? (
        <p className="mt-4 text-zinc-500">
          {emptyText}
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {games.map(
            (game) => (
              <GameCard
                key={game.id}
                game={game}
                label={label}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

function GameCard({
  game,
  label,
}: {
  game: {
    external_id: string;
    title: string;
    cover_url: string | null;
    release_year: number | null;
  };
  label: string;
}) {
  return (
    <Link
      href={`/games/${game.external_id}`}
      className="group block"
    >
      <div className="overflow-hidden rounded-xl border border-transparent bg-zinc-900 transition group-hover:border-zinc-500">
        {game.cover_url ? (
          <Image
            src={game.cover_url}
            alt={game.title}
            width={500}
            height={750}
            unoptimized={
              shouldUseOriginalImage(
                game.cover_url
              )
            }
            className="aspect-[2/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[2/3] items-center justify-center bg-zinc-900 px-4 text-center text-zinc-600">
            Sin imagen
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="line-clamp-2 font-semibold text-zinc-100">
          {game.title}
        </h3>

        <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-500">
          {game.release_year && (
            <>
              <span>
                {game.release_year}
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