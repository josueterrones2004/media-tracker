"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Check, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

interface UsernameEditorProps {
  userId: string;
  initialUsername: string | null;
}

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function UsernameEditor({
  userId,
  initialUsername,
}: UsernameEditorProps) {
  const router = useRouter();

  const [supabase] = useState(() => createClient());

  const [username, setUsername] = useState(
    initialUsername ?? ""
  );

  const [savedUsername, setSavedUsername] = useState(
    initialUsername ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    setErrorMessage("");
    setSuccessMessage("");

    if (!USERNAME_PATTERN.test(cleanUsername)) {
      setErrorMessage(
        "Usa entre 3 y 20 caracteres: letras, números o guion bajo (_)."
      );

      return;
    }

    if (cleanUsername === savedUsername) {
      return;
    }

    setSaving(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      setErrorMessage(
        "Tu sesión ha caducado. Inicia sesión de nuevo."
      );

      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        username: cleanUsername,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select("username")
      .single();

    if (error) {
      console.error("Error updating username:", error);

      if (error.code === "23505") {
        setErrorMessage(
          "Ese nombre de usuario ya está ocupado. Prueba con otro."
        );
      } else {
        setErrorMessage(
          "No se pudo actualizar el nombre de usuario. Inténtalo de nuevo."
        );
      }

      setSaving(false);
      return;
    }

    const updatedUsername = data.username as string;

    setUsername(updatedUsername);
    setSavedUsername(updatedUsername);

    setSuccessMessage(
      `Tu nombre de usuario ahora es @${updatedUsername}.`
    );

    setSaving(false);

    router.refresh();
  }

  const normalizedUsername = username.trim().toLowerCase();

  const hasChanges = normalizedUsername !== savedUsername;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
          <AtSign size={20} />
        </div>

        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-100">
            Nombre de usuario
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            Elige cómo podrán encontrarte otras personas.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <label
          htmlFor="profile-username"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Tu @usuario
        </label>

        <div className="flex min-w-0 items-center rounded-xl border border-zinc-800 bg-zinc-900 transition focus-within:border-fuchsia-500">
          <span className="pl-4 text-zinc-500">@</span>

          <input
            id="profile-username"
            type="text"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value.toLowerCase());
              setErrorMessage("");
              setSuccessMessage("");
            }}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder="tu_usuario"
            aria-describedby="username-help"
            className="min-w-0 w-full bg-transparent px-2 py-3 text-zinc-100 outline-none placeholder:text-zinc-600"
          />
        </div>

        <p
          id="username-help"
          className="mt-2 text-xs leading-5 text-zinc-500"
        >
          Entre 3 y 20 caracteres. Solo letras de la a a la z,
          números y guion bajo (_). No se permiten espacios.
        </p>

        {errorMessage && (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p
            role="status"
            className="mt-4 flex items-center gap-2 text-sm text-emerald-400"
          >
            <Check size={16} />
            {successMessage}
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving && (
              <Loader2 size={16} className="animate-spin" />
            )}

            {saving ? "Guardando..." : "Guardar usuario"}
          </button>
        </div>
      </form>
    </div>
  );
}