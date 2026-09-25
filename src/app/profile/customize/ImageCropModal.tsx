
"use client";

import {
  Check,
  Minus,
  Plus,
  X,
} from "lucide-react";

import {
  useCallback,
  useState,
} from "react";

import Cropper, {
  Area,
} from "react-easy-crop";

export type SavedCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface ImageCropModalProps {
  image: string;

  type:
    | "avatar"
    | "banner";

  onCancel: () => void;

  onApply: (
    crop: SavedCrop
  ) => void;
}

export default function ImageCropModal({
  image,
  type,
  onCancel,
  onApply,
}: ImageCropModalProps) {
  const [crop, setCrop] =
    useState({
      x: 0,
      y: 0,
    });

  const [zoom, setZoom] =
    useState(1);

  const [
    croppedAreaPercentages,
    setCroppedAreaPercentages,
  ] =
    useState<Area | null>(
      null
    );

  const handleCropComplete =
    useCallback(
      (
        areaPercentages: Area
      ) => {
        setCroppedAreaPercentages(
          areaPercentages
        );
      },
      []
    );

  function applyCrop() {
    if (
      !croppedAreaPercentages
    ) {
      return;
    }

    onApply({
      x:
        croppedAreaPercentages.x,

      y:
        croppedAreaPercentages.y,

      width:
        croppedAreaPercentages.width,

      height:
        croppedAreaPercentages.height,
    });
  }

  /* IMAGE ASPECT RATIO */

  const aspect =
    type === "avatar"
      ? 1
      : 3 / 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">
              {type === "avatar"
                ? "Recortar foto de perfil"
                : "Recortar banner"}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Arrastra la imagen y ajusta el zoom
              hasta que quede como quieres.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative h-[430px] bg-black">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={
              type === "avatar"
                ? "round"
                : "rect"
            }
            showGrid
            objectFit="contain"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={
              handleCropComplete
            }
          />
        </div>

        <div className="border-t border-zinc-800 p-5">
          <div className="flex items-center gap-4">
            <Minus
              size={18}
              className="text-zinc-500"
            />

            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(
                event
              ) =>
                setZoom(
                  Number(
                    event.target.value
                  )
                )
              }
              className="w-full accent-fuchsia-500"
              aria-label="Zoom"
            />

            <Plus
              size={18}
              className="text-zinc-500"
            />
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={applyCrop}
              disabled={!croppedAreaPercentages}
              className="flex items-center gap-2 rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
            >
              <Check size={16} />

              Aplicar recorte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}