"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Cuenta creada. Revisa tu correo si Supabase te pide confirmación."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        window.location.href = "/";
      }
    }

    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-md pt-20">
      <h1 className="text-3xl font-bold">
        {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
      </h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none focus:border-fuchsia-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            Contraseña
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none focus:border-fuchsia-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-fuchsia-500 px-4 py-3 font-medium text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
        >
          {loading
            ? "Procesando..."
            : mode === "login"
              ? "Entrar"
              : "Registrarme"}
        </button>
      </form>

      {message && (
        <p className="mt-5 text-sm text-zinc-400">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() =>
          setMode(mode === "login" ? "register" : "login")
        }
        className="mt-6 text-sm text-fuchsia-400 hover:text-fuchsia-300"
      >
        {mode === "login"
          ? "¿No tienes cuenta? Regístrate"
          : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </main>
  );
}