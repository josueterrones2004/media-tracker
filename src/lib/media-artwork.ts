import {
  createClient,
} from "@/lib/supabase/server";

export type MediaArtworkType =
  | "movie"
  | "series"
  | "game"
  | "book";

export type MediaArtworkOverride = {
  media_type:
    MediaArtworkType;

  external_id:
    string;

  poster_url:
    | string
    | null;

  backdrop_url:
    | string
    | null;

  poster_position_x:
    number;

  poster_position_y:
    number;

  poster_zoom:
    number;

  backdrop_position_x:
    number;

  backdrop_position_y:
    number;

  backdrop_zoom:
    number;
};

function toNumber(
  value:
    unknown,

  fallback:
    number
) {
  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
}

function normalizeOverride(
  row:
    Record<
      string,
      unknown
    >
): MediaArtworkOverride {
  return {
    media_type:
      row.media_type as
        MediaArtworkType,

    external_id:
      String(
        row.external_id
      ),

    poster_url:
      typeof row.poster_url ===
        "string"
        ? row.poster_url
        : null,

    backdrop_url:
      typeof row.backdrop_url ===
        "string"
        ? row.backdrop_url
        : null,

    poster_position_x:
      toNumber(
        row.poster_position_x,
        50
      ),

    poster_position_y:
      toNumber(
        row.poster_position_y,
        50
      ),

    poster_zoom:
      toNumber(
        row.poster_zoom,
        1
      ),

    backdrop_position_x:
      toNumber(
        row.backdrop_position_x,
        50
      ),

    backdrop_position_y:
      toNumber(
        row.backdrop_position_y,
        50
      ),

    backdrop_zoom:
      toNumber(
        row.backdrop_zoom,
        1
      ),
  };
}

export async function getMediaArtworkOverride(
  mediaType:
    MediaArtworkType,

  externalId:
    string
) {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "media_artwork_overrides"
      )
      .select(`
        media_type,
        external_id,
        poster_url,
        backdrop_url,
        poster_position_x,
        poster_position_y,
        poster_zoom,
        backdrop_position_x,
        backdrop_position_y,
        backdrop_zoom
      `)
      .eq(
        "media_type",
        mediaType
      )
      .eq(
        "external_id",
        externalId
      )
      .maybeSingle();

  if (
    error
  ) {
    console.error(
      "Error loading artwork override:",
      error
    );

    return null;
  }

  if (!data) {
    return null;
  }

  return normalizeOverride(
    data
  );
}

export async function getMediaArtworkOverrides(
  mediaType:
    MediaArtworkType,

  externalIds:
    string[]
) {
  const uniqueIds =
    [
      ...new Set(
        externalIds.filter(
          Boolean
        )
      ),
    ];

  const result =
    new Map<
      string,
      MediaArtworkOverride
    >();

  if (
    uniqueIds.length ===
    0
  ) {
    return result;
  }

  const supabase =
    await createClient();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "media_artwork_overrides"
      )
      .select(`
        media_type,
        external_id,
        poster_url,
        backdrop_url,
        poster_position_x,
        poster_position_y,
        poster_zoom,
        backdrop_position_x,
        backdrop_position_y,
        backdrop_zoom
      `)
      .eq(
        "media_type",
        mediaType
      )
      .in(
        "external_id",
        uniqueIds
      );

  if (
    error
  ) {
    console.error(
      "Error loading artwork overrides:",
      error
    );

    return result;
  }

  for (
    const row of
    data ??
    []
  ) {
    const override =
      normalizeOverride(
        row
      );

    result.set(
      override.external_id,
      override
    );
  }

  return result;
}

export type MixedMediaArtworkKey = {
  mediaType:
    MediaArtworkType;

  externalId:
    string;
};

export async function getMixedMediaArtworkOverrides(
  keys:
    MixedMediaArtworkKey[]
) {
  const unique =
    Array.from(
      new Map(
        keys.map(
          (
            item
          ) => [
            `${item.mediaType}:${item.externalId}`,
            item,
          ]
        )
      ).values()
    );

  const [
    movies,
    series,
    games,
    books,
  ] =
    await Promise.all([
      getMediaArtworkOverrides(
        "movie",
        unique
          .filter(
            (
              item
            ) =>
              item.mediaType ===
              "movie"
          )
          .map(
            (
              item
            ) =>
              item.externalId
          )
      ),

      getMediaArtworkOverrides(
        "series",
        unique
          .filter(
            (
              item
            ) =>
              item.mediaType ===
              "series"
          )
          .map(
            (
              item
            ) =>
              item.externalId
          )
      ),

      getMediaArtworkOverrides(
        "game",
        unique
          .filter(
            (
              item
            ) =>
              item.mediaType ===
              "game"
          )
          .map(
            (
              item
            ) =>
              item.externalId
          )
      ),

      getMediaArtworkOverrides(
        "book",
        unique
          .filter(
            (
              item
            ) =>
              item.mediaType ===
              "book"
          )
          .map(
            (
              item
            ) =>
              item.externalId
          )
      ),
    ]);

  const result =
    new Map<
      string,
      MediaArtworkOverride
    >();

  for (
    const [
      type,
      collection,
    ] of [
      [
        "movie",
        movies,
      ],

      [
        "series",
        series,
      ],

      [
        "game",
        games,
      ],

      [
        "book",
        books,
      ],
    ] as const
  ) {
    for (
      const [
        externalId,
        override,
      ] of collection
    ) {
      result.set(
        `${type}:${externalId}`,
        override
      );
    }
  }

  return result;
}

export type DatabaseMediaType =
  | "MOVIE"
  | "SERIES"
  | "GAME"
  | "BOOK";

export function toMediaArtworkType(
  mediaType:
    DatabaseMediaType
): MediaArtworkType {
  if (
    mediaType ===
    "MOVIE"
  ) {
    return "movie";
  }

  if (
    mediaType ===
    "SERIES"
  ) {
    return "series";
  }

  if (
    mediaType ===
    "GAME"
  ) {
    return "game";
  }

  return "book";
}

export function getMediaArtworkMapKey(
  mediaType:
    DatabaseMediaType,

  externalId:
    string
) {
  return `${mediaType}:${externalId}`;
}

export async function getMixedMediaArtworkOverrides(
  items:
    {
      media_type:
        DatabaseMediaType;

      external_id:
        string;
    }[]
) {
  const grouped:
    Record<
      DatabaseMediaType,
      Set<string>
    > = {
      MOVIE:
        new Set(),

      SERIES:
        new Set(),

      GAME:
        new Set(),

      BOOK:
        new Set(),
    };

  for (
    const item of
    items
  ) {
    if (
      item.external_id
    ) {
      grouped[
        item.media_type
      ].add(
        item.external_id
      );
    }
  }

  const mediaTypes:
    DatabaseMediaType[] = [
      "MOVIE",
      "SERIES",
      "GAME",
      "BOOK",
    ];

  const results =
    await Promise.all(
      mediaTypes.map(
        async (
          mediaType
        ) => ({
          mediaType,

          overrides:
            await getMediaArtworkOverrides(
              toMediaArtworkType(
                mediaType
              ),

              [
                ...grouped[
                  mediaType
                ],
              ]
            ),
        })
      )
    );

  const output =
    new Map<
      string,
      MediaArtworkOverride
    >();

  for (
    const result of
    results
  ) {
    for (
      const [
        externalId,
        override,
      ] of result.overrides
    ) {
      output.set(
        getMediaArtworkMapKey(
          result.mediaType,
          externalId
        ),
        override
      );
    }
  }

  return output;
}