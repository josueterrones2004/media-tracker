import { shouldUseOriginalImage } from "@/lib/image-optimization";
import Image from "next/image";
export type ProfileCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface CroppedProfileImageProps {
  src: string;
  crop: ProfileCrop | null;
  alt: string;
  className?: string;
}

function isValidCrop(
  crop: ProfileCrop | null
): crop is ProfileCrop {
  if (!crop) {
    return false;
  }

  return (
    Number.isFinite(crop.x) &&
    Number.isFinite(crop.y) &&
    Number.isFinite(crop.width) &&
    Number.isFinite(crop.height) &&
    crop.x >= 0 &&
    crop.y >= 0 &&
    crop.width > 0 &&
    crop.height > 0 &&
    crop.width <= 100 &&
    crop.height <= 100 &&
    crop.x + crop.width <= 100.1 &&
    crop.y + crop.height <= 100.1
  );
}

export default function CroppedProfileImage({
  src,
  crop,
  alt,
  className = "",
}: CroppedProfileImageProps) {
  if (!isValidCrop(crop)) {
    return (
      <Image
        src={src}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
      
          width={500}
          height={750}
          unoptimized={shouldUseOriginalImage(src)}
        />
    );
  }

  /*
   * MUY IMPORTANTE:
   *
   * Solo escalamos usando el ancho.
   *
   * La altura queda automática para que
   * el navegador conserve la proporción
   * ORIGINAL de la imagen/GIF.
   *
   * El contenedor exterior ya tiene la
   * misma proporción que el recorte:
   *
   * avatar = 1:1
   * banner = 3:1
   */

  const imageWidth =
    (100 / crop.width) * 100;

  const left =
    -(crop.x / crop.width) * 100;

  const top =
    -(crop.y / crop.height) * 100;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src={src}
        alt={alt}
        className={`absolute max-w-none ${className}`}
        style={{
          width: `${imageWidth}%`,
          height: "auto",
          left: `${left}%`,
          top: `${top}%`,
        }}
      
          width={500}
          height={750}
          unoptimized={shouldUseOriginalImage(src)}
        />
    </div>
  );
}