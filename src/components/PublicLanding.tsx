import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Film,
  Gamepad2,
  Heart,
  Library,
  MessageCircle,
  Sparkles,
  Tv,
  Users,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import {
  getIGDBImageUrl,
  searchIGDBGames,
} from "@/lib/igdb";

import {
  getOpenLibraryCoverUrl,
  searchBooks,
} from "@/lib/openlibrary";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import {
  searchTMDB,
} from "@/lib/tmdb";

type TMDBResult = {
  id: number;

  media_type:
    | "movie"
    | "tv"
    | string;

  title?: string;
  name?: string;

  poster_path?:
    | string
    | null;
};

type LandingCover = {
  type:
    | "movie"
    | "series"
    | "book"
    | "game";

  title: string;
  image: string | null;
};

const movieQueries = [
  "Interstellar",
  "Dune",
  "Arrival",
  "Parasite",
  "The Batman",
  "Blade Runner 2049",
];

const seriesQueries = [
  "Cowboy Bebop",
  "Arcane",
  "Dark",
  "Severance",
  "Breaking Bad",
  "The Last of Us",
];

const bookQueries = [
  "Dune",
  "1984",
  "The Hobbit",
  "Frankenstein",
  "Foundation",
  "The Name of the Wind",
];

const gameQueries = [
  "Minecraft",
  "Hades",
  "Hollow Knight",
  "Celeste",
  "Elden Ring",
  "Disco Elysium",
];

const features = [
  {
    icon: Library,

    title:
      "Tu biblioteca",

    description:
      "Organiza películas, series, libros y videojuegos en un mismo lugar.",
  },

  {
    icon: Sparkles,

    title:
      "Registra tu experiencia",

    description:
      "Guarda lo que estás viendo, leyendo o jugando y lleva el control de tu progreso.",
  },

  {
    icon: Users,

    title:
      "Comparte con amigos",

    description:
      "Sigue personas, descubre su actividad y conversa sobre lo que están disfrutando.",
  },
];

function pickRandom<T>(
  items: readonly T[]
) {
  const array =
    new Uint32Array(1);

  crypto.getRandomValues(
    array
  );

  return items[
    array[0] %
      items.length
  ];
}

async function getLandingCovers() {
  const movieQuery =
    pickRandom(
      movieQueries
    );

  const seriesQuery =
    pickRandom(
      seriesQueries
    );

  const bookQuery =
    pickRandom(
      bookQueries
    );

  const gameQuery =
    pickRandom(
      gameQueries
    );

  const [
    movieResult,
    seriesResult,
    bookResult,
    gameResult,
  ] =
    await Promise.allSettled([
      searchTMDB(
        movieQuery
      ),

      searchTMDB(
        seriesQuery
      ),

      searchBooks(
        bookQuery
      ),

      searchIGDBGames(
        gameQuery
      ),
    ]);

  let movie:
    LandingCover = {
    type: "movie",
    title: movieQuery,
    image: null,
  };

  let series:
    LandingCover = {
    type: "series",
    title: seriesQuery,
    image: null,
  };

  let book:
    LandingCover = {
    type: "book",
    title: bookQuery,
    image: null,
  };

  let game:
    LandingCover = {
    type: "game",
    title: gameQuery,
    image: null,
  };

  /*
   * MOVIE
   */

  if (
    movieResult.status ===
    "fulfilled"
  ) {
    const results =
      movieResult.value
        .results as TMDBResult[];

    const result =
      results.find(
        (item) =>
          item.media_type ===
            "movie" &&
          Boolean(
            item.poster_path
          )
      );

    if (result) {
      movie = {
        type: "movie",

        title:
          result.title ??
          movieQuery,

        image:
          result.poster_path
            ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
            : null,
      };
    }
  }

  /*
   * SERIES
   */

  if (
    seriesResult.status ===
    "fulfilled"
  ) {
    const results =
      seriesResult.value
        .results as TMDBResult[];

    const result =
      results.find(
        (item) =>
          item.media_type ===
            "tv" &&
          Boolean(
            item.poster_path
          )
      );

    if (result) {
      series = {
        type: "series",

        title:
          result.name ??
          seriesQuery,

        image:
          result.poster_path
            ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
            : null,
      };
    }
  }

  /*
   * BOOK
   */

  if (
    bookResult.status ===
    "fulfilled"
  ) {
    const result =
      bookResult.value.docs.find(
        (item) =>
          Boolean(
            item.cover_i
          )
      );

    if (result) {
      book = {
        type: "book",

        title:
          result.title,

        image:
          getOpenLibraryCoverUrl(
            result.cover_i,
            "L"
          ),
      };
    }
  }

  /*
   * GAME
   */

  if (
    gameResult.status ===
    "fulfilled"
  ) {
    const result =
      gameResult.value.find(
        (item) =>
          Boolean(
            item.cover
              ?.image_id
          )
      );

    if (result) {
      game = {
        type: "game",

        title:
          result.name,

        image:
          getIGDBImageUrl(
            result.cover
              ?.image_id,
            "cover_big"
          ),
      };
    }
  }

  return [
    movie,
    series,
    book,
    game,
  ];
}

