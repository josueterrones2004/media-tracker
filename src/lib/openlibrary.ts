export type OpenLibrarySearchBook = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  edition_count?: number;
};

export type OpenLibrarySearchResponse = {
  numFound: number;
  start: number;
  docs: OpenLibrarySearchBook[];
};

export type OpenLibraryWork = {
  key: string;
  title: string;

  description?:
    | string
    | {
        type?: string;
        value?: string;
      };

  covers?: number[];

  subjects?: string[];

  authors?: {
    author: {
      key: string;
    };
    type?: {
      key: string;
    };
  }[];
};

export type OpenLibraryAuthor = {
  key: string;
  name: string;
};

export function getOpenLibraryCoverUrl(
  coverId: number | null | undefined,
  size: "S" | "M" | "L" = "L"
) {
  if (!coverId) {
    return null;
  }

  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export function getWorkIdFromKey(
  key: string
) {
  return key.replace("/works/", "");
}

export async function searchBooks(
  query: string
): Promise<OpenLibrarySearchResponse> {
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      numFound: 0,
      start: 0,
      docs: [],
    };
  }

  const response = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(
      trimmed
    )}&limit=24`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudieron buscar libros en Open Library."
    );
  }

  return response.json();
}

export async function getBookDetails(
  workId: string
): Promise<OpenLibraryWork> {
  const response = await fetch(
    `https://openlibrary.org/works/${encodeURIComponent(
      workId
    )}.json`,
    {
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo cargar el libro desde Open Library."
    );
  }

  return response.json();
}

export async function getAuthorDetails(
  authorKey: string
): Promise<OpenLibraryAuthor | null> {
  const key = authorKey.startsWith("/")
    ? authorKey
    : `/${authorKey}`;

  const response = await fetch(
    `https://openlibrary.org${key}.json`,
    {
      next: {
        revalidate: 86400,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export function getBookDescription(
  description: OpenLibraryWork["description"]
) {
  if (!description) {
    return null;
  }

  if (typeof description === "string") {
    return description;
  }

  return description.value ?? null;
}