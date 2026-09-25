import { NextResponse } from "next/server";
import { getSeasonDetails } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const seriesId =
      searchParams.get("seriesId");

    const seasonNumber =
      searchParams.get("seasonNumber");

    if (!seriesId || !seasonNumber) {
      return NextResponse.json(
        {
          error:
            "Faltan seriesId o seasonNumber.",
        },
        {
          status: 400,
        }
      );
    }

    const data = await getSeasonDetails(
      seriesId,
      seasonNumber
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Error loading season:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo cargar la temporada.",
      },
      {
        status: 500,
      }
    );
  }
}