import {
  ImageOff,
} from "lucide-react";

import Image from "next/image";

import {
  type ReactNode,
} from "react";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

export type MediaInformationItem = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
};

export type MediaHeroMode =
  | "backdrop"
  | "compact";

export interface MediaDetailLayoutProps {
  title: string;

  eyebrow: string;

  coverUrl:
    | string
    | null;

  backdropUrl:
    | string
    | null;

  heroMode?: MediaHeroMode;

  meta?: string[];

  tags?: string[];

  description:
    | string
    | null;

  information?: MediaInformationItem[];

  children?: ReactNode;

  mainContent?: ReactNode;

  bottomContent?: ReactNode;

  noDescriptionText?: string;
}

export default function MediaDetailLayout({
  title,
  eyebrow,
  coverUrl,
  backdropUrl,
  heroMode = "backdrop",
  meta = [],
  tags = [],
  description,
  information = [],
  children,
  mainContent,
  bottomContent,
  noDescriptionText =
    "No hay una descripción disponible.",
}: MediaDetailLayoutProps) {
  const cleanMeta =
    meta.filter(
      (
        value
      ) =>
        Boolean(
          value?.trim()
        )
    );

  const heroContent = (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end lg:gap-9">
      {/* COVER */}

      <div className="w-[155px] shrink-0 sm:w-[190px] lg:w-[205px]">
        {coverUrl ? (
          <Image
            src={
              coverUrl
            }
            alt={
              title
            }
            width={500}
            height={750}
            priority
            unoptimized={
              shouldUseOriginalImage(
                coverUrl
              )
            }
            className="aspect-[2/3] w-full rounded-xl border border-zinc-700/70 object-cover shadow-2xl shadow-black/60"
          />
        ) : (
          <div className="flex aspect-[2/3] w-full flex-col items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-center text-zinc-600 shadow-2xl">
            <ImageOff
              size={24}
            />

            <span className="text-xs">
              Sin portada
            </span>
          </div>
        )}
      </div>

      {/* TITLE / META / ACTIONS */}

      <div className="min-w-0 flex-1 pb-1 sm:pb-3 lg:pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {eyebrow}
        </p>

        <h1 className="mt-2 max-w-4xl text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl lg:text-[44px] lg:leading-[1.08]">
          {title}
        </h1>

        {/* META */}

        {cleanMeta.length >
          0 && (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
            {cleanMeta.map(
              (
                value,
                index
              ) => (
                <div
                  key={`${value}-${index}`}
                  className="flex items-center gap-x-2"
                >
                  {index >
                    0 && (
                    <span className="text-zinc-700">
                      ·
                    </span>
                  )}

                  <span>
                    {value}
                  </span>
                </div>
              )
            )}
          </div>
        )}

        {/* TAGS */}

        {tags.length >
          0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map(
              (
                tag
              ) => (
                <span
                  key={
                    tag
                  }
                  className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-400"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        )}

        {/* ACTIONS */}

        {children && (
          <div className="[&>section]:mt-6">
            {children}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main className="mx-auto max-w-[1280px] pb-24">
      {/* HERO */}

      {heroMode ===
      "backdrop" ? (
        <section className="relative">
          {/* BACKDROP */}

          <div className="relative h-[280px] overflow-hidden bg-zinc-950 sm:h-[360px] lg:h-[470px]">
            {backdropUrl ? (
              <Image
                src={
                  backdropUrl
                }
                alt=""
                fill
                priority
                unoptimized={
                  shouldUseOriginalImage(
                    backdropUrl
                  )
                }
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover object-center"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-zinc-900 text-zinc-800">
                <ImageOff
                  size={36}
                />
              </div>
            )}

            {/* BASE */}

            <div className="absolute inset-0 bg-black/10" />

            {/* TOP */}

            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/45 via-transparent to-transparent" />

            {/* BOTTOM */}

            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-transparent" />

            {/* LEFT */}

            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/25 to-transparent" />

            {/* RIGHT */}

            <div className="absolute inset-0 bg-gradient-to-l from-zinc-950/90 via-zinc-950/20 to-transparent" />

            {/* EDGE FADES */}

            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-950 to-transparent sm:w-36 lg:w-48" />

            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-zinc-950 to-transparent sm:w-36 lg:w-48" />
          </div>

          {/* CONTENT */}

          <div className="relative z-10 -mt-24 px-4 sm:-mt-32 sm:px-6 lg:-mt-36 lg:px-8">
            {heroContent}
          </div>
        </section>
      ) : (
        /*
         * COMPACT MODE
         *
         * Pensado para medios que no tienen
         * un backdrop real, como libros.
         */
        <section className="px-4 pt-10 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14">
          {heroContent}
        </section>
      )}

      {/* DETAILS */}

      <div
        className={`grid items-start gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:px-8 ${
          heroMode ===
          "compact"
            ? "mt-10"
            : "mt-12"
        }`}
      >
        {/* MAIN COLUMN */}

        <section className="min-w-0">
          {/* SYNOPSIS */}

          <div className="border-b border-zinc-800 pb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Sinopsis
            </h2>
          </div>

          <div className="mt-5 max-w-[720px]">
            <p className="whitespace-pre-line text-[15px] leading-7 text-zinc-400">
              {description ||
                noDescriptionText}
            </p>
          </div>

          {/* MEDIA-SPECIFIC CONTENT */}

          {mainContent && (
            <div className="mt-10">
              {mainContent}
            </div>
          )}
        </section>

        {/* INFORMATION */}

        {information.length >
          0 && (
          <aside className="lg:border-l lg:border-zinc-800 lg:pl-8">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Información
              </h2>
            </div>

            <div className="mt-5 space-y-6">
              {information.map(
                (
                  item,
                  index
                ) => (
                  <InformationRow
                    key={`${item.label}-${index}`}
                    icon={
                      item.icon
                    }
                    label={
                      item.label
                    }
                  >
                    {
                      item.value
                    }
                  </InformationRow>
                )
              )}
            </div>
          </aside>
        )}
      </div>

      {/* FULL WIDTH CONTENT */}

      {bottomContent && (
        <div className="mt-12 px-4 sm:px-6 lg:px-8">
          {bottomContent}
        </div>
      )}
    </main>
  );
}

function InformationRow({
  icon,
  label,
  children,
}: {
  icon?: ReactNode;

  label: string;

  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-zinc-500">
        {icon}

        <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>

      <div className="mt-2 text-sm leading-6 text-zinc-300">
        {children}
      </div>
    </div>
  );
}