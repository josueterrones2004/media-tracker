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

type MediaType = "avatar" | "banner";

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const AVATAR_MAX_SIZE = 4 * 1024 * 1024;
const BANNER_MAX_SIZE = 8 * 1024 * 1024;

function getExtension(file: File) {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  if (extension) {
    return extension;
  }

  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return extensions[file.type] ?? "img";
}

function getStoragePathFromUrl(url: string | null) {
  if (!url) {
    return null;
  }

  const marker =
    "/storage/v1/object/public/profile-media/";

  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(
    url.slice(index + marker.length)
  );
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Error desconocido.";
}

export default function ProfileDetailsEditor({
  userId,
  initialProfile,
}: ProfileDetailsEditorProps) {
  const router = useRouter();

  const [supabase] = useState(() => createClient());

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(
    initialProfile.username ?? ""
  );

  const [savedUsername, setSavedUsername] = useState(
    initialProfile.username ?? ""
  );

  const [displayName, setDisplayName] = useState(
    initialProfile.displayName ?? ""
  );

  const [bio, setBio] = useState(
    initialProfile.bio ?? ""
  );

  const [avatarUrl, setAvatarUrl] = useState(
    initialProfile.avatarUrl
  );

  const [bannerUrl, setBannerUrl] = useState(
    initialProfile.bannerUrl
  );

  const [avatarCrop, setAvatarCrop] =
    useState<SavedCrop | null>(
      initialProfile.avatarCrop
    );

  const [bannerCrop, setBannerCrop] =
    useState<SavedCrop | null>(
      initialProfile.bannerCrop
    );

  const [avatarFile, setAvatarFile] =
    useState<File | null>(null);

  const [bannerFile, setBannerFile] =
    useState<File | null>(null);

  const [avatarPreview, setAvatarPreview] =
    useState<string | null>(
      initialProfile.avatarUrl
    );

  const [bannerPreview, setBannerPreview] =
    useState<string | null>(
      initialProfile.bannerUrl
    );

  const [cropTarget, setCropTarget] =
    useState<MediaType | null>(null);

  const [cropImage, setCropImage] =
    useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function validateImage(
    file: File,
    maxSize: number
  ) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Solo se permiten JPG, PNG, WebP y GIF.";
    }

    if (file.size > maxSize) {
      return `El archivo supera el límite de ${
        maxSize / 1024 / 1024
      } MB.`;
    }

    return null;
  }

  function handleImage(
    type: MediaType,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const maxSize =
      type === "avatar"
        ? AVATAR_MAX_SIZE
        : BANNER_MAX_SIZE;

    const error = validateImage(file, maxSize);

    if (error) {
      setMessage(error);
      event.target.value = "";
      return;
    }

    const currentPreview =
      type === "avatar"
        ? avatarPreview
        : bannerPreview;

    if (currentPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(currentPreview);
    }

    const preview = URL.createObjectURL(file);

    if (type === "avatar") {
      setAvatarFile(file);
      setAvatarPreview(preview);
      setAvatarCrop(null);
    } else {
      setBannerFile(file);
      setBannerPreview(preview);
      setBannerCrop(null);
    }

    setCropTarget(type);
    setCropImage(preview);
    setMessage("");
  }

  function applyCrop(crop: SavedCrop) {
    if (cropTarget === "avatar") {
      setAvatarCrop(crop);
    }

    if (cropTarget === "banner") {
      setBannerCrop(crop);
    }

    setCropTarget(null);
    setCropImage(null);
  }

  async function uploadImage(
    file: File,
    type: MediaType
  ) {
    const path = `${userId}/${type}-${Date.now()}.${getExtension(
      file
    )}`;

    const { error } = await supabase.storage
      .from("profile-media")
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(`${type}: ${error.message}`);
    }

    const { data } = supabase.storage
      .from("profile-media")
      .getPublicUrl(path);

    return {
      path,
      url: data.publicUrl,
    };
  }

  async function removeOldFile(url: string | null) {
    const path = getStoragePathFromUrl(url);

    if (!path) {
      return;
    }

    const { error } = await supabase.storage
      .from("profile-media")
      .remove([path]);

    if (error) {
      console.error(
        "Error removing previous profile image:",
        error
      );
    }
  }

  async function saveProfile() {
    if (saving) {
      return;
    }

    const cleanUsername = username.trim();
    const usernameChanged =
      cleanUsername !== savedUsername;

    /*
     * Existing generated usernames may exceed 20
     * characters. Validate only when the user changes
     * their username, so they can still save their
     * biography or images without changing it first.
     */

    if (
      usernameChanged &&
      !USERNAME_PATTERN.test(cleanUsername)
    ) {
      setMessage(
        "El nombre de usuario debe tener entre 3 y 20 caracteres. Usa letras, números o guion bajo (_)."
      );

      return;
    }

    if (displayName.trim().length > 50) {
      setMessage(
        "El nombre visible no puede superar los 50 caracteres."
      );

      return;
    }

    if (bio.trim().length > 300) {
      setMessage(
        "La biografía no puede superar los 300 caracteres."
      );

      return;
    }

    setSaving(true);
    setMessage("Guardando...");

    const uploadedPaths: string[] = [];
    let profileUpdated = false;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user || user.id !== userId) {
        throw new Error(
          "Tu sesión ha caducado. Inicia sesión de nuevo."
        );
      }

      let newAvatarUrl = avatarUrl;
      let newBannerUrl = bannerUrl;

      if (avatarFile) {
        setMessage("Subiendo foto...");

        const result = await uploadImage(
          avatarFile,
          "avatar"
        );

        newAvatarUrl = result.url;
        uploadedPaths.push(result.path);
      }

      if (bannerFile) {
        setMessage("Subiendo banner...");

        const result = await uploadImage(
          bannerFile,
          "banner"
        );

        newBannerUrl = result.url;
        uploadedPaths.push(result.path);
      }

      setMessage("Actualizando perfil...");

      const { data, error } = await supabase
        .from("profiles")
        .update({
          username: cleanUsername,

          display_name: displayName.trim() || null,
          bio: bio.trim() || null,

          avatar_url: newAvatarUrl,
          banner_url: newBannerUrl,

          avatar_crop: avatarCrop,
          banner_crop: bannerCrop,

          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select(`
          username,
          avatar_url,
          banner_url,
          avatar_crop,
          banner_crop
        `)
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "Ese nombre de usuario ya está ocupado. Prueba con otro."
          );
        }

        throw new Error(error.message);
      }

      profileUpdated = true;

      /*
       * Remove previous files only after Supabase
       * confirms that the profile was updated.
       */

      if (avatarFile) {
        await removeOldFile(avatarUrl);
      }

      if (bannerFile) {
        await removeOldFile(bannerUrl);
      }

      setSavedUsername(data.username);
      setUsername(data.username);

      setAvatarUrl(data.avatar_url);
      setBannerUrl(data.banner_url);

      setAvatarPreview(data.avatar_url);
      setBannerPreview(data.banner_url);

      setAvatarCrop(data.avatar_crop);
      setBannerCrop(data.banner_crop);

      setAvatarFile(null);
      setBannerFile(null);

      setMessage("Perfil actualizado.");

      router.refresh();
    } catch (error) {
      /*
       * If the database update failed, remove only
       * newly uploaded files that are not being used.
       */

      if (!profileUpdated && uploadedPaths.length > 0) {
        const { error: cleanupError } =
          await supabase.storage
            .from("profile-media")
            .remove(uploadedPaths);

        if (cleanupError) {
          console.error(
            "Error cleaning up uploaded images:",
            cleanupError
          );
        }
      }

      setMessage(`Error: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  }

  async function removeMedia(type: MediaType) {
    if (saving) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const currentUrl =
        type === "avatar"
          ? avatarUrl
          : bannerUrl;

      const values =
        type === "avatar"
          ? {
              avatar_url: null,
              avatar_crop: null,
            }
          : {
              banner_url: null,
              banner_crop: null,
            };

      const { error } = await supabase
        .from("profiles")
        .update(values)
        .eq("id", userId);

      if (error) {
        throw error;
      }

      await removeOldFile(currentUrl);

      if (type === "avatar") {
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

      setMessage(
        type === "avatar"
          ? "Foto eliminada."
          : "Banner eliminado."
      );

      router.refresh();
    } catch (error) {
      setMessage(`Error: ${getErrorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* PROFILE PREVIEW */}

      <ProfileMediaHeader
        banner={
          bannerPreview ? (
            <CroppedProfileImage
              src={bannerPreview}
              crop={bannerCrop}
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
              src={avatarPreview}
              crop={avatarCrop}
              alt="Avatar"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-zinc-500">
              {(displayName || savedUsername || "?")
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
            aria-label="Cambiar foto"
          >
            <Camera size={22} />
          </button>
        }
      >
        <h2 className="text-[clamp(24px,5vw,30px)] font-bold text-zinc-100">
          {displayName || savedUsername || "Usuario"}
        </h2>

        {savedUsername && (
          <p className="mt-1 break-all text-zinc-500">
            @{savedUsername}
          </p>
        )}

        <p className="mt-5 whitespace-pre-wrap text-zinc-300">
          {bio || "Sin biografía."}
        </p>
      </ProfileMediaHeader>

      {/* IMAGE INPUTS */}

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) =>
          handleImage("avatar", event)
        }
      />

      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) =>
          handleImage("banner", event)
        }
      />

      {/* IMAGE CONTROLS */}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            avatarInputRef.current?.click()
          }
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
        >
          <Camera size={16} />
          Cambiar foto
        </button>

        {avatarPreview && (
          <button
            type="button"
            onClick={() => {
              setCropTarget("avatar");
              setCropImage(avatarPreview);
            }}
            disabled={saving}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
          >
            Ajustar foto
          </button>
        )}

        {avatarPreview && (
          <button
            type="button"
            onClick={() => {
              void removeMedia("avatar");
            }}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-500 hover:text-red-400 disabled:opacity-50"
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
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
        >
          <ImageIcon size={16} />
          Cambiar banner
        </button>

        {bannerPreview && (
          <button
            type="button"
            onClick={() => {
              setCropTarget("banner");
              setCropImage(bannerPreview);
            }}
            disabled={saving}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 disabled:opacity-50"
          >
            Ajustar banner
          </button>
        )}

        {bannerPreview && (
          <button
            type="button"
            onClick={() => {
              void removeMedia("banner");
            }}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-500 hover:text-red-400 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Quitar banner
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-600">
        JPG, PNG, WebP o GIF. Avatar máximo 4 MB.
        Banner máximo 8 MB.
      </p>

      {/* PROFILE FIELDS */}

      <div className="mt-10 space-y-7">
        <div>
          <label
            htmlFor="profile-display-name"
            className="text-sm font-medium text-zinc-300"
          >
            Nombre visible
          </label>

          <input
            id="profile-display-name"
            type="text"
            value={displayName}
            onChange={(event) =>
              setDisplayName(event.target.value)
            }
            maxLength={50}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-fuchsia-500"
          />
        </div>

        {/* EXISTING USERNAME FIELD */}

        <div>
          <label
            htmlFor="profile-username"
            className="text-sm font-medium text-zinc-300"
          >
            Nombre de usuario
          </label>

          <div className="mt-2 flex min-w-0 items-center rounded-xl border border-zinc-800 bg-zinc-950 focus-within:border-fuchsia-500">
            <span className="pl-4 text-zinc-500">
              @
            </span>

            <input
              id="profile-username"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setMessage("");
              }}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              placeholder="TuUsuario"
              className="min-w-0 w-full bg-transparent px-2 py-3 text-zinc-100 outline-none placeholder:text-zinc-600"
            />
          </div>

          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Puedes usar mayúsculas, minúsculas, números
            y guion bajo (_). Entre 3 y 20 caracteres.
            No se permiten espacios.
          </p>
        </div>

        <div>
          <label
            htmlFor="profile-bio"
            className="text-sm font-medium text-zinc-300"
          >
            Biografía
          </label>

          <textarea
            id="profile-bio"
            value={bio}
            onChange={(event) =>
              setBio(event.target.value)
            }
            maxLength={300}
            rows={5}
            className="mt-2 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none focus:border-fuchsia-500"
          />
        </div>
      </div>

      {/* SAVE PROFILE */}

      <div className="mt-8">
        <button
          type="button"
          onClick={() => {
            void saveProfile();
          }}
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
          <p
            role="status"
            className="mt-3 text-sm text-zinc-400"
          >
            {message}
          </p>
        )}
      </div>

      {/* IMAGE CROP MODAL */}

      {cropTarget && cropImage && (
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