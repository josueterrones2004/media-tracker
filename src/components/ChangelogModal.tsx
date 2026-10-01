"use client";

import {
  BookOpen,
  Gamepad2,
  Library,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

const CHANGELOG_VERSION =
  "0.2.0";

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
    useState(false);

  useEffect(() => {
    let timer:
      | number
      | null =
      null;

    try {
      const seen =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (seen) {
        return;
      }

      timer =
        window.setTimeout(
          () => {
            setOpen(true);
          },
          450
        );
    } catch {
      timer =
        window.setTimeout(
          () => {
            setOpen(true);
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
  }, []);

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

    setOpen(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">
        {/* HEADER */}

        <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-5 py-5 backdrop-blur-xl sm:px-7">
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-900 hover:text-zinc-200"
            aria-label="Cerrar changelog"
          >
            <X size={20} />
          </button>

          <div className="pr-12">
            <div className="flex items-center gap-2 text-fuchsia-400">
              <Sparkles
                size={17}
              />

              <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                Nueva actualización
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-100">
              Media Tracker 0.2.0
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              30 de septiembre de 2026
            </p>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
              Esta actualización mejora gran parte de la experiencia de Media Tracker y añade nuevas formas de registrar y gestionar tu biblioteca.
            </p>
          </div>
        </div>

        {/* CONTENT */}

        <div className="space-y-2 p-5 sm:p-7">
          <ChangeItem
            icon={
              <Star size={20} />
            }
            title="Nuevo sistema de puntuaciones"
          >
            Ahora puedes puntuar películas, series, libros y juegos entre 0.5 y 5 estrellas, incluyendo medias estrellas.
          </ChangeItem>

          <ChangeItem
            icon={
              <BookOpen
                size={20}
              />
            }
            title="Reviews más flexibles"
          >
            Ya no es obligatorio escribir texto para registrar una review. Puedes guardar únicamente una puntuación, un like o simplemente registrar que terminaste algo.
          </ChangeItem>

          <ChangeItem
            icon={
              <Trash2
                size={20}
              />
            }
            title="Edita y elimina tus reviews"
          >
            Las reviews pueden editarse y borrarse desde su propio modal, con una confirmación integrada en Media Tracker.
          </ChangeItem>

          <ChangeItem
            icon={
              <Library
                size={20}
              />
            }
            title="Más control sobre tu biblioteca"
          >
            Puedes quitar elementos de Pendiente, Viendo, Leyendo, Jugando o Abandonado pulsando de nuevo el estado activo.
          </ChangeItem>

          <ChangeItem
            icon={
              <Gamepad2
                size={20}
              />
            }
            title="Mejoras para juegos"
          >
            Los juegos completados ahora abren directamente su registro y review. También puedes registrar replays sin perder completados anteriores.
          </ChangeItem>

          <ChangeItem
            icon={
              <Users
                size={20}
              />
            }
            title="Perfil y Social renovados"
          >
            Se rediseñaron perfiles, navegación, actividad social, seguidores, favoritos y varias vistas para hacer la experiencia más compacta y consistente.
          </ChangeItem>

          <ChangeItem
            icon={
              <Smartphone
                size={20}
              />
            }
            title="Media Tracker como app"
          >
            Media Tracker ahora puede instalarse en dispositivos compatibles para abrirse desde la pantalla de inicio como una aplicación.
          </ChangeItem>

          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-xs leading-5 text-zinc-600">
              Media Tracker continúa en una etapa temprana de desarrollo. Algunas funciones pueden cambiar o contener errores.
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <div className="sticky bottom-0 flex justify-end border-t border-zinc-800 bg-zinc-950/95 px-5 py-4 backdrop-blur-xl sm:px-7">
          <button
            type="button"
            onClick={close}
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
        {icon}
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-zinc-200">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {children}
        </p>
      </div>
    </div>
  );
}