export default async function PublicLanding() {
  const covers =
    await getLandingCovers();

  const [
    movie,
    series,
    book,
    game,
  ] = covers;

  return (
    <div className="min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.14),transparent_30%)]" />

        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="absolute right-[-80px] top-[280px] h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* NAVIGATION */}

      <header className="relative z-20">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-fuchsia-400"
          >
            Media Tracker
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth?mode=login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/auth?mode=register"
              className="rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-400"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* PRE-ALPHA NOTICE */}

      <div className="relative z-20 border-y border-fuchsia-500/10 bg-fuchsia-500/5">
        <div className="mx-auto flex max-w-7xl items-start gap-3 px-5 py-3 text-sm text-zinc-300 sm:px-8">
          <AlertTriangle
            size={17}
            className="mt-0.5 shrink-0 text-fuchsia-300"
          />

          <p className="leading-6">
            <span className="font-semibold text-fuchsia-300">
              Esta versión es una pre-alpha.
            </span>{" "}
            Puede contener errores, funciones
            incompletas y cambios visuales. Esta
            versión no representa necesariamente el
            producto final.
          </p>
        </div>
      </div>

      {/* HERO */}

      <section className="relative">
        <div className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-16 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          {/* HERO TEXT */}

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1.5 text-sm text-fuchsia-300">
              <Sparkles
                size={15}
              />

              Pre-Alpha
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Todo lo que ves,
              <br />
              lees y juegas.

              <span className="mt-2 block text-fuchsia-400">
                En un solo lugar.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400">
              Organiza tu biblioteca, registra lo que
              terminas y comparte tus películas,
              series, libros y juegos con tus amigos.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth?mode=register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-6 py-3.5 font-semibold text-white transition hover:bg-fuchsia-400"
              >
                Crear cuenta

                <ArrowRight
                  size={18}
                />
              </Link>

              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/70 px-6 py-3.5 font-medium text-zinc-200 transition hover:bg-zinc-900"
              >
                Ya tengo una cuenta
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <MiniBadge
                icon={Film}
                label="Películas"
              />

              <MiniBadge
                icon={Tv}
                label="Series"
              />

              <MiniBadge
                icon={BookOpen}
                label="Libros"
              />

              <MiniBadge
                icon={Gamepad2}
                label="Juegos"
              />
            </div>
          </div>

          {/* APP PREVIEW */}

          <div className="relative mx-auto w-full max-w-2xl py-16 lg:py-20">
            <div className="absolute -inset-10 rounded-full bg-fuchsia-500/5 blur-3xl" />

            <div className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/60 p-4 shadow-2xl backdrop-blur sm:p-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <p className="font-semibold text-zinc-100">
                    Actividad de tus amigos
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Descubre qué están disfrutando
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fuchsia-500/10 text-fuchsia-400">
                  <Users
                    size={18}
                  />
                </div>
              </div>

              <div className="divide-y divide-zinc-800">
                <ActivityPreview
                  initial="A"
                  name="Alex"
                  action="terminó"
                  title="Interstellar"
                  accent="bg-blue-500/15 text-blue-300"
                  likes={4}
                  comments={2}
                />

                <ActivityPreview
                  initial="M"
                  name="Mika"
                  action="empezó a ver"
                  title="Cowboy Bebop"
                  accent="bg-orange-500/15 text-orange-300"
                  likes={7}
                  comments={3}
                />

                <ActivityPreview
                  initial="N"
                  name="Noa"
                  action="completó"
                  title="Minecraft"
                  accent="bg-emerald-500/15 text-emerald-300"
                  likes={5}
                  comments={1}
                />
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <PreviewFeature>
                  Guarda tu progreso
                </PreviewFeature>

                <PreviewFeature>
                  Descubre actividad
                </PreviewFeature>

                <PreviewFeature>
                  Comparte con amigos
                </PreviewFeature>
              </div>
            </div>

            {/* REAL MEDIA COVERS */}

            <MediaCover
              media={movie}
              icon={Film}
              label="Película"
              className="-left-5 top-5 rotate-[-9deg] sm:-left-10"
            />

            <MediaCover
              media={series}
              icon={Tv}
              label="Serie"
              className="-right-2 top-0 rotate-[8deg] sm:-right-8"
            />

            <MediaCover
              media={book}
              icon={BookOpen}
              label="Libro"
              className="-left-4 bottom-0 rotate-[8deg] sm:-left-8"
            />

            <MediaCover
              media={game}
              icon={Gamepad2}
              label="Juego"
              className="-right-2 bottom-[-10px] rotate-[9deg] sm:-right-9"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}

      <section className="relative border-y border-zinc-900 bg-zinc-950/50">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-fuchsia-400">
              Tu biblioteca, a tu manera
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Mucho más que una lista
            </h2>

            <p className="mt-4 leading-7 text-zinc-500">
              Media Tracker reúne todo lo que
              disfrutas en un único perfil y te
              permite compartirlo con las personas
              que conoces.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {features.map(
              (feature) => {
                const Icon =
                  feature.icon;

                return (
                  <div
                    key={
                      feature.title
                    }
                    className="group rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-900/30 p-6 transition hover:-translate-y-1 hover:border-fuchsia-500/30"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
                      <Icon
                        size={21}
                      />
                    </div>

                    <h3 className="mt-5 text-lg font-semibold">
                      {
                        feature.title
                      }
                    </h3>

                    <p className="mt-2 leading-7 text-zinc-500">
                      {
                        feature.description
                      }
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* SOCIAL */}

      <section className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 py-28 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* SOCIAL DESCRIPTION */}

          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-fuchsia-400">
              Social
            </p>

            <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-tight">
              Tu biblioteca también puede ser una
              conversación.
            </h2>

            <p className="mt-5 max-w-xl leading-8 text-zinc-400">
              Sigue a tus amigos, descubre lo que
              están viendo, leyendo y jugando, y
              participa en su actividad.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <SocialBadge
                icon={Users}
                text="Seguir amigos"
              />

              <SocialBadge
                icon={Heart}
                text="Likes"
              />

              <SocialBadge
                icon={MessageCircle}
                text="Comentarios"
              />
            </div>
          </div>

          {/* SOCIAL MOCKUP */}

          <div className="relative">
            <div className="absolute -inset-12 bg-fuchsia-500/5 blur-3xl" />

            <div className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/50">
              <div className="border-b border-zinc-800 px-6 py-5">
                <p className="font-semibold">
                  Actividad reciente
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Personas que sigues
                </p>
              </div>

              <div className="divide-y divide-zinc-800">
                <SocialActivity
                  initial="H"
                  username="Heather"
                  badge="Owner"
                  text="terminó de ver"
                  title="Interstellar"
                  likes={8}
                  comments={4}
                />

                <SocialActivity
                  initial="M"
                  username="Mika"
                  text="empezó"
                  title="Cowboy Bebop"
                  likes={3}
                  comments={1}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}

      <section className="relative px-5 pb-24 sm:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/15 via-zinc-900 to-zinc-950 px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Empieza tu biblioteca.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            Registra lo que disfrutas y descubre qué
            están viendo, leyendo y jugando tus
            amigos.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-6 py-3.5 font-semibold text-white transition hover:bg-fuchsia-400"
            >
              Crear cuenta

              <ArrowRight
                size={18}
              />
            </Link>

            <Link
              href="/auth?mode=login"
              className="inline-flex items-center rounded-xl border border-zinc-800 bg-zinc-900/70 px-6 py-3.5 font-medium text-zinc-200 transition hover:bg-zinc-900"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="relative border-t border-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-medium text-zinc-500">
            Media Tracker
          </span>

          <span>
            Pre-Alpha
          </span>
        </div>
      </footer>
    </div>
  );
}

