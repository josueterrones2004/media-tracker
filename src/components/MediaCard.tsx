import { shouldUseOriginalImage } from "@/lib/image-optimization";
import Image from "next/image";
import Link from "next/link";
import { MediaItem } from "@/types/media";

interface MediaCardProps {
  item: MediaItem;
}

function getStatusLabel(item: MediaItem) {
  const labels = {
    pending: "Pendiente",
    playing: "Jugando",
    watching: "Viendo",
    reading: "Leyendo",
    completed: "Completado",
    paused: "Pausado",
    dropped: "Abandonado",
  };

  return labels[item.status];
}

export default function MediaCard({
  item,
}: MediaCardProps) {
  const route =
    item.type === "game"
      ? "games"
      : item.type === "movie"
        ? "movies"
        : item.type === "series"
          ? "series"
          : "books";

  return (
    <Link
      href={`/${route}/${item.id}`}
      className="group block"
    >
      <div className="overflow-hidden rounded-xl bg-zinc-900">
        <Image
          src={item.cover}
          alt={item.title}
          className="aspect-[2/3] w-full object-cover transition duration-200 group-hover:scale-105"
        
          width={500}
          height={750}
          unoptimized={shouldUseOriginalImage(item.cover)}
        />
      </div>

      <div className="mt-3">
        <h2 className="font-semibold text-zinc-100">
          {item.title}
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          {getStatusLabel(item)}
        </p>
      </div>
    </Link>
  );
}