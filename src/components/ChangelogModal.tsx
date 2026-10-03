"use client";

import {
  Compass,
  ImageIcon,
  Search,
  Sparkles,
  Star,
  Smartphone,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

const CHANGELOG_VERSION =
  "0.2.1";

const STORAGE_KEY =
  `media-tracker-changelog-${CHANGELOG_VERSION}`;

type ChangeItemProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
};

export default function ChangelogModal() {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  useEffect(
    () => {
      let timer:
        | number
        | null =
        null;

      try {
        const seen =
          window.localStorage.getItem(
            STORAGE_KEY
          );

        if (
          seen
        ) {
          return;
        }

        timer =
          window.setTimeout(
            () => {
              setOpen(
                true
              );
            },
            450
          );
      } catch {
        timer =
          window.setTimeout(
            () => {
              setOpen(
                true
              );
            },
            450
          );
      }

      return () => {
        if (
          timer !==
          null
        ) {
          window.clearTimeout(
            timer
          );
        }
      };
    },
    []
  );

  function close() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        new Date().toISOString()
      );
    } catch {
      // Si localStorage no está disponible,
      // simplemente cerramos el modal.
    }

    setOpen(
      false
    );
  }

  if (
    !open
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">
        {/* HEADER */}

        <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-5 py-5 backdrop-blur-xl sm:px-7">
          <button
            type="button"
            onClick={
              close
            }
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-200"
            aria-label="Cerrar changelog"
          >
            <X
              size={
                20
              }
            />
          </button>

          <div className="pr-12">
            <div className="flex items-center gap-2 text-fuchsia-400">
              <Sparkles
                size={
                  17
                }
              />

              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                Nueva actualización
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-100">
              Media Tracker 0.2.1
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              2 de octubre de 2026
            </p>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
              Esta versión amplía Media Tracker con nuevas formas de descubrir contenido y mejora la consistencia visual y la navegación en distintas partes de la plataforma.
            </p>
          </div>
        </div>

        {/* CONTENT */}

        <div className="space-y-2 p-5 sm:p-7">
          <ChangeItem
            icon={
              <Compass
                size={
                  20
                }
              />
            }
            title="Nuevo espacio de descubrimiento"
          >
            La página de inicio incorpora Estrenos y novedades, Tendencias y Recomendaciones para descubrir películas, series, juegos y libros desde un mismo lugar.
          </ChangeItem>

          <ChangeItem
            icon={
              <Smartphone
                size={
                  20
                }
              />
            }
            title="Carrusel de novedades"
          >
            Los estrenos cuentan ahora con un carrusel visual. En móvil puedes cambiar de título deslizando y la barra de progreso indica cuánto falta para mostrar la siguiente novedad.
          </ChangeItem>

          <ChangeItem
            icon={
              <ImageIcon
                size={
                  20
                }
              />
            }
            title="Imágenes más consistentes"
          >
            Las portadas y banners de cada título se mantienen de forma más coherente entre fichas, biblioteca, perfiles, actividad, reviews y otras secciones de Media Tracker.
          </ChangeItem>

          <ChangeItem
            icon={
              <Search
                size={
                  20
                }
              />
            }
            title="Búsquedas más precisas"
          >
            Se mejoró la búsqueda para distinguir correctamente obras diferentes que comparten el mismo nombre y hacer más consistente la navegación entre resultados.
          </ChangeItem>

          <ChangeItem
            icon={
              <Star
                size={
                  20
                }
              />
            }
            title="Puntuaciones más visibles"
          >
            Las valoraciones aparecen de forma más consistente en las distintas secciones donde se muestran títulos y reviews.
          </ChangeItem>

          {/* EARLY DEVELOPMENT */}

          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-xs leading-5 text-zinc-600">
              Media Tracker continúa en una etapa temprana de desarrollo. Algunas funciones pueden cambiar o contener errores.
            </p>
          </div>

          {/* FUTURE */}

          <div className="mt-3 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-400">
                <Sparkles
                  size={
                    16
                  }
                />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-200">
                  ¿Qué es lo que sigue?
                </p>

                <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                  Media Tracker 0.2.1 será la última actualización de la versión pre-alpha.
                  El desarrollo se centrará ahora en preparar un rediseño completo de la
                  plataforma, una nueva identidad visual y nuevas funciones.
                </p>

                <p className="mt-2 text-xs font-medium text-fuchsia-300/80">
                  Además, será la última versión con este nombre.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <div className="sticky bottom-0 flex justify-end border-t border-zinc-800 bg-zinc-950/95 px-5 py-4 backdrop-blur-xl sm:px-7">
          <button
            type="button"
            onClick={
              close
            }
            className="rounded-xl bg-fuchsia-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-fuchsia-400"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangeItem({
  icon,
  title,
  children,
}: ChangeItemProps) {
  return (
    <div className="flex gap-4 rounded-xl p-3 transition hover:bg-zinc-900/50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
        {
          icon
        }
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-zinc-200">
          {
            title
          }
        </h3>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {
            children
          }
        </p>
      </div>
    </div>
  );
}