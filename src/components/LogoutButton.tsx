"use client";

import {
  LogOut,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router =
    useRouter();

  const [supabase] =
    useState(() =>
      createClient()
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  async function handleLogout() {
    if (loading) {
      return;
    }

    setLoading(true);

    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Error signing out:",
        error
      );

      setLoading(false);
      return;
    }

    router.replace(
      "/auth"
    );

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={
        handleLogout
      }
      disabled={
        loading
      }
      className="mt-auto flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-zinc-500 transition hover:bg-zinc-900 hover:text-red-400 disabled:opacity-50"
    >
      <LogOut
        size={18}
      />

      <span>
        {loading
          ? "Cerrando..."
          : "Cerrar sesión"}
      </span>
    </button>
  );
}