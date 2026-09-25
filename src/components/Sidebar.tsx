import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-zinc-800 bg-zinc-950 p-6">
      <h1 className="mb-10 text-xl font-bold text-fuchsia-500">
        Media Tracker
      </h1>

      <nav className="flex flex-col gap-2">
        <Link
          href="/"
          className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
        >
          Inicio
        </Link>

        <Link
          href="/games"
          className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
        >
          Juegos
        </Link>

        <Link
          href="/movies"
          className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
        >
          Películas
        </Link>

        <Link
          href="/series"
          className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
        >
          Series
        </Link>

        <Link
          href="/books"
          className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
        >
          Libros
        </Link>

        <Link
          href="/profile"
          className="rounded-lg px-3 py-2 text-zinc-300 hover:bg-zinc-900 hover:text-white"
        >
          Perfil
        </Link>
      </nav>
    </aside>
  );
}