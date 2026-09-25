import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(
                process.env.NEXT_PUBLIC_SUPABASE_URL
              ).hostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
