"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = query.trim();

    if (!value) return;

    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <header className="flex h-20 items-center border-b border-zinc-800 px-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl"
      >
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar juegos, películas o series..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-white outline-none transition focus:border-fuchsia-500"
        />
      </form>
    </header>
  );
}