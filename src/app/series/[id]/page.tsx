import {
  CalendarDays,
  Layers3,
  ListVideo,
  Tv,
} from "lucide-react";

import MediaDetailLayout from "@/components/media/MediaDetailLayout";

import {
  getSeriesDetails,
} from "@/lib/tmdb";

import Seasons from "./Seasons";
import SeriesActions from "./SeriesActions";

type Genre = {
  id: number;
  name: string;
};

type Season = {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path?: string | null;
};

type SeriesDetails = {
  id: number;

  name: string;

  original_name?: string;

  overview?: string;

  poster_path?:
    | string
    | null;

  backdrop_path?:
    | string
    | null;

  first_air_date?: string;

  number_of_seasons?: number;

  number_of_episodes?: number;

  genres?: Genre[];

  seasons?: Season[];
};

interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

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

export default async function SeriesDetailsPage({
  params,
}: SeriesPageProps) {
  const {
    id,
  } =
    await params;

  const show =
    (await getSeriesDetails(
      id
    )) as SeriesDetails;

  /*
   * IMAGES
   */

  const poster =
    show.poster_path
      ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
      : null;

  const backdrop =
    show.backdrop_path
      ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
      : null;

  /*
   * BASIC INFO
   */

  const year =
    show.first_air_date
      ? Number(
          show.first_air_date.slice(
            0,
            4
          )
        )
      : null;

  const releaseDate =
    formatReleaseDate(
      show.first_air_date
    );

  const seasonCount =
    show.number_of_seasons ??
    null;

  const episodeCount =
    show.number_of_episodes ??
    null;

  const genres =
    show.genres ?? [];

  const originalName =
    show.original_name &&
    show.original_name !==
      show.name
      ? show.original_name
      : null;

  /*
   * HERO META
   */

  const meta: string[] =
    [];

  if (year) {
    meta.push(
      String(
        year
      )
    );
  }

  if (
    seasonCount !==
    null
  ) {
    meta.push(
      `${seasonCount} ${
        seasonCount === 1
          ? "temporada"
          : "temporadas"
      }`
    );
  }

  if (
    episodeCount !==
    null
  ) {
    meta.push(
      `${episodeCount} ${
        episodeCount === 1
          ? "episodio"
          : "episodios"
      }`
    );
  }

  /*
   * TAGS
   */

  const tags =
    genres.map(
      (
        genre
      ) =>
        genre.name
    );

  /*
   * INFORMATION
   */

  const information = [
    ...(releaseDate
      ? [
          {
            label:
              "Estreno",

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
        "Serie",

      icon: (
        <Tv
          size={15}
        />
      ),
    },

    ...(seasonCount !==
    null
      ? [
          {
            label:
              "Temporadas",

            value:
              String(
                seasonCount
              ),

            icon: (
              <Layers3
                size={15}
              />
            ),
          },
        ]
      : []),

    ...(episodeCount !==
    null
      ? [
          {
            label:
              "Episodios",

            value:
              String(
                episodeCount
              ),

            icon: (
              <ListVideo
                size={15}
              />
            ),
          },
        ]
      : []),

    ...(originalName
      ? [
          {
            label:
              "Título original",

            value:
              originalName,

            icon: (
              <Tv
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
        show.name
      }
      eyebrow="Serie"
      coverUrl={
        poster
      }
      backdropUrl={
        backdrop
      }
      meta={
        meta
      }
      tags={
        tags
      }
      description={
        show.overview ??
        null
      }
      noDescriptionText="No hay una sinopsis disponible para esta serie."
      information={
        information
      }
      mainContent={
        <Seasons
          seriesId={
            show.id
          }
          seriesTitle={
            show.name
          }
          posterPath={
            show.poster_path
          }
          seasons={
            show.seasons ??
            []
          }
        />
      }
    >
      <SeriesActions
        show={
          show
        }
      />
    </MediaDetailLayout>
  );
}