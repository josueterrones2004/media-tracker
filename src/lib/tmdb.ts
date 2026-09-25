const TMDB_BASE_URL = "https://api.themoviedb.org/3";

function getHeaders() {
  const token = process.env.TMDB_READ_TOKEN;

  if (!token) {
    throw new Error("Falta TMDB_READ_TOKEN en .env.local");
  }

  return {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  };
}

export async function searchTMDB(query: string) {
  const params = new URLSearchParams({
    query,
    language: "es-MX",
    include_adult: "false",
  });

  const response = await fetch(
    `${TMDB_BASE_URL}/search/multi?${params.toString()}`,
    {
      headers: getHeaders(),
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Error consultando TMDB (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

export async function getMovieDetails(id: string) {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${id}?language=es-MX`,
    {
      headers: getHeaders(),
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `No se pudo cargar la película (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

export async function getSeriesDetails(id: string) {
  const response = await fetch(
    `${TMDB_BASE_URL}/tv/${id}?language=es-MX`,
    {
      headers: getHeaders(),
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `No se pudo cargar la serie (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

export async function getSeasonDetails(
  seriesId: string | number,
  seasonNumber: string | number
) {
  const token =
    process.env.TMDB_READ_TOKEN;

  if (!token) {
    throw new Error(
      "TMDB_READ_TOKEN no está configurado"
    );
  }

  const response = await fetch(
    `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}?language=es-MX`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
      next: {
        revalidate: 3600,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "Error cargando temporada desde TMDB"
    );
  }

  return response.json();
}