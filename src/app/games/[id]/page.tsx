import {
  CalendarDays,
  Gamepad2,
  Monitor,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import MediaDetailLayout from "@/components/media/MediaDetailLayout";

import {
  getIGDBBackdropUrl,
  getIGDBGame,
  getIGDBGameTypeLabel,
  getIGDBImageUrl,
  getIGDBReleaseYear,
  normalizeIGDBGameType,
} from "@/lib/igdb";

import {
  getMediaArtworkOverride,
} from "@/lib/media-artwork";

import GameActions from "./GameActions";

interface GamePageProps {
  params: Promise<{
    id: string;
  }>;
}

function getGameTypeLabel(
  game:
    NonNullable<
      Awaited<
        ReturnType<
          typeof getIGDBGame
        >
      >
    >
) {
  const type =
    normalizeIGDBGameType(
      game.game_type
        ?.type
    );

  if (
    type ===
    "main_game"
  ) {
    return "Juego principal";
  }

  if (
    type ===
    "expanded_game"
  ) {
    return "Edición expandida";
  }

  return getIGDBGameTypeLabel(
    game
  );
}

export default async function GamePage({
  params,
}: GamePageProps) {
  const {
    id,
  } =
    await params;

  const [
    game,
    override,
  ] =
    await Promise.all([
      getIGDBGame(
        id
      ),

      getMediaArtworkOverride(
        "game",
        id
      ),
    ]);

  if (!game) {
    notFound();
  }

  const automaticCover =
    getIGDBImageUrl(
      game.cover
        ?.image_id,
      "cover_big"
    );

  const automaticBackdrop =
    getIGDBBackdropUrl(
      game
    );

  const cover =
    override
      ?.poster_url ??
    automaticCover;

  const backdrop =
    override
      ?.backdrop_url ??
    automaticBackdrop;

  const releaseYear =
    getIGDBReleaseYear(
      game.first_release_date
    );

  const gameType =
    getGameTypeLabel(
      game
    );

  const platforms =
    game.platforms ??
    [];

  const genres =
    game.genres ??
    [];

  const meta:
    string[] =
    [];

  if (
    releaseYear
  ) {
    meta.push(
      String(
        releaseYear
      )
    );
  }

  if (
    platforms.length >
    0
  ) {
    meta.push(
      platforms
        .slice(
          0,
          5
        )
        .map(
          (
            platform
          ) =>
            platform.name
        )
        .join(
          ", "
        )
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
    ...(releaseYear
      ? [
          {
            label:
              "Lanzamiento",

            value:
              String(
                releaseYear
              ),

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
        gameType,

      icon: (
        <Gamepad2
          size={15}
        />
      ),
    },

    ...(platforms.length >
    0
      ? [
          {
            label:
              "Plataformas",

            value:
              platforms
                .map(
                  (
                    platform
                  ) =>
                    platform.name
                )
                .join(
                  ", "
                ),

            icon: (
              <Monitor
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
        game.name
      }
      eyebrow={
        gameType
      }
      coverUrl={
        cover
      }
      backdropUrl={
        backdrop
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
      backdropPositionX={
        override
          ?.backdrop_position_x ??
        50
      }
      backdropPositionY={
        override
          ?.backdrop_position_y ??
        50
      }
      backdropZoom={
        override
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
        game.summary ??
        null
      }
      noDescriptionText="No hay una sinopsis disponible para este juego."
      information={
        information
      }
    >
      <GameActions
        game={{
          id:
            String(
              game.id
            ),

          title:
            game.name,

          coverUrl:
            cover,

          backdropUrl:
            backdrop,

          releaseYear,
        }}
      />
    </MediaDetailLayout>
  );
}