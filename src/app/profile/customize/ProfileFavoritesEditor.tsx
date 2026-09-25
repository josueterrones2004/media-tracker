"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

type MediaType =
  | "MOVIE"
  | "SERIES"
  | "BOOK";

type FavoriteMediaType =
  | MediaType
  | "GAME";

type SearchResult = {
  media_type: MediaType;

  external_id: string;

  title: string;

  cover_url: string | null;

  year: string | null;

  subtitle: string | null;
};

type Favorite = {
  id: string;

  media_type: FavoriteMediaType;

  external_id: string;

  title: string;

  cover_url: string | null;

  position: number;
};

interface ProfileFavoritesEditorProps {
  userId: string;

  initialFavorites: Favorite[];
}

const CATEGORIES: {
  type: MediaType;
  label: string;
  placeholder: string;
}[] = [
  {
    type: "MOVIE",
    label: "Películas",
    placeholder:
      "Buscar películas...",
  },
  {
    type: "SERIES",
    label: "Series",
    placeholder:
      "Buscar series...",
  },
  {
    type: "BOOK",
    label: "Libros",
    placeholder:
      "Buscar libros...",
  },
];

export default function ProfileFavoritesEditor({
  userId,
  initialFavorites,
}: ProfileFavoritesEditorProps) {
  const router =
    useRouter();

  const [supabase] =
    useState(() =>
      createClient()
    );

  const [
    selectedType,
    setSelectedType,
  ] =
    useState<MediaType>(
      "MOVIE"
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    results,
    setResults,
  ] =
    useState<
      SearchResult[]
    >([]);

  const [
    searching,
    setSearching,
  ] =
    useState(false);

  const [
    searchError,
    setSearchError,
  ] =
    useState("");

  const [
    favorites,
    setFavorites,
  ] =
    useState<Favorite[]>(
      initialFavorites
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const category =
    CATEGORIES.find(
      (item) =>
        item.type ===
        selectedType
    )!;

  const selectedFavorites =
    useMemo(
      () =>
        favorites
          .filter(
            (favorite) =>
              favorite.media_type ===
              selectedType
          )
          .sort(
            (a, b) =>
              a.position -
              b.position
          ),
      [
        favorites,
        selectedType,
      ]
    );

  /*
   * BÚSQUEDA CON DEBOUNCE
   */
  useEffect(() => {
    const cleanQuery =
      search.trim();

    if (
      cleanQuery.length < 2
    ) {
      setResults([]);
      setSearching(
        false
      );
      setSearchError(
        ""
      );

      return;
    }

    const controller =
      new AbortController();

    const timeout =
      window.setTimeout(
        async () => {
          setSearching(
            true
          );

          setSearchError(
            ""
          );

          try {
            const params =
              new URLSearchParams(
                {
                  q: cleanQuery,
                  type:
                    selectedType,
                }
              );

            const response =
              await fetch(
                `/api/favorites-search?${params.toString()}`,
                {
                  signal:
                    controller.signal,
                }
              );

            const data =
              await response.json();

            if (
              !response.ok
            ) {
              throw new Error(
                data.error ??
                  "Error en la búsqueda."
              );
            }

            setResults(
              data.results ??
                []
            );
          } catch (
            error
          ) {
            if (
              error instanceof
                DOMException &&
              error.name ===
                "AbortError"
            ) {
              return;
            }

            setSearchError(
              error instanceof
                Error
                ? error.message
                : "No se pudo realizar la búsqueda."
            );

            setResults(
              []
            );
          } finally {
            if (
              !controller
                .signal
                .aborted
            ) {
              setSearching(
                false
              );
            }
          }
        },
        350
      );

    return () => {
      window.clearTimeout(
        timeout
      );

      controller.abort();
    };
  }, [
    search,
    selectedType,
  ]);

  const availableResults =
    useMemo(
      () =>
        results.filter(
          (result) =>
            !favorites.some(
              (favorite) =>
                favorite.media_type ===
                  result.media_type &&
                favorite.external_id ===
                  result.external_id
            )
        ),
      [
        results,
        favorites,
      ]
    );

  function selectCategory(
    type: MediaType
  ) {
    setSelectedType(
      type
    );

    setSearch("");
    setResults([]);
    setSearchError("");
    setMessage("");
  }

  function addFavorite(
    result: SearchResult
  ) {
    if (
      selectedFavorites.length >=
      6
    ) {
      setMessage(
        "Solo puedes tener 6 favoritos por categoría."
      );

      return;
    }

    const exists =
      favorites.some(
        (favorite) =>
          favorite.media_type ===
            result.media_type &&
          favorite.external_id ===
            result.external_id
      );

    if (exists) {
      return;
    }

    setFavorites(
      (current) => [
        ...current,
        {
          id: `temp-${result.media_type}-${result.external_id}`,

          media_type:
            result.media_type,

          external_id:
            result.external_id,

          title:
            result.title,

          cover_url:
            result.cover_url,

          position:
            selectedFavorites.length +
            1,
        },
      ]
    );

    setMessage("");
  }

  function removeFavorite(
    externalId: string
  ) {
    setFavorites(
      (current) => {
        const others =
          current.filter(
            (favorite) =>
              favorite.media_type !==
              selectedType
          );

        const currentCategory =
          current
            .filter(
              (favorite) =>
                favorite.media_type ===
                  selectedType &&
              favorite.external_id !==
                externalId
            )
            .sort(
              (a, b) =>
                a.position -
                b.position
            )
            .map(
              (
                favorite,
                index
              ) => ({
                ...favorite,
                position:
                  index + 1,
              })
            );

        return [
          ...others,
          ...currentCategory,
        ];
      }
    );
  }

  function moveFavorite(
    externalId: string,
    direction:
      | "left"
      | "right"
  ) {
    setFavorites(
      (current) => {
        const categoryFavorites =
          current
            .filter(
              (favorite) =>
                favorite.media_type ===
                selectedType
            )
            .sort(
              (a, b) =>
                a.position -
                b.position
            );

        const index =
          categoryFavorites.findIndex(
            (favorite) =>
              favorite.external_id ===
              externalId
          );

        if (
          index === -1
        ) {
          return current;
        }

        const targetIndex =
          direction ===
          "left"
            ? index - 1
            : index + 1;

        if (
          targetIndex < 0 ||
          targetIndex >=
            categoryFavorites.length
        ) {
          return current;
        }

        const reordered =
          [
            ...categoryFavorites,
          ];

        [
          reordered[index],
          reordered[
            targetIndex
          ],
        ] = [
          reordered[
            targetIndex
          ],
          reordered[index],
        ];

        const positions =
          new Map(
            reordered.map(
              (
                favorite,
                position
              ) => [
                favorite.external_id,
                position + 1,
              ]
            )
          );

        return current.map(
          (favorite) => {
            if (
              favorite.media_type !==
              selectedType
            ) {
              return favorite;
            }

            return {
              ...favorite,

              position:
                positions.get(
                  favorite.external_id
                ) ??
                favorite.position,
            };
          }
        );
      }
    );
  }

  async function saveFavorites() {
    if (saving) {
      return;
    }

    setSaving(true);

    setMessage(
      "Guardando favoritos..."
    );

    try {
      const {
        error:
          deleteError,
      } =
        await supabase
          .from(
            "profile_favorites"
          )
          .delete()
          .eq(
            "user_id",
            userId
          );

      if (
        deleteError
      ) {
        throw new Error(
          deleteError.message
        );
      }

      const mediaTypes:
        FavoriteMediaType[] =
        [
          "MOVIE",
          "SERIES",
          "BOOK",
          "GAME",
        ];

      const rows =
        mediaTypes.flatMap(
          (mediaType) =>
            favorites
              .filter(
                (favorite) =>
                  favorite.media_type ===
                  mediaType
              )
              .sort(
                (a, b) =>
                  a.position -
                  b.position
              )
              .slice(0, 6)
              .map(
                (
                  favorite,
                  index
                ) => ({
                  user_id:
                    userId,

                  media_type:
                    favorite.media_type,

                  external_id:
                    favorite.external_id,

                  title:
                    favorite.title,

                  cover_url:
                    favorite.cover_url,

                  position:
                    index + 1,
                })
              )
        );

      if (
        rows.length > 0
      ) {
        const {
          error:
            insertError,
        } =
          await supabase
            .from(
              "profile_favorites"
            )
            .insert(
              rows
            );

        if (
          insertError
        ) {
          throw new Error(
            insertError.message
          );
        }
      }

      setMessage(
        "Favoritos guardados."
      );

      router.refresh();
    } catch (
      error
    ) {
      setMessage(
        `Error: ${
          error instanceof
          Error
            ? error.message
            : "Error desconocido."
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* CATEGORÍAS */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(
          (item) => {
            const count =
              favorites.filter(
                (favorite) =>
                  favorite.media_type ===
                  item.type
              ).length;

            return (
              <button
                key={
                  item.type
                }
                type="button"
                onClick={() =>
                  selectCategory(
                    item.type
                  )
                }
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  selectedType ===
                  item.type
                    ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                {
                  item.label
                }{" "}
                {count}/6
              </button>
            );
          }
        )}
      </div>

      {/* FAVORITOS ACTUALES */}
      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-medium text-zinc-200">
            Tus favoritos
          </h3>

          <span className="text-sm text-zinc-600">
            {
              selectedFavorites.length
            }
            /6
          </span>
        </div>

        {selectedFavorites.length ===
        0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-600">
            Todavía no has elegido favoritos en esta categoría.
          </div>
        ) : (
          <div className="mt-4 flex gap-4 overflow-x-auto pb-3">
            {selectedFavorites.map(
              (
                favorite,
                index
              ) => (
                <div
                  key={`${favorite.media_type}-${favorite.external_id}`}
                  className="w-[130px] shrink-0"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                    {favorite.cover_url ? (
                      <img
                        src={
                          favorite.cover_url
                        }
                        alt={
                          favorite.title
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-zinc-600">
                        Sin portada
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeFavorite(
                          favorite.external_id
                        )
                      }
                      className="absolute right-2 top-2 rounded-full bg-black/75 p-1.5 text-white backdrop-blur transition hover:bg-red-500"
                      aria-label={`Quitar ${favorite.title}`}
                    >
                      <X
                        size={14}
                      />
                    </button>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-zinc-300">
                    {
                      favorite.title
                    }
                  </p>

                  <div className="mt-2 flex gap-1">
                    <button
                      type="button"
                      disabled={
                        index ===
                        0
                      }
                      onClick={() =>
                        moveFavorite(
                          favorite.external_id,
                          "left"
                        )
                      }
                      className="flex-1 rounded-lg border border-zinc-800 py-1.5 text-zinc-400 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Mover a la izquierda"
                    >
                      <ChevronLeft
                        size={15}
                        className="mx-auto"
                      />
                    </button>

                    <button
                      type="button"
                      disabled={
                        index ===
                        selectedFavorites.length -
                          1
                      }
                      onClick={() =>
                        moveFavorite(
                          favorite.external_id,
                          "right"
                        )
                      }
                      className="flex-1 rounded-lg border border-zinc-800 py-1.5 text-zinc-400 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Mover a la derecha"
                    >
                      <ChevronRight
                        size={15}
                        className="mx-auto"
                      />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* BUSCADOR */}
      <div className="mt-9">
        <h3 className="font-medium text-zinc-200">
          Buscar{" "}
          {
            category.label.toLowerCase()
          }
        </h3>

        <p className="mt-1 text-sm text-zinc-600">
          Puedes añadir contenido aunque todavía no esté en tu biblioteca.
        </p>

        <div className="relative mt-4">
          {searching ? (
            <Loader2
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-500"
            />
          ) : (
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
            />
          )}

          <input
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder={
              category.placeholder
            }
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-10 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:border-fuchsia-500"
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 transition hover:text-zinc-300"
              aria-label="Limpiar búsqueda"
            >
              <X
                size={17}
              />
            </button>
          )}
        </div>

        {searchError && (
          <p className="mt-3 text-sm text-red-400">
            {
              searchError
            }
          </p>
        )}

        {search.trim().length <
          2 && (
          <div className="mt-5 rounded-xl border border-dashed border-zinc-900 p-6 text-center text-sm text-zinc-700">
            Escribe al menos 2 caracteres para buscar.
          </div>
        )}

        {search.trim().length >=
          2 &&
          searching &&
          results.length ===
            0 && (
            <div className="mt-5 rounded-xl border border-zinc-900 p-8 text-center">
              <Loader2
                size={24}
                className="mx-auto animate-spin text-zinc-600"
              />

              <p className="mt-3 text-sm text-zinc-600">
                Buscando...
              </p>
            </div>
          )}

        {search.trim().length >=
          2 &&
          !searching &&
          !searchError &&
          availableResults.length ===
            0 && (
            <div className="mt-5 rounded-xl border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-600">
              No se encontraron resultados nuevos.
            </div>
          )}

        {availableResults.length >
          0 && (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {availableResults.map(
              (result) => (
                <button
                  key={`${result.media_type}-${result.external_id}`}
                  type="button"
                  disabled={
                    selectedFavorites.length >=
                    6
                  }
                  onClick={() =>
                    addFavorite(
                      result
                    )
                  }
                  className="group min-w-0 text-left disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition group-hover:border-fuchsia-500/60">
                    {result.cover_url ? (
                      <img
                        src={
                          result.cover_url
                        }
                        alt={
                          result.title
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-zinc-600">
                        Sin imagen
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/55 group-hover:opacity-100">
                      <div className="rounded-full bg-fuchsia-500 p-2 text-white">
                        <Check
                          size={19}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="line-clamp-2 text-sm font-medium text-zinc-300">
                      {
                        result.title
                      }
                    </p>

                    {(result.subtitle ||
                      result.year) && (
                      <p className="mt-1 line-clamp-1 text-xs text-zinc-600">
                        {
                          result.subtitle
                        }

                        {result.subtitle &&
                          result.year &&
                          " · "}

                        {
                          result.year
                        }
                      </p>
                    )}
                  </div>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* GUARDAR */}
      <div className="mt-9 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={
            saveFavorites
          }
          disabled={
            saving
          }
          className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-5 py-3 font-medium text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
        >
          {saving ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Check
              size={18}
            />
          )}

          {saving
            ? "Guardando..."
            : "Guardar favoritos"}
        </button>

        {message && (
          <p
            className={`text-sm ${
              message.startsWith(
                "Error:"
              )
                ? "text-red-400"
                : "text-zinc-500"
            }`}
          >
            {
              message
            }
          </p>
        )}
      </div>
    </div>
  );
}