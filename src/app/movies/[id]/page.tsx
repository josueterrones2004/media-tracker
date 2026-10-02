import {
  CalendarDays,
  Clapperboard,
  Clock3,
} from "lucide-react";

import MediaDetailLayout from "@/components/media/MediaDetailLayout";

import {
  getMediaArtworkOverride,
} from "@/lib/media-artwork";

import {
  getMovieDetails,
} from "@/lib/tmdb";

import MovieActions from "./MovieActions";

interface MoviePageProps {
  params: Promise<{
    id: string;
  }>;
}

type Genre = {
  id: number;
  name: string;
};

type MovieDetails = {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  runtime?: number;
  genres?: Genre[];
};

function formatReleaseDate(
  date:
    | string
    | undefined
) {
  if (!date) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(
      "es-MX",
      {
        day:
          "numeric",
        month:
          "long",
        year:
          "numeric",
        timeZone:
          "UTC",
      }
    ).format(
      new Date(
        `${date}T00:00:00Z`
      )
    );
  } catch {
    return date;
  }
}

export default async function MoviePage({
  params,
}: MoviePageProps) {
  const {
    id,
  } =
    await params;

  const [
    movieResult,
    artwork,
  ] =
    await Promise.all([
      getMovieDetails(
        id
      ),

      getMediaArtworkOverride(
        "movie",
        id
      ),
    ]);

  const movie =
    movieResult as MovieDetails;

  const automaticPoster =
    movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null;

  const automaticBackdrop =
    movie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : null;

  const poster =
    artwork
      ?.poster_url ??
    automaticPoster;

  const backdrop =
    artwork
      ?.backdrop_url ??
    automaticBackdrop;

  const year =
    movie.release_date
      ? Number(
          movie.release_date.slice(
            0,
            4
          )
        )
      : null;

  const runtime =
    movie.runtime &&
    movie.runtime >
      0
      ? movie.runtime
      : null;

  const genres =
    movie.genres ??
    [];

  const releaseDate =
    formatReleaseDate(
      movie.release_date
    );

  const originalTitle =
    movie.original_title &&
    movie.original_title !==
      movie.title
      ? movie.original_title
      : null;

  const meta:
    string[] =
    [];

  if (year) {
    meta.push(
      String(
        year
      )
    );
  }

  if (runtime) {
    meta.push(
      `${runtime} min`
    );
  }

  const tags =
    genres.map(
      (
        genre
      ) =>
        genre.name
    );

  const information = [
    ...(releaseDate
      ? [
          {
            label:
              "Lanzamiento",

            value:
              releaseDate,

            icon: (
              <CalendarDays
                size={15}
              />
            ),
          },
        ]
      : []),

    {
      label:
        "Tipo",

      value:
        "Película",

      icon: (
        <Clapperboard
          size={15}
        />
      ),
    },

    ...(runtime
      ? [
          {
            label:
              "Duración",

            value:
              `${runtime} minutos`,

            icon: (
              <Clock3
                size={15}
              />
            ),
          },
        ]
      : []),

    ...(originalTitle
      ? [
          {
            label:
              "Título original",

            value:
              originalTitle,

            icon: (
              <Clapperboard
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
        movie.title
      }
      eyebrow="Película"
      coverUrl={
        poster
      }
      backdropUrl={
        backdrop
      }
      coverPositionX={
        artwork
          ?.poster_position_x ??
        50
      }
      coverPositionY={
        artwork
          ?.poster_position_y ??
        50
      }
      coverZoom={
        artwork
          ?.poster_zoom ??
        1
      }
      backdropPositionX={
        artwork
          ?.backdrop_position_x ??
        50
      }
      backdropPositionY={
        artwork
          ?.backdrop_position_y ??
        50
      }
      backdropZoom={
        artwork
          ?.backdrop_zoom ??
        1
      }
      meta={
        meta
      }
      tags={
        tags
      }
      description={
        movie.overview ??
        null
      }
      noDescriptionText="No hay una sinopsis disponible para esta película."
      information={
        information
      }
    >
      <MovieActions
        movie={
          movie
        }
      />
    </MediaDetailLayout>
  );
}