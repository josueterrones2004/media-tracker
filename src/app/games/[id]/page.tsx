import Image from "next/image";
import { notFound } from "next/navigation";

import {
  getIGDBGame,
  getIGDBImageUrl,
  getIGDBReleaseYear,
} from "@/lib/igdb";

import { shouldUseOriginalImage } from "@/lib/image-optimization";

import GameActions from "./GameActions";

interface GamePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GamePage({
  params,
}: GamePageProps) {
  const { id } =
    await params;

  const game =
    await getIGDBGame(id);

  if (!game) {
    notFound();
  }

  const cover =
    getIGDBImageUrl(
      game.cover?.image_id,
      "cover_big"
    );

  const backdrop =
    getIGDBImageUrl(
      game.screenshots?.[0]
        ?.image_id,
      "1080p"
    );

  const releaseYear =
    getIGDBReleaseYear(
      game.first_release_date
    );

  return (
    <main className="mx-auto max-w-6xl pb-20">
      {/* BACKDROP */}

      <div className="relative h-[320px] overflow-hidden rounded-2xl bg-zinc-900">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            unoptimized={
              shouldUseOriginalImage(
                backdrop
              )
            }
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>

      <div className="relative -mt-24 px-4 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-end">
          {/* COVER */}

          <div className="relative z-10 w-48 shrink-0 md:w-56">
            {cover ? (
              <Image
                src={cover}
                alt={game.name}
                width={500}
                height={750}
                priority
                unoptimized={
                  shouldUseOriginalImage(
                    cover
                  )
                }
                className="aspect-[2/3] w-full rounded-xl border-4 border-zinc-950 object-cover shadow-2xl"
              />
            ) : (
              <div className="flex aspect-[2/3] w-full items-center justify-center rounded-xl border-4 border-zinc-950 bg-zinc-900 px-4 text-center text-zinc-500">
                Sin imagen
              </div>
            )}
          </div>

          {/* INFORMATION */}

          <div className="pb-4">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
              {game.name}
            </h1>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-zinc-400">
              {releaseYear && (
                <span>
                  {releaseYear}
                </span>
              )}

              {game.platforms &&
                game.platforms.length >
                  0 && (
                  <>
                    {releaseYear && (
                      <span>·</span>
                    )}

                    <span>
                      {game.platforms
                        .slice(0, 4)
                        .map(
                          (
                            platform
                          ) =>
                            platform.name
                        )
                        .join(", ")}
                    </span>
                  </>
                )}
            </div>

            {game.genres &&
              game.genres.length >
                0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {game.genres.map(
                    (genre) => (
                      <span
                        key={
                          genre.id
                        }
                        className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300"
                      >
                        {
                          genre.name
                        }
                      </span>
                    )
                  )}
                </div>
              )}
          </div>
        </div>

        {/* DESCRIPTION */}

        <section className="mt-10 max-w-4xl">
          <h2 className="text-xl font-semibold text-zinc-100">
            Sinopsis
          </h2>

          <p className="mt-4 whitespace-pre-line leading-7 text-zinc-300">
            {game.summary ||
              "No hay descripción disponible para este juego."}
          </p>
        </section>

        {/* ACTIONS */}

        <GameActions
          game={{
            id: String(
              game.id
            ),
            title:
              game.name,
            coverUrl:
              cover,
            backdropUrl:
              backdrop,
            releaseYear,
          }}
        />
      </div>
    </main>
  );
}