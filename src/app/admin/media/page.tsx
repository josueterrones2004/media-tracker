import {
  ImageIcon,
} from "lucide-react";

import {
  redirect,
} from "next/navigation";

import MediaAdminClient from "./MediaAdminClient";

import {
  createClient,
} from "@/lib/supabase/server";

export default async function AdminMediaPage() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/auth"
    );
  }

  const {
    data: profile,
    error,
  } =
    await supabase
      .from(
        "profiles"
      )
      .select(
        "special_role"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  if (
    error ||
    profile?.special_role !==
      "OWNER"
  ) {
    redirect(
      "/"
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] pb-20">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400">
          <ImageIcon
            size={21}
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
            Administrar imágenes
          </h1>

          <p className="mt-1 text-sm text-zinc-600">
            Corrige banners, portadas y encuadres sin modificar código.
          </p>
        </div>
      </div>

      <MediaAdminClient />
    </main>
  );
}