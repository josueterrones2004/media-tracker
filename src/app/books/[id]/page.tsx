import {
  BookOpen,
  UserRound,
} from "lucide-react";

import MediaDetailLayout from "@/components/media/MediaDetailLayout";

import {
  getMediaArtworkOverride,
} from "@/lib/media-artwork";

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

function cleanSubjects(
  subjects:
    | string[]
    | undefined
) {
  const result:
    string[] =
    [];

  const seen =
    new Set<
      string
    >();

  for (
    const rawSubject
    of subjects ??
    []
  ) {
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

      if (!subject) {
        continue;
      }

      const normalized =
        subject.toLowerCase();

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

      if (
        subject.length >
        32
      ) {
        continue;
      }

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

  const [
    book,
    override,
  ] =
    await Promise.all([
      getBookDetails(
        id
      ),

      getMediaArtworkOverride(
        "book",
        id
      ),
    ]);

  const description =
    getBookDescription(
      book.description
    );

  const coverId =
    book.covers?.[0] ??
    null;

  const automaticCover =
    getOpenLibraryCoverUrl(
      coverId,
      "L"
    );

  const cover =
    override
      ?.poster_url ??
    automaticCover;

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

  const subjects =
    cleanSubjects(
      book.subjects
    );

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
      coverPositionX={
        override
          ?.poster_position_x ??
        50
      }
      coverPositionY={
        override
          ?.poster_position_y ??
        50
      }
      coverZoom={
        override
          ?.poster_zoom ??
        1
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