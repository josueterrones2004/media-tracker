import { shouldUseOriginalImage } from "@/lib/image-optimization";
import Image from "next/image";
import {
  getAuthorDetails,
  getBookDescription,
  getBookDetails,
  getOpenLibraryCoverUrl,
} from "@/lib/openlibrary";

import BookActions from "./BookActions";

interface BookPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BookPage({
  params,
}: BookPageProps) {
  const { id } = await params;

  const book = await getBookDetails(id);

  const description =
    getBookDescription(book.description);

  const coverId =
    book.covers?.[0] ?? null;

  const cover =
    getOpenLibraryCoverUrl(
      coverId,
      "L"
    );

  const authorKeys =
    book.authors
      ?.map(
        (entry) =>
          entry.author?.key
      )
      .filter(Boolean) ?? [];

  const authorResults =
    await Promise.all(
      authorKeys.map((key) =>
        getAuthorDetails(key)
      )
    );

  const authors =
    authorResults
      .filter(
        (
          author
        ): author is NonNullable<
          typeof author
        > => Boolean(author)
      )
      .map(
        (author) =>
          author.name
      );

  const subjects =
    book.subjects
      ?.slice(0, 8) ?? [];

  return (
    <main className="pb-16">
      <div className="grid items-start gap-8 md:grid-cols-[260px_minmax(0,1fr)]">

        {/* PORTADA */}
        <div className="self-start shrink-0">
          {cover ? (
            <Image
              src={cover}
              alt={book.title}
              className="aspect-[2/3] w-full max-w-[260px] rounded-2xl object-cover shadow-2xl"
            
          width={500}
          height={750}
          unoptimized={shouldUseOriginalImage(cover)}
        />
          ) : (
            <div className="flex aspect-[2/3] w-full max-w-[260px] items-center justify-center rounded-2xl bg-zinc-900 px-5 text-center text-zinc-500">
              Sin imagen
            </div>
          )}
        </div>

        {/* INFORMACIÓN */}
        <div className="min-w-0">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
            {book.title}
          </h1>

          {/* AUTORES */}
          {authors.length > 0 && (
            <p className="mt-3 text-lg text-zinc-400">
              {authors.join(", ")}
            </p>
          )}

          {/* ETIQUETAS */}
          {subjects.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {subjects.map(
                (subject) => (
                  <span
                    key={subject}
                    className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300"
                  >
                    {subject}
                  </span>
                )
              )}
            </div>
          )}

          {/* SINOPSIS */}
          <div className="mt-8 max-w-4xl">
            <h2 className="text-xl font-semibold text-zinc-100">
              Sinopsis
            </h2>

            {description ? (
              <p className="mt-4 whitespace-pre-line leading-7 text-zinc-300">
                {description}
              </p>
            ) : (
              <p className="mt-4 text-zinc-500">
                No hay descripción disponible para este libro.
              </p>
            )}
          </div>

          {/* ACCIONES */}
          <BookActions
            book={{
              id,
              title: book.title,
              coverUrl: cover,
              authors,
            }}
          />
        </div>
      </div>
    </main>
  );
}