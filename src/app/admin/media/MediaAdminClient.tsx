"use client";

import {
  ExternalLink,
  ImagePlus,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Upload,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import {
  ChangeEvent,
  FormEvent,
  useRef,
  useState,
} from "react";

import {
  createClient,
} from "@/lib/supabase/client";

type MediaType =
  | "movie"
  | "series"
  | "game"
  | "book";

type SearchKind =
  | "game"
  | "movie"
  | "series"
  | "book";

type SearchResult = {
  key:
    string;

  title:
    string;

  kind:
    SearchKind;

  image:
    | string
    | null;

  year:
    | number
    | null;

  href:
    string;

  subtitle?:
    string;
};

type AssetOption = {
  url:
    string;

  type:
    | "poster"
    | "backdrop";

  label:
    string;

  width?:
    number;

  height?:
    number;
};

type ApiOverride = {
  poster_url:
    | string
    | null;

  backdrop_url:
    | string
    | null;

  poster_position_x:
    number;

  poster_position_y:
    number;

  poster_zoom:
    number;

  backdrop_position_x:
    number;

  backdrop_position_y:
    number;

  backdrop_zoom:
    number;
};

type AssetResponse = {
  automaticPoster:
    | string
    | null;

  automaticBackdrop:
    | string
    | null;

  assets:
    AssetOption[];

  override:
    ApiOverride |
    null;
};

const MAX_FILE_SIZE =
  10 *
  1024 *
  1024;

const ACCEPTED_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

function getMediaType(
  kind:
    SearchResult["kind"]
): MediaType {
  return kind;
}

function getExternalId(
  result:
    SearchResult
) {
  return result.key
    .split(":")
    .slice(1)
    .join(":");
}

function getExtension(
  file:
    File
) {
  if (
    file.type ===
    "image/png"
  ) {
    return "png";
  }

  if (
    file.type ===
    "image/webp"
  ) {
    return "webp";
  }

  return "jpg";
}

export default function MediaAdminClient() {
  const [
    supabase,
  ] =
    useState(
      () =>
        createClient()
    );

  const bannerInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const posterInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    query,
    setQuery,
  ] =
    useState("");

  const [
    searching,
    setSearching,
  ] =
    useState(false);

  const [
    results,
    setResults,
  ] =
    useState<
      SearchResult[]
    >([]);

  const [
    selected,
    setSelected,
  ] =
    useState<
      SearchResult |
      null
    >(null);

  const [
    loadingMedia,
    setLoadingMedia,
  ] =
    useState(false);

  const [
    assets,
    setAssets,
  ] =
    useState<
      AssetOption[]
    >([]);

  const [
    automaticBackdrop,
    setAutomaticBackdrop,
  ] =
    useState<
      string |
      null
    >(null);

  const [
    automaticPoster,
    setAutomaticPoster,
  ] =
    useState<
      string |
      null
    >(null);

  const [
    backdropUrl,
    setBackdropUrl,
  ] =
    useState<
      string |
      null
    >(null);

  const [
    posterUrl,
    setPosterUrl,
  ] =
    useState<
      string |
      null
    >(null);

  const [
    backdropPositionX,
    setBackdropPositionX,
  ] =
    useState(50);

  const [
    backdropPositionY,
    setBackdropPositionY,
  ] =
    useState(50);

  const [
    backdropZoom,
    setBackdropZoom,
  ] =
    useState(1);

  const [
    posterPositionX,
    setPosterPositionX,
  ] =
    useState(50);

  const [
    posterPositionY,
    setPosterPositionY,
  ] =
    useState(50);

  const [
    posterZoom,
    setPosterZoom,
  ] =
    useState(1);

  const [
    uploading,
    setUploading,
  ] =
    useState<
      "backdrop" |
      "poster" |
      null
    >(null);

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

  const visibleBackdrop =
    backdropUrl ??
    automaticBackdrop;

  const visiblePoster =
    posterUrl ??
    automaticPoster ??
    selected?.image ??
    null;

  const backdropAssets =
    assets.filter(
      (
        asset
      ) =>
        asset.type ===
        "backdrop"
    );

  const posterAssets =
    assets.filter(
      (
        asset
      ) =>
        asset.type ===
        "poster"
    );

  async function searchMedia(
    event:
      FormEvent
  ) {
    event.preventDefault();

    const clean =
      query.trim();

    if (
      clean.length <
      2
    ) {
      return;
    }

    setSearching(
      true
    );

    setResults(
      []
    );

    setSelected(
      null
    );

    setMessage(
      ""
    );

    try {
      const [
        games,
        screen,
        books,
      ] =
        await Promise.all([
          fetch(
            `/api/search-suggestions?q=${encodeURIComponent(
              clean
            )}&source=games`
          ),

          fetch(
            `/api/search-suggestions?q=${encodeURIComponent(
              clean
            )}&source=screen`
          ),

          fetch(
            `/api/search-suggestions?q=${encodeURIComponent(
              clean
            )}&source=books`
          ),
        ]);

      const [
        gamesData,
        screenData,
        booksData,
      ] =
        await Promise.all([
          games.json(),
          screen.json(),
          books.json(),
        ]);

      setResults([
        ...(
          screenData.results ??
          []
        ),

        ...(
          gamesData.results ??
          []
        ),

        ...(
          booksData.results ??
          []
        ),
      ]);
    } catch (
      error
    ) {
      console.error(
        error
      );

      setMessage(
        "Error buscando contenido."
      );
    } finally {
      setSearching(
        false
      );
    }
  }

  async function chooseResult(
    result:
      SearchResult
  ) {
    setSelected(
      result
    );

    setLoadingMedia(
      true
    );

    setMessage(
      ""
    );

    setAssets(
      []
    );

    const externalId =
      getExternalId(
        result
      );

    try {
      const response =
        await fetch(
          `/api/admin/media-assets?kind=${result.kind}&id=${encodeURIComponent(
            externalId
          )}`,
          {
            cache:
              "no-store",
          }
        );

      if (
        !response.ok
      ) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data =
        (
          await response.json()
        ) as AssetResponse;

      setAssets(
        data.assets ??
        []
      );

      setAutomaticBackdrop(
        data.automaticBackdrop ??
        null
      );

      setAutomaticPoster(
        data.automaticPoster ??
        result.image ??
        null
      );

      setBackdropUrl(
        data.override
          ?.backdrop_url ??
        null
      );

      setPosterUrl(
        data.override
          ?.poster_url ??
        null
      );

      setBackdropPositionX(
        Number(
          data.override
            ?.backdrop_position_x ??
          50
        )
      );

      setBackdropPositionY(
        Number(
          data.override
            ?.backdrop_position_y ??
          50
        )
      );

      setBackdropZoom(
        Number(
          data.override
            ?.backdrop_zoom ??
          1
        )
      );

      setPosterPositionX(
        Number(
          data.override
            ?.poster_position_x ??
          50
        )
      );

      setPosterPositionY(
        Number(
          data.override
            ?.poster_position_y ??
          50
        )
      );

      setPosterZoom(
        Number(
          data.override
            ?.poster_zoom ??
          1
        )
      );
    } catch (
      error
    ) {
      console.error(
        error
      );

      setMessage(
        "No se pudieron cargar los artworks."
      );
    } finally {
      setLoadingMedia(
        false
      );
    }
  }

  async function uploadImage(
    file:
      File,

    type:
      "backdrop" |
      "poster"
  ) {
    if (
      !selected
    ) {
      return;
    }

    if (
      !ACCEPTED_TYPES.has(
        file.type
      )
    ) {
      setMessage(
        "Solo se permiten JPG, PNG y WebP."
      );

      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setMessage(
        "La imagen no puede superar los 10 MB."
      );

      return;
    }

    setUploading(
      type
    );

    setMessage(
      ""
    );

    const externalId =
      getExternalId(
        selected
      );

    const mediaType =
      getMediaType(
        selected.kind
      ).toLowerCase();

    const extension =
      getExtension(
        file
      );

    const path =
      `${mediaType}/${externalId}/${type}-${Date.now()}.${extension}`;

    const {
      error,
    } =
      await supabase.storage
        .from(
          "media-artwork"
        )
        .upload(
          path,
          file,
          {
            cacheControl:
              "3600",

            upsert:
              false,
          }
        );

    if (
      error
    ) {
      console.error(
        error
      );

      setMessage(
        `Error: ${error.message}`
      );

      setUploading(
        null
      );

      return;
    }

    const {
      data,
    } =
      supabase.storage
        .from(
          "media-artwork"
        )
        .getPublicUrl(
          path
        );

    if (
      type ===
      "backdrop"
    ) {
      setBackdropUrl(
        data.publicUrl
      );

      setBackdropPositionX(
        50
      );

      setBackdropPositionY(
        50
      );

      setBackdropZoom(
        1
      );
    } else {
      setPosterUrl(
        data.publicUrl
      );

      setPosterPositionX(
        50
      );

      setPosterPositionY(
        50
      );

      setPosterZoom(
        1
      );
    }

    setMessage(
      "Imagen subida. Guarda los cambios para aplicarla."
    );

    setUploading(
      null
    );
  }

  function handleUpload(
    event:
      ChangeEvent<HTMLInputElement>,

    type:
      "backdrop" |
      "poster"
  ) {
    const file =
      event.target.files?.[0];

    event.target.value =
      "";

    if (!file) {
      return;
    }

    void uploadImage(
      file,
      type
    );
  }

  async function saveOverride() {
    if (
      !selected
    ) {
      return;
    }

    setSaving(
      true
    );

    setMessage(
      ""
    );

    const mediaType =
      getMediaType(
        selected.kind
      );

    const externalId =
      getExternalId(
        selected
      );

    const {
      error,
    } =
      await supabase
        .from(
          "media_artwork_overrides"
        )
        .upsert(
          {
            media_type:
              mediaType,

            external_id:
              externalId,

            title:
              selected.title,

            /*
             * null = usar la imagen automática.
             */
            backdrop_url:
              backdropUrl,

            poster_url:
              posterUrl,

            backdrop_position_x:
              backdropPositionX,

            backdrop_position_y:
              backdropPositionY,

            backdrop_zoom:
              backdropZoom,

            poster_position_x:
              posterPositionX,

            poster_position_y:
              posterPositionY,

            poster_zoom:
              posterZoom,

            updated_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "media_type,external_id",
          }
        );

    if (
      error
    ) {
      console.error(
        error
      );

      setMessage(
        `Error: ${error.message}`
      );

      setSaving(
        false
      );

      return;
    }

    setMessage(
      "Cambios guardados."
    );

    setSaving(
      false
    );
  }

  async function restoreAutomatic() {
    if (
      !selected
    ) {
      return;
    }

    setSaving(
      true
    );

    const mediaType =
      getMediaType(
        selected.kind
      );

    const externalId =
      getExternalId(
        selected
      );

    const {
      error,
    } =
      await supabase
        .from(
          "media_artwork_overrides"
        )
        .delete()
        .eq(
          "media_type",
          mediaType
        )
        .eq(
          "external_id",
          externalId
        );

    if (
      error
    ) {
      setMessage(
        `Error: ${error.message}`
      );

      setSaving(
        false
      );

      return;
    }

    setBackdropUrl(
      null
    );

    setPosterUrl(
      null
    );

    setBackdropPositionX(
      50
    );

    setBackdropPositionY(
      50
    );

    setBackdropZoom(
      1
    );

    setPosterPositionX(
      50
    );

    setPosterPositionY(
      50
    );

    setPosterZoom(
      1
    );

    setMessage(
      "Imagen automática restaurada."
    );

    setSaving(
      false
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
      {/* SEARCH */}

      <aside>
        <form
          onSubmit={
            searchMedia
          }
          className="relative"
        >
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
          />

          <input
            value={
              query
            }
            onChange={(
              event
            ) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Buscar título..."
            className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pl-10 pr-4 text-sm text-zinc-200 outline-none focus:border-fuchsia-500"
          />
        </form>

        {searching && (
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
            <Loader2
              size={15}
              className="animate-spin"
            />

            Buscando...
          </div>
        )}

        <div className="mt-4 space-y-2">
          {results.map(
            (
              result
            ) => (
              <button
                key={
                  result.key
                }
                type="button"
                onClick={() => {
                  void chooseResult(
                    result
                  );
                }}
                className={`flex w-full gap-3 rounded-xl border p-2 text-left transition ${
                  selected?.key ===
                  result.key
                    ? "border-fuchsia-500/30 bg-fuchsia-500/5"
                    : "border-transparent hover:border-zinc-800 hover:bg-zinc-900"
                }`}
              >
                <div className="relative h-[72px] w-12 shrink-0 overflow-hidden rounded-md bg-zinc-900">
                  {result.image && (
                    <Image
                      src={
                        result.image
                      }
                      alt=""
                      fill
                      unoptimized
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 py-1">
                  <p className="line-clamp-2 text-sm font-medium text-zinc-200">
                    {
                      result.title
                    }
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {
                      result.kind
                    }

                    {result.year
                      ? ` · ${result.year}`
                      : ""}
                  </p>
                </div>
              </button>
            )
          )}
        </div>
      </aside>

      {/* EDITOR */}

      {!selected ? (
        <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-dashed border-zinc-800 text-sm text-zinc-700">
          Busca y selecciona un título.
        </div>
      ) : loadingMedia ? (
        <div className="flex min-h-[500px] items-center justify-center">
          <Loader2
            size={26}
            className="animate-spin text-fuchsia-400"
          />
        </div>
      ) : (
        <section>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-fuchsia-400">
                {
                  getMediaType(
                    selected.kind
                  )
                }
              </p>

              <h2 className="mt-1 text-2xl font-bold text-zinc-100">
                {
                  selected.title
                }
              </h2>
            </div>

            <Link
              href={
                selected.href
              }
              target="_blank"
              className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-500 transition hover:text-white"
            >
              <ExternalLink
                size={15}
              />

              Abrir ficha
            </Link>
          </div>

          {/* BACKDROP */}

          <div className="mt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-zinc-200">
                  Banner
                </h3>

                <p className="mt-1 text-xs text-zinc-600">
                  Ajusta exactamente cómo aparecerá en Media Tracker.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBackdropUrl(
                      null
                    );

                    setBackdropPositionX(
                      50
                    );

                    setBackdropPositionY(
                      50
                    );

                    setBackdropZoom(
                      1
                    );
                  }}
                  className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
                >
                  Usar automático
                </button>

                <button
                  type="button"
                  disabled={
                    uploading ===
                    "backdrop"
                  }
                  onClick={() =>
                    bannerInputRef.current?.click()
                  }
                  className="flex items-center gap-2 rounded-lg bg-fuchsia-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
                >
                  {uploading ===
                  "backdrop" ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Upload
                      size={14}
                    />
                  )}

                  Subir desde PC
                </button>
              </div>
            </div>

            <input
              ref={
                bannerInputRef
              }
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(
                event
              ) =>
                handleUpload(
                  event,
                  "backdrop"
                )
              }
            />

            <div className="relative mt-4 aspect-[16/6] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              {visibleBackdrop ? (
                <Image
                  src={
                    visibleBackdrop
                  }
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  style={{
                    objectPosition:
                      `${backdropPositionX}% ${backdropPositionY}%`,

                    transform:
                      `scale(${backdropZoom})`,
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-700">
                  No hay banner disponible.
                </div>
              )}

              <div className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-zinc-950/90 via-zinc-950/30 to-transparent" />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
            </div>

            <div className="mt-5 grid gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 md:grid-cols-3">
              <RangeControl
                label="Posición X"
                value={
                  backdropPositionX
                }
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={
                  setBackdropPositionX
                }
              />

              <RangeControl
                label="Posición Y"
                value={
                  backdropPositionY
                }
                min={0}
                max={100}
                step={1}
                suffix="%"
                onChange={
                  setBackdropPositionY
                }
              />

              <RangeControl
                label="Zoom"
                value={
                  backdropZoom
                }
                min={1}
                max={2}
                step={0.01}
                suffix="×"
                onChange={
                  setBackdropZoom
                }
              />
            </div>

            {/* API ARTWORKS */}

            {backdropAssets.length >
              0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-zinc-600">
                  Imágenes disponibles
                </p>

                <div className="flex gap-3 overflow-x-auto pb-3">
                  {automaticBackdrop && (
                    <ArtworkButton
                      url={
                        automaticBackdrop
                      }
                      label="Automática"
                      active={
                        backdropUrl ===
                        null
                      }
                      onClick={() => {
                        setBackdropUrl(
                          null
                        );

                        setBackdropPositionX(
                          50
                        );

                        setBackdropPositionY(
                          50
                        );

                        setBackdropZoom(
                          1
                        );
                      }}
                    />
                  )}

                  {backdropAssets.map(
                    (
                      asset
                    ) => (
                      <ArtworkButton
                        key={
                          asset.url
                        }
                        url={
                          asset.url
                        }
                        label={
                          asset.label
                        }
                        active={
                          backdropUrl ===
                          asset.url
                        }
                        onClick={() => {
                          setBackdropUrl(
                            asset.url
                          );

                          setBackdropPositionX(
                            50
                          );

                          setBackdropPositionY(
                            50
                          );

                          setBackdropZoom(
                            1
                          );
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* POSTER */}

          <div className="mt-10 border-t border-zinc-800 pt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-zinc-200">
                  Portada
                </h3>

                <p className="mt-1 text-xs text-zinc-600">
                  Puedes usar la original o subir una propia.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  uploading ===
                  "poster"
                }
                onClick={() =>
                  posterInputRef.current?.click()
                }
                className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {uploading ===
                "poster" ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <ImagePlus
                    size={14}
                  />
                )}

                Subir desde PC
              </button>
            </div>

            <input
              ref={
                posterInputRef
              }
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(
                event
              ) =>
                handleUpload(
                  event,
                  "poster"
                )
              }
            />

            <div className="mt-5 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                {visiblePoster ? (
                  <Image
                    src={
                      visiblePoster
                    }
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    style={{
                      objectPosition:
                        `${posterPositionX}% ${posterPositionY}%`,

                      transform:
                        `scale(${posterZoom})`,
                    }}
                  />
                ) : null}
              </div>

              <div>
                <div className="grid gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 md:grid-cols-3">
                  <RangeControl
                    label="Posición X"
                    value={
                      posterPositionX
                    }
                    min={0}
                    max={100}
                    step={1}
                    suffix="%"
                    onChange={
                      setPosterPositionX
                    }
                  />

                  <RangeControl
                    label="Posición Y"
                    value={
                      posterPositionY
                    }
                    min={0}
                    max={100}
                    step={1}
                    suffix="%"
                    onChange={
                      setPosterPositionY
                    }
                  />

                  <RangeControl
                    label="Zoom"
                    value={
                      posterZoom
                    }
                    min={1}
                    max={2}
                    step={0.01}
                    suffix="×"
                    onChange={
                      setPosterZoom
                    }
                  />
                </div>

                {posterAssets.length >
                  0 && (
                  <div className="mt-5 flex gap-3 overflow-x-auto pb-3">
                    {posterAssets.map(
                      (
                        asset
                      ) => (
                        <PosterButton
                          key={
                            asset.url
                          }
                          url={
                            asset.url
                          }
                          active={
                            posterUrl ===
                            asset.url
                          }
                          onClick={() => {
                            setPosterUrl(
                              asset.url
                            );

                            setPosterPositionX(
                              50
                            );

                            setPosterPositionY(
                              50
                            );

                            setPosterZoom(
                              1
                            );
                          }}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SAVE */}

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-6">
            <button
              type="button"
              onClick={() => {
                void restoreAutomatic();
              }}
              disabled={
                saving
              }
              className="flex h-10 items-center gap-2 rounded-xl border border-zinc-800 px-4 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              <RotateCcw
                size={16}
              />

              Restaurar todo
            </button>

            <button
              type="button"
              disabled={
                saving ||
                uploading !==
                  null
              }
              onClick={() => {
                void saveOverride();
              }}
              className="flex h-10 items-center gap-2 rounded-xl bg-fuchsia-500 px-4 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save
                  size={16}
                />
              )}

              Guardar
            </button>

            {message && (
              <p
                className={`text-sm ${
                  message.startsWith(
                    "Error:"
                  )
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {
                  message
                }
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label:
    string;

  value:
    number;

  min:
    number;

  max:
    number;

  step:
    number;

  suffix:
    string;

  onChange: (
    value:
      number
  ) => void;
}) {
  return (
    <label>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-zinc-500">
          {
            label
          }
        </span>

        <span className="font-mono text-xs text-zinc-400">
          {
            Number.isInteger(
              value
            )
              ? value
              : value.toFixed(
                  2
                )}
          {
            suffix
          }
        </span>
      </div>

      <input
        type="range"
        min={
          min
        }
        max={
          max
        }
        step={
          step
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            Number(
              event.target.value
            )
          )
        }
        className="mt-3 w-full accent-fuchsia-500"
      />
    </label>
  );
}

function ArtworkButton({
  url,
  label,
  active,
  onClick,
}: {
  url:
    string;

  label:
    string;

  active:
    boolean;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`w-44 shrink-0 overflow-hidden rounded-xl border text-left transition ${
        active
          ? "border-fuchsia-400"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <div className="relative aspect-video bg-zinc-900">
        <Image
          src={
            url
          }
          alt=""
          fill
          unoptimized
          className="object-cover"
        />
      </div>

      <p className="truncate bg-zinc-950 px-2 py-2 text-[11px] text-zinc-500">
        {
          label
        }
      </p>
    </button>
  );
}

function PosterButton({
  url,
  active,
  onClick,
}: {
  url:
    string;

  active:
    boolean;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg border transition ${
        active
          ? "border-fuchsia-400"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <Image
        src={
          url
        }
        alt=""
        fill
        unoptimized
        className="object-cover"
      />
    </button>
  );
}