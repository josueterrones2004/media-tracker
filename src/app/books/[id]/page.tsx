import {
  BookOpen,
  UserRound,
} from "lucide-react";

import MediaDetailLayout from "@/components/media/MediaDetailLayout";

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

/*
 * Open Library puede devolver subjects bastante
 * desordenados:
 *
 * - duplicados
 * - etiquetas internas
 * - categorías separadas por comas
 * - diferencias como Science-fiction / Science fiction
 *
 * Aquí los convertimos en unas pocas etiquetas
 * útiles para la interfaz.
 */

function cleanSubjects(
  subjects:
    | string[]
    | undefined
) {
  const result:
    string[] =
    [];

  const seen =
    new Set<string>();

  for (
    const rawSubject
    of subjects ?? []
  ) {
    /*
     * Algunos subjects contienen varias categorías.
     */
    const parts =
      rawSubject.split(
        /[,;]+/
      );

    for (
      const rawPart
      of parts
    ) {
      let subject =
        rawPart
          .trim()
          .replace(
            /[-_]+/g,
            " "
          )
          .replace(
            /\s+/g,
            " "
          );

      if (
        !subject
      ) {
        continue;
      }

      const normalized =
        subject.toLowerCase();

      /*
       * Metadata / categorías poco útiles.
       */

      if (
        normalized.startsWith(
          "nyt:"
        ) ||
        normalized.includes(
          "imaginary place"
        ) ||
        normalized.includes(
          "new york times"
        ) ||
        normalized.includes(
          "mass market"
        ) ||
        normalized.includes(
          "reviewed"
        ) ||
        normalized.includes(
          "="
        ) ||
        /\b\d{4}\b/.test(
          normalized
        )
      ) {
        continue;
      }

      /*
       * Etiquetas demasiado genéricas o poco útiles.
       */

      if (
        normalized ===
          "general" ||
        normalized ===
          "books" ||
        normalized ===
          "literature"
      ) {
        continue;
      }

      /*
       * Evitamos frases enormes.
       */

      if (
        subject.length >
        32
      ) {
        continue;
      }

      /*
       * Normalizaciones visuales comunes.
       */

      if (
        normalized ===
        "science fiction"
      ) {
        subject =
          "Science fiction";
      }

      if (
        normalized ===
        "fiction"
      ) {
        subject =
          "Fiction";
      }

      const dedupeKey =
        subject
          .toLowerCase()
          .replace(
            /[^a-z0-9]/g,
            ""
          );

      if (
        !dedupeKey ||
        seen.has(
          dedupeKey
        )
      ) {
        continue;
      }

      seen.add(
        dedupeKey
      );

      result.push(
        subject
      );

      /*
       * No queremos convertir la ficha
       * en una nube de etiquetas.
       */
      if (
        result.length >=
        4
      ) {
        return result;
      }
    }
  }

  return result;
}

export default async function BookPage({
  params,
}: BookPageProps) {
  const {
    id,
  } =
    await params;

  const book =
    await getBookDetails(
      id
    );

  /*
   * DESCRIPTION
   */

  const description =
    getBookDescription(
      book.description
    );

  /*
   * COVER
   */

  const coverId =
    book.covers?.[0] ??
    null;

  const cover =
    getOpenLibraryCoverUrl(
      coverId,
      "L"
    );

  /*
   * AUTHORS
   */

  const authorKeys =
    book.authors
      ?.map(
        (
          entry
        ) =>
          entry.author
            ?.key
      )
      .filter(
        (
          key
        ): key is string =>
          Boolean(
            key
          )
      ) ??
    [];

  const authorResults =
    await Promise.all(
      authorKeys.map(
        (
          key
        ) =>
          getAuthorDetails(
            key
          )
      )
    );

  const authors =
    authorResults
      .filter(
        (
          author
        ): author is NonNullable<
          typeof author
        > =>
          Boolean(
            author
          )
      )
      .map(
        (
          author
        ) =>
          author.name
      );

  /*
   * SUBJECTS
   */

  const subjects =
    cleanSubjects(
      book.subjects
    );

  /*
   * HERO META
   */

  const meta:
    string[] =
    [];

  if (
    authors.length >
    0
  ) {
    meta.push(
      authors.join(
        ", "
      )
    );
  }

  /*
   * INFORMATION
   */

  const information = [
    {
      label:
        "Tipo",

      value:
        "Libro",

      icon: (
        <BookOpen
          size={15}
        />
      ),
    },

    ...(authors.length >
    0
      ? [
          {
            label:
              authors.length ===
              1
                ? "Autor"
                : "Autores",

            value:
              authors.join(
                ", "
              ),

            icon: (
              <UserRound
                size={15}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <MediaDetailLayout
      title={
        book.title
      }
      eyebrow="Libro"
      heroMode="compact"
      coverUrl={
        cover
      }
      backdropUrl={
        null
      }
      meta={
        meta
      }
      tags={
        subjects
      }
      description={
        description
      }
      noDescriptionText="No hay una sinopsis disponible para este libro."
      information={
        information
      }
    >
      <BookActions
        book={{
          id,

          title:
            book.title,

          coverUrl:
            cover,

          authors,
        }}
      />
    </MediaDetailLayout>
  );
}