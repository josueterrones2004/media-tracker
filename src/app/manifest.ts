import type {
  MetadataRoute,
} from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",

    name:
      "Media Tracker",

    short_name:
      "Media Tracker",

    description:
      "Lleva un registro de tus películas, series, libros y juegos.",

    start_url:
      "/",

    scope:
      "/",

    display:
      "standalone",

    background_color:
      "#09090b",

    theme_color:
      "#09090b",

    orientation:
      "any",

    categories: [
      "entertainment",
      "lifestyle",
    ],

    icons: [
      {
        src:
          "/pwa-icon-192",

        sizes:
          "192x192",

        type:
          "image/png",

        purpose:
          "any",
      },
      {
        src:
          "/pwa-icon-512",

        sizes:
          "512x512",

        type:
          "image/png",

        purpose:
          "any",
      },
      {
        src:
          "/pwa-icon-512",

        sizes:
          "512x512",

        type:
          "image/png",

        purpose:
          "maskable",
      },
    ],
  };
}