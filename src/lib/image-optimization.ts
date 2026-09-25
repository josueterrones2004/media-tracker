const SUPABASE_HOST =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(
        process.env.NEXT_PUBLIC_SUPABASE_URL
      ).hostname
    : null;

const OPTIMIZED_HOSTS = [
  "image.tmdb.org",
  "covers.openlibrary.org",
  SUPABASE_HOST,
];

export function shouldUseOriginalImage(
  source: string
): boolean {
  if (
    source.startsWith("data:") ||
    source.startsWith("blob:")
  ) {
    return true;
  }

  if (
    source.startsWith("/") &&
    !source.startsWith("//")
  ) {
    return false;
  }

  try {
    const url = new URL(source);

    if (
      url.pathname
        .toLowerCase()
        .endsWith(".gif")
    ) {
      return true;
    }

    return (
      url.protocol !== "https:" ||
      !OPTIMIZED_HOSTS.includes(
        url.hostname
      )
    );
  } catch {
    return true;
  }
}
