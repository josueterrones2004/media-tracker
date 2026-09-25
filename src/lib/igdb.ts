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

export type IGDBGame = {
  id: number;
  name: string;

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

  total_rating?:
    number;

  total_rating_count?:
    number;
};

let cachedToken:
  | CachedToken
  | null = null;

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

async function getAccessToken() {
  if (
    cachedToken &&
    cachedToken.expiresAt >
      Date.now() + 60_000
  ) {
    return cachedToken.accessToken;
  }

  const {
    clientId,
    clientSecret,
  } = getCredentials();

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
        method: "POST",
        cache: "no-store",
      }
    );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Could not authenticate with IGDB (${response.status}): ${errorText}`
    );
  }

  const data =
    (await response.json()) as TwitchTokenResponse;

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

async function requestIGDB<T>(
  endpoint: string,
  body: string
): Promise<T> {
  const {
    clientId,
  } = getCredentials();

  const accessToken =
    await getAccessToken();

  const response =
    await fetch(
      `${IGDB_BASE_URL}/${endpoint}`,
      {
        method: "POST",

        headers: {
          "Client-ID":
            clientId,

          Authorization:
            `Bearer ${accessToken}`,

          "Content-Type":
            "text/plain",
        },

        body,

        cache: "no-store",
      }
    );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `IGDB request failed (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

function escapeSearchQuery(
  query: string
) {
  return query
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll(
      /\s+/g,
      " "
    )
    .trim();
}

export async function searchIGDBGames(
  query: string
) {
  const cleanQuery =
    escapeSearchQuery(
      query
    );

  if (!cleanQuery) {
    return [];
  }

  return requestIGDB<
    IGDBGame[]
  >(
    "games",
    `
      search "${cleanQuery}";
      fields
        id,
        name,
        cover.image_id,
        first_release_date,
        genres.name,
        platforms.name;
      limit 20;
    `
  );
}

export async function getIGDBGame(
  id: string
) {
  if (!/^\d+$/.test(id)) {
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
          summary,
          first_release_date,
          cover.image_id,
          screenshots.image_id,
          genres.name,
          platforms.name,
          total_rating,
          total_rating_count;
        where id = ${id};
        limit 1;
      `
    );

  return games[0] ??
    null;
}

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
  if (!imageId) {
    return null;
  }

  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

export function getIGDBReleaseYear(
  timestamp:
    | number
    | undefined
) {
  if (!timestamp) {
    return null;
  }

  return new Date(
    timestamp * 1000
  ).getUTCFullYear();
}