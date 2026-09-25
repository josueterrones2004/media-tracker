"use client";

import {
  Camera,
  ImageIcon,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";

import {
  ChangeEvent,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import CroppedProfileImage from "@/app/profile/CroppedProfileImage";
import ProfileMediaHeader from "@/app/profile/ProfileMediaHeader";

import { createClient } from "@/lib/supabase/client";

import ImageCropModal, {
  SavedCrop,
} from "./ImageCropModal";

interface ProfileDetailsEditorProps {
  userId: string;

  initialProfile: {
    username: string | null;
    displayName: string | null;
    bio: string | null;

    avatarUrl: string | null;
    bannerUrl: string | null;

    avatarCrop: SavedCrop | null;
    bannerCrop: SavedCrop | null;
  };
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const AVATAR_MAX_SIZE =
  4 * 1024 * 1024;

const BANNER_MAX_SIZE =
  8 * 1024 * 1024;

function getExtension(file: File) {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  if (extension) {
    return extension;
  }

  const map: Record<
    string,
    string
  > = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return (
    map[file.type] ??
    "img"
  );
}

function getStoragePathFromUrl(
  url: string | null
) {
  if (!url) return null;

  const marker =
    "/storage/v1/object/public/profile-media/";

  const index =
    url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(
    url.slice(
      index + marker.length
    )
  );
}

function getErrorMessage(
  error: unknown
) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message ===
      "string"
  ) {
    return error.message;
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  try {
    return JSON.stringify(
      error
    );
  } catch {
    return "Error desconocido.";
  }
}

export default function ProfileDetailsEditor({
  userId,
  initialProfile,
}: ProfileDetailsEditorProps) {
  const router =
    useRouter();

  const [supabase] =
    useState(() =>
      createClient()
    );

  const avatarInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const bannerInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    displayName,
    setDisplayName,
  ] = useState(
    initialProfile.displayName ??
      ""
  );

  const [bio, setBio] =
    useState(
      initialProfile.bio ?? ""
    );

  const [
    avatarUrl,
    setAvatarUrl,
  ] = useState(
    initialProfile.avatarUrl
  );

  const [
    bannerUrl,
    setBannerUrl,
  ] = useState(
    initialProfile.bannerUrl
  );

  const [
    avatarCrop,
    setAvatarCrop,
  ] =
    useState<SavedCrop | null>(
      initialProfile.avatarCrop
    );

  const [
    bannerCrop,
    setBannerCrop,
  ] =
    useState<SavedCrop | null>(
      initialProfile.bannerCrop
    );

  const [
    avatarFile,
    setAvatarFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    bannerFile,
    setBannerFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    avatarPreview,
    setAvatarPreview,
  ] =
    useState<string | null>(
      initialProfile.avatarUrl
    );

  const [
    bannerPreview,
    setBannerPreview,
  ] =
    useState<string | null>(
      initialProfile.bannerUrl
    );

  const [
    cropTarget,
    setCropTarget,
  ] =
    useState<
      "avatar" | "banner" | null
    >(null);

  const [
    cropImage,
    setCropImage,
  ] =
    useState<string | null>(
      null
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  function validateImage(
    file: File,
    maxSize: number
  ) {
    if (
      !ACCEPTED_TYPES.includes(
        file.type
      )
    ) {
      return "Solo se permiten JPG, PNG, WebP y GIF.";
    }

    if (
      file.size > maxSize
    ) {
      return `El archivo supera el límite de ${
        maxSize /
        1024 /
        1024
      } MB.`;
    }

    return null;
  }

  function handleImage(
    type: "avatar" | "banner",
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const maxSize =
      type === "avatar"
        ? AVATAR_MAX_SIZE
        : BANNER_MAX_SIZE;

    const error =
      validateImage(
        file,
        maxSize
      );

    if (error) {
      setMessage(error);
      event.target.value = "";
      return;
    }

    const currentPreview =
      type === "avatar"
        ? avatarPreview
        : bannerPreview;

    if (
      currentPreview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        currentPreview
      );
    }

    const preview =
      URL.createObjectURL(file);

    if (
      type === "avatar"
    ) {
      setAvatarFile(file);
      setAvatarPreview(
        preview
      );
      setAvatarCrop(null);
    } else {
      setBannerFile(file);
      setBannerPreview(
        preview
      );
      setBannerCrop(null);
    }

    setCropTarget(type);
    setCropImage(preview);
    setMessage("");
  }

  function applyCrop(
    crop: SavedCrop
  ) {
    if (
      cropTarget === "avatar"
    ) {
      setAvatarCrop(crop);
    }

    if (
      cropTarget === "banner"
    ) {
      setBannerCrop(crop);
    }

    setCropTarget(null);
    setCropImage(null);
  }

  async function uploadImage(
    file: File,
    type: "avatar" | "banner"
  ) {
    const path =
      `${userId}/${type}-${Date.now()}.${getExtension(
        file
      )}`;

    const {
      error,
    } =
      await supabase.storage
        .from("profile-media")
        .upload(
          path,
          file,
          {
            cacheControl:
              "3600",

            contentType:
              file.type,

            upsert: false,
          }
        );

    if (error) {
      throw new Error(
        `${type}: ${error.message}`
      );
    }

    const { data } =
      supabase.storage
        .from("profile-media")
        .getPublicUrl(path);

    return {
      path,
      url: data.publicUrl,
    };
  }

  async function removeOldFile(
    url: string | null
  ) {
    const path =
      getStoragePathFromUrl(
        url
      );

    if (!path) return;

    await supabase.storage
      .from("profile-media")
      .remove([path]);
  }

  async function saveProfile() {
    if (saving) return;

    if (
      displayName.trim().length >
      50
    ) {
      setMessage(
        "El nombre no puede superar los 50 caracteres."
      );

      return;
    }

    if (
      bio.trim().length > 300
    ) {
      setMessage(
        "La biografía no puede superar los 300 caracteres."
      );

      return;
    }

    setSaving(true);
    setMessage(
      "Guardando..."
    );

    try {
      let newAvatarUrl =
        avatarUrl;

      let newBannerUrl =
        bannerUrl;

      if (avatarFile) {
        setMessage(
          "Subiendo foto..."
        );

        const result =
          await uploadImage(
            avatarFile,
            "avatar"
          );

        newAvatarUrl =
          result.url;
      }

      if (bannerFile) {
        setMessage(
          "Subiendo banner..."
        );

        const result =
          await uploadImage(
            bannerFile,
            "banner"
          );

        newBannerUrl =
          result.url;
      }

      setMessage(
        "Actualizando perfil..."
      );

      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            display_name:
              displayName.trim() ||
              null,

            bio:
              bio.trim() ||
              null,

            avatar_url:
              newAvatarUrl,

            banner_url:
              newBannerUrl,

            avatar_crop:
              avatarCrop,

            banner_crop:
              bannerCrop,

            updated_at:
              new Date().toISOString(),
          })
          .eq("id", userId)
          .select(`
            avatar_url,
            banner_url,
            avatar_crop,
            banner_crop
          `)
          .single();

      if (error) {
        throw new Error(
          error.message
        );
      }

      if (avatarFile) {
        await removeOldFile(
          avatarUrl
        );
      }

      if (bannerFile) {
        await removeOldFile(
          bannerUrl
        );
      }

      setAvatarUrl(
        data.avatar_url
      );

      setBannerUrl(
        data.banner_url
      );

      setAvatarPreview(
        data.avatar_url
      );

      setBannerPreview(
        data.banner_url
      );

      setAvatarCrop(
        data.avatar_crop
      );

      setBannerCrop(
        data.banner_crop
      );

      setAvatarFile(null);
      setBannerFile(null);

      router.refresh();

      setMessage(
        "Perfil actualizado."
      );
    } catch (error) {
      setMessage(
        `Error: ${getErrorMessage(
          error
        )}`
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeMedia(
    type: "avatar" | "banner"
  ) {
    if (saving) return;

    setSaving(true);

    try {
      const currentUrl =
        type === "avatar"
          ? avatarUrl
          : bannerUrl;

      const values =
        type === "avatar"
          ? {
              avatar_url:
                null,

              avatar_crop:
                null,
            }
          : {
              banner_url:
                null,

              banner_crop:
                null,
            };

      const { error } =
        await supabase
          .from("profiles")
          .update(values)
          .eq("id", userId);

      if (error) {
        throw error;
      }

      await removeOldFile(
        currentUrl
      );

      if (
        type === "avatar"
      ) {
        setAvatarUrl(null);
        setAvatarPreview(null);
        setAvatarCrop(null);
        setAvatarFile(null);
      } else {
        setBannerUrl(null);
        setBannerPreview(null);
        setBannerCrop(null);
        setBannerFile(null);
      }

      router.refresh();
    } catch (error) {
      setMessage(
        `Error: ${getErrorMessage(
          error
        )}`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* PREVIEW REAL */}
      <ProfileMediaHeader
        banner={
          bannerPreview ? (
            <CroppedProfileImage
              src={
                bannerPreview
              }
              crop={
                bannerCrop
              }
              alt="Banner"
            />
          ) : null
        }
        bannerControls={
          <button
            type="button"
            onClick={() =>
              bannerInputRef.current?.click()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-black/70 px-3 py-2 text-sm text-white backdrop-blur hover:bg-black/80"
          >
            <ImageIcon size={16} />

            Cambiar banner
          </button>
        }
        avatar={
          avatarPreview ? (
            <CroppedProfileImage
              src={
                avatarPreview
              }
              crop={
                avatarCrop
              }
              alt="Avatar"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-zinc-500">
              {(
                displayName ||
                initialProfile.username ||
                "?"
              )
                .slice(0, 1)
                .toUpperCase()}
            </div>
          )
        }
        avatarControls={
          <button
            type="button"
            onClick={() =>
              avatarInputRef.current?.click()
            }
            className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition hover:bg-black/55 hover:text-white"
          >
            <Camera size={22} />
          </button>
        }
      >
        <h2 className="text-[clamp(24px,5vw,30px)] font-bold text-zinc-100">
          {displayName ||
            initialProfile.username ||
            "Usuario"}
        </h2>

        {initialProfile.username && (
          <p className="mt-1 text-zinc-500">
            @{initialProfile.username}
          </p>
        )}

        <p className="mt-5 whitespace-pre-wrap text-zinc-300">
          {bio ||
            "Sin biografía."}
        </p>
      </ProfileMediaHeader>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) =>
          handleImage(
            "avatar",
            event
          )
        }
      />

      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) =>
          handleImage(
            "banner",
            event
          )
        }
      />

      {/* CONTROLES */}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            avatarInputRef.current?.click()
          }
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200"
        >
          <Camera size={16} />

          Cambiar foto
        </button>

        {avatarPreview && (
          <button
            type="button"
            onClick={() => {
              setCropTarget(
                "avatar"
              );

              setCropImage(
                avatarPreview
              );
            }}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200"
          >
            Ajustar foto
          </button>
        )}

        {avatarPreview && (
          <button
            type="button"
            onClick={() =>
              removeMedia(
                "avatar"
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-500 hover:text-red-400"
          >
            <Trash2 size={16} />

            Quitar foto
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            bannerInputRef.current?.click()
          }
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200"
        >
          <ImageIcon size={16} />

          Cambiar banner
        </button>

        {bannerPreview && (
          <button
            type="button"
            onClick={() => {
              setCropTarget(
                "banner"
              );

              setCropImage(
                bannerPreview
              );
            }}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200"
          >
            Ajustar banner
          </button>
        )}

        {bannerPreview && (
          <button
            type="button"
            onClick={() =>
              removeMedia(
                "banner"
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-500 hover:text-red-400"
          >
            <Trash2 size={16} />

            Quitar banner
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        JPG, PNG, WebP o GIF.
        Avatar máximo 4 MB.
        Banner máximo 8 MB.
      </p>

      {/* DATOS */}
      <div className="mt-10 space-y-7">
        <div>
          <label className="text-sm font-medium text-zinc-300">
            Nombre visible
          </label>

          <input
            value={displayName}
            onChange={(event) =>
              setDisplayName(
                event.target.value
              )
            }
            maxLength={50}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-fuchsia-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-300">
            Nombre de usuario
          </label>

          <input
            value={
              initialProfile.username ??
              ""
            }
            disabled
            className="mt-2 w-full rounded-xl border border-zinc-900 bg-zinc-950/50 px-4 py-3 text-zinc-600"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-300">
            Biografía
          </label>

          <textarea
            value={bio}
            onChange={(event) =>
              setBio(
                event.target.value
              )
            }
            maxLength={300}
            rows={5}
            className="mt-2 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-fuchsia-500"
          />
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-5 py-3 font-medium text-white disabled:opacity-50"
        >
          {saving ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save size={18} />
          )}

          {saving
            ? "Guardando..."
            : "Guardar perfil"}
        </button>

        {message && (
          <p className="mt-3 text-sm text-zinc-500">
            {message}
          </p>
        )}
      </div>

      {cropTarget &&
        cropImage && (
          <ImageCropModal
            image={cropImage}
            type={cropTarget}
            onCancel={() => {
              setCropTarget(null);
              setCropImage(null);
            }}
            onApply={applyCrop}
          />
        )}
    </>
  );
}