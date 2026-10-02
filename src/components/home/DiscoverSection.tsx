"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Film,
  Gamepad2,
  Sparkles,
  Tv,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

import type {
  DiscoverItem,
  DiscoverKind,
} from "@/lib/discover";

type Filter =
  | "all"
  | DiscoverKind;

const filters: {
  value:
    Filter;

  label:
    string;
}[] = [
  {
    value:
      "all",

    label:
      "Todo",
  },

  {
    value:
      "movie",

    label:
      "Películas",
  },

  {
    value:
      "series",

    label:
      "Series",
  },

  {
    value:
      "game",

    label:
      "Juegos",
  },

  {
    value:
      "book",

    label:
      "Libros",
  },
];

const mixedOrder:
  DiscoverKind[] = [
  "movie",
  "game",
  "series",
  "book",
];

function getKindLabel(
  kind:
    DiscoverKind
) {
  if (
    kind ===
    "movie"
  ) {
    return "Película";
  }

  if (
    kind ===
    "series"
  ) {
    return "Serie";
  }

  if (
    kind ===
    "game"
  ) {
    return "Juego";
  }

  return "Libro";
}

function KindIcon({
  kind,
}: {
  kind:
    DiscoverKind;
}) {
  if (
    kind ===
    "movie"
  ) {
    return (
      <Film
        size={12}
      />
    );
  }

  if (
    kind ===
    "series"
  ) {
    return (
      <Tv
        size={12}
      />
    );
  }

  if (
    kind ===
    "game"
  ) {
    return (
      <Gamepad2
        size={12}
      />
    );
  }

  return (
    <BookOpen
      size={12}
    />
  );
}

/*
 * MIX ITEMS
 */

function interleaveItems(
  items:
    DiscoverItem[],

  maximum =
    24
) {
  const groups =
    new Map<
      DiscoverKind,
      DiscoverItem[]
    >();

  for (
    const kind of
    mixedOrder
  ) {
    groups.set(
      kind,
      items.filter(
        (
          item
        ) =>
          item.kind ===
          kind
      )
    );
  }

  const result:
    DiscoverItem[] =
    [];

  let index =
    0;

  while (
    result.length <
    maximum
  ) {
    let added =
      false;

    for (
      const kind of
      mixedOrder
    ) {
      const item =
        groups.get(
          kind
        )?.[
          index
        ];

      if (!item) {
        continue;
      }

      result.push(
        item
      );

      added =
        true;

      if (
        result.length >=
        maximum
      ) {
        break;
      }
    }

    if (!added) {
      break;
    }

    index +=
      1;
  }

  return result;
}

/*
 * HERO
 */

function getHeroSlides(
  items:
    DiscoverItem[]
) {
  const now =
    Date.now();

  const GAME_PAST_WINDOW =
    183 *
    24 *
    60 *
    60 *
    1000;

  /*
   * JUEGOS:
   *
   * - deben venir de recent releases
   * - ya deben haber sido publicados
   * - máximo 6 meses
   * - necesitan backdrop
   */

  const games =
    items
      .filter(
        (
          item
        ) => {
          if (
            item.kind !==
            "game"
          ) {
            return false;
          }

          if (
            !item.isRecentRelease
          ) {
            return false;
          }

          if (
            !item.backdrop ||
            !item.releaseTimestamp
          ) {
            return false;
          }

          return (
            item.releaseTimestamp >=
              now -
                GAME_PAST_WINDOW &&
            item.releaseTimestamp <=
              now
          );
        }
      )
      .sort(
        (
          first,
          second
        ) =>
          Math.abs(
            now -
              (
                first.releaseTimestamp ??
                0
              )
          ) -
          Math.abs(
            now -
              (
                second.releaseTimestamp ??
                0
              )
          )
      );

  const movies =
    items.filter(
      (
        item
      ) =>
        item.kind ===
          "movie" &&
        Boolean(
          item.backdrop
        )
    );

  const series =
    items.filter(
      (
        item
      ) =>
        item.kind ===
          "series" &&
        Boolean(
          item.backdrop
        )
    );

  /*
   * Intentamos mezclar medios.
   */

  const groups:
    DiscoverItem[][] = [
    movies,
    games,
    series,
  ];

  const slides:
    DiscoverItem[] =
    [];

  let index =
    0;

  while (
    slides.length <
    7
  ) {
    let added =
      false;

    for (
      const group of
      groups
    ) {
      const item =
        group[
          index
        ];

      if (!item) {
        continue;
      }

      slides.push(
        item
      );

      added =
        true;

      if (
        slides.length >=
        7
      ) {
        break;
      }
    }

    if (!added) {
      break;
    }

    index +=
      1;
  }

  return slides;
}

