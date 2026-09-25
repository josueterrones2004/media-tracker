import { shouldUseOriginalImage } from "@/lib/image-optimization";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: library, error } = await supabase
    .from("library_items")
    .select(`
      id,
      external_id,
      media_type,
      title,
      cover_url,
      release_year,
      status,
      created_at
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main>
        <h1 className="text-3xl font-bold">Inicio</h1>

        <p className="mt-4 text-red-400">
          No se pudo cargar tu biblioteca.
        </p>
      </main>
    );
  }

  const items = library ?? [];

  type LibraryItem = (typeof items)[number];  

  const activeItems = items.filter(
  (item) => item.status === "IN_PROGRESS"
);

  function getHref(item: LibraryItem) {
    if (item.media_type === "MOVIE") {
      return `/movies/${item.external_id}`;
    }

    if (item.media_type === "SERIES") {
      return `/series/${item.external_id}`;
    }

    if (item.media_type === "GAME") {
      return `/games/${item.external_id}`;
    }

    return `/books/${item.external_id}`;
  }

  function getStatusLabel(
    mediaType: string,
    status: string
  ) {
    if (status === "PENDING") {
      return "Pendiente";
    }

    if (status === "IN_PROGRESS") {
      if (mediaType === "GAME") return "Jugando";
      if (mediaType === "BOOK") return "Leyendo";
      return "Viendo";
    }

    if (status === "COMPLETED") {
      if (mediaType === "MOVIE") return "Vista";
      if (mediaType === "SERIES") return "Vista";
      if (mediaType === "BOOK") return "Leído";
      return "Completado";
    }

    if (status === "PAUSED") {
      return "Pausado";
    }

    return "Abandonado";
  }

  return (
    <main>
      <h1 className="text-3xl font-bold">
        Inicio
      </h1>

      <p className="mt-2 text-zinc-400">
        Continúa donde lo dejaste
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Continuar
        </h2>

        {activeItems.length === 0 ? (
          <p className="mt-4 text-zinc-500">
            No tienes nada en progreso.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {activeItems.map((item) => (
              <a
                key={item.id}
                href={getHref(item)}
                className="group block"
              >
                <div className="overflow-hidden rounded-xl bg-zinc-900">
                  {item.cover_url ? (
                    <Image
                      src={item.cover_url}
                      alt={item.title}
                      className="aspect-[2/3] w-full object-cover transition duration-200 group-hover:scale-105"
                    
          width={500}
          height={750}
          unoptimized={shouldUseOriginalImage(item.cover_url)}
        />
                  ) : (
                    <div className="flex aspect-[2/3] items-center justify-center bg-zinc-800 text-zinc-500">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="font-semibold text-zinc-100">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {getStatusLabel(
                      item.media_type,
                      item.status
                    )}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">
          Biblioteca
        </h2>

        {items.length === 0 ? (
          <p className="mt-4 text-zinc-500">
            Tu biblioteca todavía está vacía.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((item) => (
              <a
                key={item.id}
                href={getHref(item)}
                className="group block"
              >
                <div className="overflow-hidden rounded-xl bg-zinc-900">
                  {item.cover_url ? (
                    <Image
                      src={item.cover_url}
                      alt={item.title}
                      className="aspect-[2/3] w-full object-cover transition duration-200 group-hover:scale-105"
                    
          width={500}
          height={750}
          unoptimized={shouldUseOriginalImage(item.cover_url)}
        />
                  ) : (
                    <div className="flex aspect-[2/3] items-center justify-center bg-zinc-800 text-zinc-500">
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="font-semibold text-zinc-100">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {getStatusLabel(
                      item.media_type,
                      item.status
                    )}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}