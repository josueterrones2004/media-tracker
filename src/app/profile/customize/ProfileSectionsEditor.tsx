"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Save,
} from "lucide-react";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type SectionKey =
  | "ACTIVITY"
  | "FAVORITE_MOVIES"
  | "FAVORITE_SERIES"
  | "FAVORITE_BOOKS"
  | "FAVORITE_GAMES";

type Section = {
  section_key: SectionKey;
  visible: boolean;
  position: number;
};

interface ProfileSectionsEditorProps {
  userId: string;
  initialSections: Section[];
}

const sectionNames: Record<
  SectionKey,
  string
> = {
  ACTIVITY: "Actividad reciente",
  FAVORITE_MOVIES:
    "Películas favoritas",
  FAVORITE_SERIES:
    "Series favoritas",
  FAVORITE_BOOKS:
    "Libros favoritos",
  FAVORITE_GAMES:
    "Juegos favoritos",
};

const sectionDescriptions: Record<
  SectionKey,
  string
> = {
  ACTIVITY:
    "Tus últimas películas, series, libros y juegos.",
  FAVORITE_MOVIES:
    "Hasta 6 películas elegidas por ti.",
  FAVORITE_SERIES:
    "Hasta 6 series elegidas por ti.",
  FAVORITE_BOOKS:
    "Hasta 6 libros elegidos por ti.",
  FAVORITE_GAMES:
    "Hasta 6 juegos elegidos por ti.",
};

export default function ProfileSectionsEditor({
  userId,
  initialSections,
}: ProfileSectionsEditorProps) {
  const [supabase] = useState(() =>
    createClient()
  );

  const [sections, setSections] =
    useState(
      initialSections.sort(
        (a, b) =>
          a.position -
          b.position
      )
    );

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  function moveSection(
    index: number,
    direction: "up" | "down"
  ) {
    const newIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      newIndex < 0 ||
      newIndex >=
        sections.length
    ) {
      return;
    }

    const next =
      [...sections];

    const current =
      next[index];

    next[index] =
      next[newIndex];

    next[newIndex] =
      current;

    setSections(
      next.map(
        (
          section,
          position
        ) => ({
          ...section,
          position:
            position + 1,
        })
      )
    );
  }

  function toggleVisibility(
    sectionKey: SectionKey
  ) {
    setSections(
      (current) =>
        current.map(
          (section) =>
            section.section_key ===
            sectionKey
              ? {
                  ...section,
                  visible:
                    !section.visible,
                }
              : section
        )
    );
  }

  async function saveSections() {
    if (saving) {
      return;
    }

    setSaving(true);
    setMessage("");

    /*
     * Primero movemos las posiciones
     * existentes a números temporales.
     *
     * Así evitamos chocar con:
     *
     * unique(user_id, position)
     *
     * cuando intercambiamos dos
     * secciones.
     */
    for (
      let i = 0;
      i <
      sections.length;
      i++
    ) {
      const section =
        sections[i];

      const { error } =
        await supabase
          .from(
            "profile_sections"
          )
          .update({
            position:
              100 + i,
          })
          .eq(
            "user_id",
            userId
          )
          .eq(
            "section_key",
            section.section_key
          );

      if (error) {
        console.error(
          "Error preparing profile section positions:",
          error
        );

        setMessage(
          "No se pudo guardar la configuración."
        );

        setSaving(false);
        return;
      }
    }

    /*
     * Ahora guardamos el orden
     * definitivo.
     */
    for (
      let i = 0;
      i <
      sections.length;
      i++
    ) {
      const section =
        sections[i];

      const { error } =
        await supabase
          .from(
            "profile_sections"
          )
          .upsert(
            {
              user_id:
                userId,

              section_key:
                section.section_key,

              visible:
                section.visible,

              position:
                i + 1,

              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict:
                "user_id,section_key",
            }
          );

      if (error) {
        console.error(
          "Error saving profile section:",
          error
        );

        setMessage(
          "No se pudo guardar la configuración."
        );

        setSaving(false);
        return;
      }
    }

    setSections(
      (current) =>
        current.map(
          (
            section,
            index
          ) => ({
            ...section,
            position:
              index + 1,
          })
        )
    );

    setMessage(
      "Configuración guardada."
    );

    setSaving(false);
  }

  return (
    <div>
      <div className="space-y-3">
        {sections.map(
          (
            section,
            index
          ) => {
            const isGames =
              section.section_key ===
              "FAVORITE_GAMES";

            return (
              <div
                key={
                  section.section_key
                }
                className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
                  section.visible
                    ? "border-zinc-800 bg-zinc-950/60"
                    : "border-zinc-900 bg-zinc-950/30 opacity-60"
                }`}
              >
                <GripVertical
                  size={20}
                  className="shrink-0 text-zinc-600"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-zinc-100">
                      {
                        sectionNames[
                          section
                            .section_key
                        ]
                      }
                    </h3>

                    {isGames && (
                      <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                        Próximamente
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    {
                      sectionDescriptions[
                        section
                          .section_key
                      ]
                    }
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      moveSection(
                        index,
                        "up"
                      )
                    }
                    disabled={
                      index === 0
                    }
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-25"
                    aria-label="Mover arriba"
                  >
                    <ArrowUp
                      size={18}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      moveSection(
                        index,
                        "down"
                      )
                    }
                    disabled={
                      index ===
                      sections.length -
                        1
                    }
                    className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-25"
                    aria-label="Mover abajo"
                  >
                    <ArrowDown
                      size={18}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleVisibility(
                        section.section_key
                      )
                    }
                    className={`ml-2 rounded-lg p-2 transition ${
                      section.visible
                        ? "text-zinc-300 hover:bg-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-900"
                    }`}
                    aria-label={
                      section.visible
                        ? "Ocultar sección"
                        : "Mostrar sección"
                    }
                  >
                    {section.visible ? (
                      <Eye
                        size={19}
                      />
                    ) : (
                      <EyeOff
                        size={19}
                      />
                    )}
                  </button>
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="mt-7 flex items-center gap-4">
        <button
          type="button"
          onClick={
            saveSections
          }
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-fuchsia-500 px-5 py-3 font-medium text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
        >
          <Save size={18} />

          {saving
            ? "Guardando..."
            : "Guardar cambios"}
        </button>

        {message && (
          <p className="text-sm text-zinc-500">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}