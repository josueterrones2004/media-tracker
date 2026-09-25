interface GameDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GameDetailsPage({
  params,
}: GameDetailsPageProps) {
  const { id } = await params;

  return (
    <main className="max-w-3xl">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8">
        <div className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-300">
          Temporalmente deshabilitado
        </div>

        <h1 className="mt-4 text-3xl font-bold text-zinc-100">
          Juegos{id}
        </h1>

        <p className="mt-3 text-zinc-400">
          La ficha de juegos todavía no está implementada.
        </p>

        <p className="mt-6 text-sm text-zinc-600">
          Vuelve más adelante.
        </p>
      </div>
    </main>
  );
}