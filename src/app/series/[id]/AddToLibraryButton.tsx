"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AddToLibraryButtonProps {
  show: {
    id: number;
    name: string;
    original_name?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    first_air_date?: string;
  };
}

export default function AddToLibraryButton({
  show,
}: AddToLibraryButtonProps) {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function addToLibrary() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Debes iniciar sesión.");
      setLoading(false);
      return;
    }

    const releaseYear = show.first_air_date
      ? Number(show.first_air_date.slice(0, 4))
      : null;

    const { error } = await supabase
      .from("library_items")
      .insert({
        user_id: user.id,
        media_type: "SERIES",
        external_id: String(show.id),
        title: show.name,
        original_title: show.original_name ?? null,
        cover_url: show.poster_path
          ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
          : null,
        backdrop_url: show.backdrop_path
          ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
          : null,
        release_year: releaseYear,
        status: "PENDING",
      });

    if (error) {
      if (error.code === "23505") {
        setMessage("Esta serie ya está en tu biblioteca.");
      } else {
        setMessage(error.message);
      }

      setLoading(false);
      return;
    }

    setMessage("Añadida a tu biblioteca.");
    setLoading(false);
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={addToLibrary}
        disabled={loading}
        className="rounded-lg bg-fuchsia-500 px-5 py-3 font-medium text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
      >
        {loading
          ? "Añadiendo..."
          : "+ Añadir a mi biblioteca"}
      </button>

      {message && (
        <p className="mt-3 text-sm text-zinc-400">
          {message}
        </p>
      )}
    </div>
  );
}