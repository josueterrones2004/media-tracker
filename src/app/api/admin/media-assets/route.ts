import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getIGDBBackdropUrl,
  getIGDBGame,
  getIGDBImageUrl,
} from "@/lib/igdb";

import {
  getBookDetails,
  getOpenLibraryCoverUrl,
} from "@/lib/openlibrary";

import {
  getMovieDetails,
  getMovieImages,
  getSeriesDetails,
  getSeriesImages,
} from "@/lib/tmdb";

import {
  createClient,
} from "@/lib/supabase/server";

type Kind =
  | "movie"
  | "series"
  | "game"
  | "book";

type DatabaseMediaType =
  | "MOVIE"
  | "SERIES"
  | "GAME"
  | "BOOK";

type Asset = {
  url:
    string;

  type:
    | "poster"
    | "backdrop";

  label:
    string;

  width?:
    number;

  height?:
    number;
};

function toDatabaseMediaType(
  kind:
    Kind
): DatabaseMediaType {
  if (
    kind ===
    "movie"
  ) {
    return "MOVIE";
  }

  if (
    kind ===
    "series"
  ) {
    return "SERIES";
  }

  if (
    kind ===
    "game"
  ) {
    return "GAME";
  }

  return "BOOK";
}

export async function GET(
  request:
    NextRequest
) {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Unauthorized",
      },
      {
        status:
          401,
      }
    );
  }

  const {
    data: profile,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "special_role"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  if (
    profile?.special_role !==
    "OWNER"
  ) {
    return NextResponse.json(
      {
        error:
          "Forbidden",
      },
      {
        status:
          403,
      }
    );
  }

  const kind =
    request.nextUrl.searchParams.get(
      "kind"
    ) as Kind | null;

  const id =
    request.nextUrl.searchParams.get(
      "id"
    );

  if (
    !kind ||
    !id ||
    ![
      "movie",
      "series",
      "game",
      "book",
    ].includes(
      kind
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid parameters",
      },
      {
        status:
          400,
      }
    );
  }

  const assets:
    Asset[] =
    [];

  let automaticPoster:
    string |
    null =
    null;

  let automaticBackdrop:
    string |
    null =
    null;

  /*
   * GAME
   */

  if (
    kind ===
    "game"
  ) {
    const game =
      await getIGDBGame(
        id
      );

    if (game) {
      automaticPoster =
        getIGDBImageUrl(
          game.cover
            ?.image_id,
          "cover_big"
        );

      automaticBackdrop =
        getIGDBBackdropUrl(
          game
        );

      if (
        game.cover
          ?.image_id
      ) {
        assets.push({
          url:
            getIGDBImageUrl(
              game.cover
                .image_id,
              "cover_big"
            )!,

          type:
            "poster",

          label:
            "Portada de IGDB",

          width:
            game.cover.width,

          height:
            game.cover.height,
        });
      }

      for (
        const artwork of
        game.artworks ??
        []
      ) {
        assets.push({
          url:
            getIGDBImageUrl(
              artwork.image_id,
              "1080p"
            )!,

          type:
            "backdrop",

          label:
            "Artwork de IGDB",

          width:
            artwork.width,

          height:
            artwork.height,
        });
      }

      for (
        const screenshot of
        game.screenshots ??
        []
      ) {
        assets.push({
          url:
            getIGDBImageUrl(
              screenshot.image_id,
              "1080p"
            )!,

          type:
            "backdrop",

          label:
            "Screenshot de IGDB",

          width:
            screenshot.width,

          height:
            screenshot.height,
        });
      }
    }
  }

  /*
   * MOVIE
   */

  if (
    kind ===
    "movie"
  ) {
    const [
      details,
      images,
    ] =
      await Promise.all([
        getMovieDetails(
          id
        ),

        getMovieImages(
          id
        ),
      ]);

    automaticPoster =
      details.poster_path
        ? `https://image.tmdb.org/t/p/w780${details.poster_path}`
        : null;

    automaticBackdrop =
      details.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : null;

    for (
      const poster of
      (
        images.posters ??
        []
      ).slice(
        0,
        25
      )
    ) {
      assets.push({
        url:
          `https://image.tmdb.org/t/p/w780${poster.file_path}`,

        type:
          "poster",

        label:
          "Poster de TMDB",

        width:
          poster.width,

        height:
          poster.height,
      });
    }

    for (
      const backdrop of
      (
        images.backdrops ??
        []
      ).slice(
        0,
        30
      )
    ) {
      assets.push({
        url:
          `https://image.tmdb.org/t/p/original${backdrop.file_path}`,

        type:
          "backdrop",

        label:
          "Backdrop de TMDB",

        width:
          backdrop.width,

        height:
          backdrop.height,
      });
    }
  }

  /*
   * SERIES
   */

  if (
    kind ===
    "series"
  ) {
    const [
      details,
      images,
    ] =
      await Promise.all([
        getSeriesDetails(
          id
        ),

        getSeriesImages(
          id
        ),
      ]);

    automaticPoster =
      details.poster_path
        ? `https://image.tmdb.org/t/p/w780${details.poster_path}`
        : null;

    automaticBackdrop =
      details.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : null;

    for (
      const poster of
      (
        images.posters ??
        []
      ).slice(
        0,
        25
      )
    ) {
      assets.push({
        url:
          `https://image.tmdb.org/t/p/w780${poster.file_path}`,

        type:
          "poster",

        label:
          "Poster de TMDB",

        width:
          poster.width,

        height:
          poster.height,
      });
    }

    for (
      const backdrop of
      (
        images.backdrops ??
        []
      ).slice(
        0,
        30
      )
    ) {
      assets.push({
        url:
          `https://image.tmdb.org/t/p/original${backdrop.file_path}`,

        type:
          "backdrop",

        label:
          "Backdrop de TMDB",

        width:
          backdrop.width,

        height:
          backdrop.height,
      });
    }
  }

  /*
   * BOOK
   */

  if (
    kind ===
    "book"
  ) {
    const book =
      await getBookDetails(
        id
      );

    const firstCover =
      book.covers?.[0];

    automaticPoster =
      getOpenLibraryCoverUrl(
        firstCover,
        "L"
      );

    for (
      const cover of
      (
        book.covers ??
        []
      ).slice(
        0,
        20
      )
    ) {
      const url =
        getOpenLibraryCoverUrl(
          cover,
          "L"
        );

      if (!url) {
        continue;
      }

      assets.push({
        url,

        type:
          "poster",

        label:
          "Portada de Open Library",
      });
    }
  }

  /*
   * REMOVE DUPLICATES
   */

  const uniqueAssets =
    Array.from(
      new Map(
        assets.map(
          (
            asset
          ) => [
            asset.url,
            asset,
          ]
        )
      ).values()
    );

  /*
   * OVERRIDE
   */

  const {
    data: override,
  } =
    await supabase
      .from(
        "media_artwork_overrides"
      )
      .select(`
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
        toDatabaseMediaType(
          kind
        )
      )
      .eq(
        "external_id",
        id
      )
      .maybeSingle();

  return NextResponse.json({
    automaticPoster,
    automaticBackdrop,

    assets:
      uniqueAssets,

    override:
      override ??
      null,
  });
}