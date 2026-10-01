const IGDB_BASE_URL =
  "https://api.igdb.com/v4";

const TWITCH_TOKEN_URL =
  "https://id.twitch.tv/oauth2/token";

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

export type IGDBNamedItem = {
  id: number;
  name: string;
};

export type IGDBImage = {
  id: number;
  image_id: string;
};

export type IGDBAlternativeName = {
  id: number;
  name: string;
};

export type IGDBGameType = {
  id?: number;
  type?: string;
};

export type IGDBGame = {
  id: number;

  name: string;

  alternative_names?:
    IGDBAlternativeName[];

  summary?: string;

  first_release_date?:
    number;

  cover?:
    IGDBImage;

  screenshots?:
    IGDBImage[];

  genres?:
    IGDBNamedItem[];

  platforms?:
    IGDBNamedItem[];

  game_type?:
    IGDBGameType;

  version_parent?:
    number;

  total_rating?:
    number;

  total_rating_count?:
    number;
};

let cachedToken:
  | CachedToken
  | null = null;

/*
 * CREDENTIALS
 */

function getCredentials() {
  const clientId =
    process.env
      .IGDB_CLIENT_ID;

  const clientSecret =
    process.env
      .IGDB_CLIENT_SECRET;

  if (
    !clientId ||
    !clientSecret
  ) {
    throw new Error(
      "IGDB_CLIENT_ID or IGDB_CLIENT_SECRET is missing from .env.local"
    );
  }

  return {
    clientId,
    clientSecret,
  };
}

/*
 * TWITCH ACCESS TOKEN
 */

async function getAccessToken() {
  /*
   * Reutilizamos el token mientras
   * todavía tenga al menos 1 minuto
   * de vida.
   */

  if (
    cachedToken &&
    cachedToken.expiresAt >
      Date.now() +
        60_000
  ) {
    return cachedToken.accessToken;
  }

  const {
    clientId,
    clientSecret,
  } =
    getCredentials();

  const params =
    new URLSearchParams({
      client_id:
        clientId,

      client_secret:
        clientSecret,

      grant_type:
        "client_credentials",
    });

  const response =
    await fetch(
      `${TWITCH_TOKEN_URL}?${params.toString()}`,
      {
        method:
          "POST",

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    throw new Error(
      `Could not authenticate with IGDB (${response.status}): ${errorText}`
    );
  }

  const data =
    (
      await response.json()
    ) as TwitchTokenResponse;

  cachedToken = {
    accessToken:
      data.access_token,

    expiresAt:
      Date.now() +
      data.expires_in *
        1000,
  };

  return data.access_token;
}

/*
 * IGDB REQUEST
 */

async function requestIGDB<T>(
  endpoint:
    string,

  body:
    string
): Promise<T> {
  const {
    clientId,
  } =
    getCredentials();

  const accessToken =
    await getAccessToken();

  const response =
    await fetch(
      `${IGDB_BASE_URL}/${endpoint}`,
      {
        method:
          "POST",

        headers: {
          "Client-ID":
            clientId,

          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "text/plain",
        },

        body,

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    throw new Error(
      `IGDB request failed (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

/*
 * SEARCH QUERY ESCAPE
 */

function escapeSearchQuery(
  query:
    string
) {
  return query
    .replaceAll(
      "\\",
      "\\\\"
    )
    .replaceAll(
      '"',
      '\\"'
    )
    .replaceAll(
      /\s+/g,
      " "
    )
    .trim();
}

/*
 * GAME TYPE NORMALIZATION
 */

export function normalizeIGDBGameType(
  value:
    | string
    | null
    | undefined
) {
  return (
    value
      ?.normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      ) ??
    ""
  );
}

/*
 * HUMAN-READABLE GAME TYPE
 */

export function getIGDBGameTypeLabel(
  game:
    IGDBGame
) {
  const type =
    normalizeIGDBGameType(
      game.game_type
        ?.type
    );

  if (
    type ===
    "dlc_addon"
  ) {
    return "DLC";
  }

  if (
    type ===
    "expansion"
  ) {
    return "Expansión";
  }

  if (
    type ===
    "standalone_expansion"
  ) {
    return "Expansión independiente";
  }

  if (
    type ===
    "remake"
  ) {
    return "Remake";
  }

  if (
    type ===
    "remaster"
  ) {
    return "Remaster";
  }

  if (
    type ===
    "expanded_game"
  ) {
    return "Edición expandida";
  }

  return "Juego";
}

/*
 * SEARCH FILTER
 */

function shouldShowGame(
  game:
    IGDBGame
) {
  /*
   * Si tiene version_parent, normalmente
   * es una edición/versión de otro juego:
   *
   * Collector's Edition
   * Day One Edition
   * Complete Edition
   * etc.
   */

  if (
    game.version_parent
  ) {
    return false;
  }

  const type =
    normalizeIGDBGameType(
      game.game_type
        ?.type
    );

  /*
   * Si por algún motivo IGDB no devuelve
   * el tipo, conservamos el resultado
   * antes que ocultar un juego válido.
   */

  if (
    !type
  ) {
    return true;
  }

  /*
   * Tipos que sí queremos en la búsqueda.
   */

  const allowedTypes =
    new Set([
      "main_game",
      "dlc_addon",
      "expansion",
      "standalone_expansion",
      "remake",
      "remaster",
      "expanded_game",
    ]);

  return allowedTypes.has(
    type
  );
}

/*
 * GAME SEARCH
 */

export async function searchIGDBGames(
  query:
    string
) {
  const cleanQuery =
    escapeSearchQuery(
      query
    );

  if (
    !cleanQuery
  ) {
    return [];
  }

  /*
   * Pedimos más de 20 porque después
   * filtramos versiones y categorías
   * que no nos interesan.
   */

  const games =
    await requestIGDB<
      IGDBGame[]
    >(
      "games",
      `
        search "${cleanQuery}";
        fields
          id,
          name,
          alternative_names.name,
          cover.image_id,
          first_release_date,
          genres.name,
          platforms.name,
          game_type.type,
          version_parent,
          total_rating,
          total_rating_count;
        where version_parent = null;
        limit 50;
      `
    );

  /*
   * Eliminamos bundles, mods, packs,
   * updates y demás ruido.
   */

  return games
    .filter(
      shouldShowGame
    )
    .slice(
      0,
      30
    );
}

/*
 * GAME DETAILS
 */

export async function getIGDBGame(
  id:
    string
) {
  if (
    !/^\d+$/.test(
      id
    )
  ) {
    return null;
  }

  const games =
    await requestIGDB<
      IGDBGame[]
    >(
      "games",
      `
        fields
          id,
          name,
          alternative_names.name,
          summary,
          first_release_date,
          cover.image_id,
          screenshots.image_id,
          genres.name,
          platforms.name,
          game_type.type,
          version_parent,
          total_rating,
          total_rating_count;
        where id = ${id};
        limit 1;
      `
    );

  return (
    games[0] ??
    null
  );
}

/*
 * IMAGE
 */

export function getIGDBImageUrl(
  imageId:
    | string
    | undefined,

  size:
    | "cover_big"
    | "screenshot_big"
    | "1080p" =
      "cover_big"
) {
  if (
    !imageId
  ) {
    return null;
  }

  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

/*
 * RELEASE YEAR
 */

export function getIGDBReleaseYear(
  timestamp:
    | number
    | undefined
) {
  if (
    !timestamp
  ) {
    return null;
  }

  return new Date(
    timestamp *
      1000
  ).getUTCFullYear();
}