function MediaCover({
  media,
  icon: Icon,
  label,
  className,
}: {
  media: LandingCover;

  icon: React.ComponentType<{
    size?: number;
  }>;

  label: string;

  className: string;
}) {
  return (
    <div
      className={`absolute z-10 hidden h-48 w-32 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl sm:block ${className}`}
    >
      {media.image ? (
        <Image
          src={
            media.image
          }
          alt={
            media.title
          }
          fill
          sizes="128px"
          unoptimized={
            shouldUseOriginalImage(
              media.image
            )
          }
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-600">
          <Icon
            size={30}
          />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-3 pb-3 pt-10">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400">
          <Icon
            size={11}
          />

          {label}
        </div>

        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-4 text-white">
          {media.title}
        </p>
      </div>
    </div>
  );
}

function MiniBadge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{
    size?: number;
  }>;

  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-400">
      <Icon
        size={15}
      />

      {label}
    </div>
  );
}

function PreviewFeature({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-sm text-zinc-400">
      {children}
    </div>
  );
}

function ActivityPreview({
  initial,
  name,
  action,
  title,
  accent,
  likes,
  comments,
}: {
  initial: string;
  name: string;
  action: string;
  title: string;
  accent: string;
  likes: number;
  comments: number;
}) {
  return (
    <div className="flex gap-4 py-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold ${accent}`}
      >
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <p className="leading-6">
          <span className="font-semibold text-zinc-200">
            {name}
          </span>{" "}

          <span className="text-zinc-500">
            {action}
          </span>{" "}

          <span className="font-medium text-zinc-300">
            {title}
          </span>
        </p>

        <div className="mt-3 flex gap-5 text-sm text-zinc-600">
          <span className="flex items-center gap-1.5">
            <Heart
              size={15}
            />

            {likes}
          </span>

          <span className="flex items-center gap-1.5">
            <MessageCircle
              size={15}
            />

            {comments}
          </span>
        </div>
      </div>
    </div>
  );
}

function SocialBadge({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{
    size?: number;
  }>;

  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-400">
      <Icon
        size={15}
      />

      {text}
    </div>
  );
}

function SocialActivity({
  initial,
  username,
  badge,
  text,
  title,
  likes,
  comments,
}: {
  initial: string;
  username: string;
  badge?: string;
  text: string;
  title: string;
  likes: number;
  comments: number;
}) {
  return (
    <div className="flex gap-4 p-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/15 font-semibold text-fuchsia-300">
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-zinc-100">
            {username}
          </span>

          {badge && (
            <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] text-fuchsia-300">
              {badge}
            </span>
          )}

          <span className="text-sm text-zinc-600">
            · ahora
          </span>
        </div>

        <p className="mt-2 text-zinc-400">
          {text}{" "}

          <span className="font-medium text-zinc-100">
            {title}
          </span>
        </p>

        <div className="mt-4 flex gap-5 text-sm text-zinc-500">
          <span className="flex items-center gap-2">
            <Heart
              size={17}
            />

            {likes}
          </span>

          <span className="flex items-center gap-2">
            <MessageCircle
              size={17}
            />

            {comments}
          </span>
        </div>
      </div>
    </div>
  );
}