/*
 * COMPONENT
 */

export default function DiscoverSection({
  items,
}: {
  items:
    DiscoverItem[];
}) {
  const [
    filter,
    setFilter,
  ] =
    useState<Filter>(
      "all"
    );

  const [
    activeSlide,
    setActiveSlide,
  ] =
    useState(
      0
    );

  const [
    paused,
    setPaused,
  ] =
    useState(
      false
    );

  const [
    restartToken,
    setRestartToken,
  ] =
    useState(
      0
    );

  const heroSlides =
    useMemo(
      () =>
        getHeroSlides(
          items
        ),
      [
        items,
      ]
    );

  /*
   * No necesitamos setState en un effect
   * para corregir el índice.
   */

  const safeActiveSlide =
    heroSlides.length >
    0
      ? activeSlide %
        heroSlides.length
      : 0;

  /*
   * AUTOPLAY
   */

  useEffect(
    () => {
      if (
        paused ||
        heroSlides.length <=
          1
      ) {
        return;
      }

      if (
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      ) {
        return;
      }

      const timer =
        window.setInterval(
          () => {
            setActiveSlide(
              (
                current
              ) =>
                (
                  current +
                  1
                ) %
                heroSlides.length
            );
          },
          7000
        );

      return () =>
        window.clearInterval(
          timer
        );
    },
    [
      paused,
      heroSlides.length,
      restartToken,
    ]
  );

  /*
   * No repetimos los títulos del hero
   * inmediatamente en Tendencias.
   */

  const heroKeys =
    useMemo(
      () =>
        new Set(
          heroSlides.map(
            (
              item
            ) =>
              item.key
          )
        ),
      [
        heroSlides,
      ]
    );

  const filteredPool =
    useMemo(
      () => {
        const source =
          filter ===
          "all"
            ? interleaveItems(
                items,
                48
              )
            : items.filter(
                (
                  item
                ) =>
                  item.kind ===
                  filter
              );

        return source.filter(
          (
            item
          ) =>
            !heroKeys.has(
              item.key
            )
        );
      },
      [
        items,
        filter,
        heroKeys,
      ]
    );

  const trendingItems =
    filteredPool.slice(
      0,
      12
    );

  const recommendedItems =
    filteredPool.slice(
      12,
      24
    );

  function goToSlide(
    index:
      number
  ) {
    if (
      heroSlides.length ===
      0
    ) {
      return;
    }

    const normalized =
      (
        (
          index %
          heroSlides.length
        ) +
        heroSlides.length
      ) %
      heroSlides.length;

    setActiveSlide(
      normalized
    );

    /*
     * Reiniciamos el autoplay después
     * de navegación manual.
     */

    setRestartToken(
      (
        current
      ) =>
        current +
        1
    );
  }

  if (
    items.length ===
    0
  ) {
    return null;
  }

  const currentHero =
    heroSlides[
      safeActiveSlide
    ];

  return (
    <div className="min-w-0">
      {/* ======================================
          ESTRENOS Y NOVEDADES
      ====================================== */}

      {currentHero && (
        <section className="min-w-0">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Sparkles
                size={16}
                className="text-fuchsia-400"
              />

              <h2 className="text-[15px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                Estrenos y novedades
              </h2>
            </div>

            <p className="mt-1 text-sm text-zinc-600">
              Nuevos títulos para ver, jugar y descubrir
            </p>
          </div>

          <div
            onMouseEnter={() =>
              setPaused(
                true
              )
            }
            onMouseLeave={() =>
              setPaused(
                false
              )
            }
            className="relative"
          >
            {/* FLYER */}

            <Link
              key={
                currentHero.key
              }
              href={
                currentHero.href
              }
              className="group relative block h-[350px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 sm:h-[410px] lg:h-[470px]"
            >
              {currentHero.backdrop ? (
                <Image
                  src={
                    currentHero.backdrop
                  }
                  alt={
                    currentHero.title
                  }
                  fill
                  priority
                  sizes="100vw"
                  unoptimized={
                    shouldUseOriginalImage(
                      currentHero.backdrop
                    )
                  }
                  className="object-cover transition duration-700 group-hover:scale-[1.01]"
                  style={{
                    objectPosition:
                      `${currentHero.backdropPositionX}% ${currentHero.backdropPositionY}%`,

                    /*
                     * Aquí se aplica el zoom
                     * guardado desde /admin/media.
                     *
                     * El pequeño hover se realiza
                     * vía clase únicamente cuando
                     * no hay un transform inline,
                     * así que usamos scale aquí.
                     */
                    transform:
                      `scale(${currentHero.backdropZoom})`,
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-zinc-900" />
              )}

              {/*
                Solo dejamos degradado izquierdo
                e inferior.

                La derecha queda limpia para
                conservar el color del artwork.
              */}

              <div className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-zinc-950/90 via-zinc-950/30 to-transparent" />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

              {/* INFO */}

              <div className="absolute inset-x-0 bottom-0 z-10 px-16 pb-7 pt-8 sm:px-20 sm:pb-9 lg:px-24 lg:pb-10">
                <div className="max-w-[760px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-zinc-300 backdrop-blur">
                      <KindIcon
                        kind={
                          currentHero.kind
                        }
                      />

                      {getKindLabel(
                        currentHero.kind
                      )}
                    </span>

                    {currentHero.year && (
                      <span className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[11px] text-zinc-400 backdrop-blur">
                        {
                          currentHero.year
                        }
                      </span>
                    )}

                    <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-400/10 px-2.5 py-1 text-[11px] font-medium text-fuchsia-300 backdrop-blur">
                      Novedad
                    </span>
                  </div>

                  <h3 className="mt-3 line-clamp-2 max-w-[700px] text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {
                      currentHero.title
                    }
                  </h3>

                  {currentHero.description ? (
                    <p className="mt-3 line-clamp-2 max-w-[720px] text-sm leading-6 text-zinc-300 sm:text-base sm:leading-7">
                      {
                        currentHero.description
                      }
                    </p>
                  ) : currentHero.meta ? (
                    <p className="mt-3 max-w-[720px] truncate text-sm text-zinc-400 sm:text-base">
                      {
                        currentHero.meta
                      }
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>

            {/* ARROWS */}

            {heroSlides.length >
              1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    goToSlide(
                      safeActiveSlide -
                        1
                    )
                  }
                  className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white shadow-lg shadow-black/30 backdrop-blur-md transition hover:scale-105 hover:bg-black/80 sm:left-4 sm:h-11 sm:w-11 lg:left-5"
                  aria-label="Estreno anterior"
                >
                  <ArrowLeft
                    size={19}
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    goToSlide(
                      safeActiveSlide +
                        1
                    )
                  }
                  className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white shadow-lg shadow-black/30 backdrop-blur-md transition hover:scale-105 hover:bg-black/80 sm:right-4 sm:h-11 sm:w-11 lg:right-5"
                  aria-label="Siguiente estreno"
                >
                  <ArrowRight
                    size={19}
                  />
                </button>
              </>
            )}
          </div>

          {/* DOTS */}

          {heroSlides.length >
            1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {heroSlides.map(
                (
                  item,
                  index
                ) => {
                  const active =
                    index ===
                    safeActiveSlide;

                  return (
                    <button
                      key={
                        item.key
                      }
                      type="button"
                      onClick={() =>
                        goToSlide(
                          index
                        )
                      }
                      aria-label={`Mostrar ${item.title}`}
                      aria-current={
                        active
                          ? "true"
                          : undefined
                      }
                      className={`h-2 rounded-full transition-all ${
                        active
                          ? "w-6 bg-fuchsia-400"
                          : "w-2 bg-zinc-700 hover:bg-zinc-500"
                      }`}
                    />
                  );
                }
              )}
            </div>
          )}
        </section>
      )}

      {/* ======================================
          TENDENCIAS
      ====================================== */}

      <section className="mt-12 min-w-0">
        <div className="mb-4 border-b border-zinc-800 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
                Tendencias
              </h2>

              <p className="mt-1 text-sm text-zinc-600">
                Lo que está destacando ahora
              </p>
            </div>

            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
              {filters.map(
                (
                  option
                ) => {
                  const active =
                    filter ===
                    option.value;

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      onClick={() =>
                        setFilter(
                          option.value
                        )
                      }
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                        active
                          ? "bg-fuchsia-500/15 text-fuchsia-300"
                          : "text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300"
                      }`}
                    >
                      {
                        option.label
                      }
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {trendingItems.length >
          0 ? (
          <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-x-4">
            {trendingItems.map(
              (
                item
              ) => (
                <PosterItem
                  key={
                    item.key
                  }
                  item={
                    item
                  }
                />
              )
            )}
          </div>
        ) : (
          <p className="py-8 text-sm text-zinc-700">
            No hay resultados para este filtro.
          </p>
        )}
      </section>

      {/* ======================================
          RECOMENDACIONES
      ====================================== */}

      {recommendedItems.length >
        0 && (
        <section className="mt-12 min-w-0">
          <div className="mb-4 border-b border-zinc-800 pb-3">
            <h2 className="text-[15px] font-semibold uppercase tracking-[0.16em] text-zinc-300">
              Recomendaciones
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
              Más títulos que podrían interesarte
            </p>
          </div>

          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible lg:px-0">
            {recommendedItems.map(
              (
                item
              ) => (
                <div
                  key={
                    item.key
                  }
                  className="w-[135px] shrink-0 sm:w-[150px] lg:w-auto"
                >
                  <PosterItem
                    item={
                      item
                    }
                  />
                </div>
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/*
 * POSTER CARD
 */

function PosterItem({
  item,
}: {
  item:
    DiscoverItem;
}) {
  return (
    <Link
      href={
        item.href
      }
      className="group block min-w-0"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition group-hover:border-zinc-600">
        {item.image ? (
          <Image
            src={
              item.image
            }
            alt={
              item.title
            }
            fill
            sizes="180px"
            unoptimized={
              shouldUseOriginalImage(
                item.image
              )
            }
            className="object-cover transition duration-300"
            style={{
              objectPosition:
                `${item.imagePositionX}% ${item.imagePositionY}%`,

              transform:
                `scale(${item.imageZoom})`,
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-xs text-zinc-700">
            Sin imagen
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/80 to-transparent" />

        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-1 text-[9px] font-medium text-zinc-300 backdrop-blur">
          <KindIcon
            kind={
              item.kind
            }
          />

          {getKindLabel(
            item.kind
          )}
        </span>
      </div>

      <h3 className="mt-2 line-clamp-2 min-h-9 text-xs font-medium leading-[18px] text-zinc-400 transition group-hover:text-white sm:text-[13px]">
        {
          item.title
        }
      </h3>

      <p className="mt-0.5 truncate text-[11px] text-zinc-700">
        {item.year
          ? `${item.year}${
              item.kind ===
                "book" &&
              item.meta
                ? ` · ${item.meta}`
                : ""
            }`
          : item.meta ??
            getKindLabel(
              item.kind
            )}
      </p>
    </Link>
  );
}