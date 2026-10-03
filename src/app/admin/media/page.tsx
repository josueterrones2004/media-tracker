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

  if (
    !user
  ) {
    redirect(
      "/auth"
    );
  }

  const {
    data:
      profile,

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
    <main className="mx-auto w-full max-w-[1500px] pb-24">
      <div className="mb-6 flex items-start gap-3 sm:mb-8 sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/10 text-fuchsia-400 sm:h-11 sm:w-11">
          <ImageIcon
            size={
              20
            }
          />
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-bold text-zinc-100 sm:text-3xl">
            Administrar imágenes
          </h1>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-600 sm:text-sm">
            Corrige banners, portadas y encuadres sin modificar código.
          </p>
        </div>
      </div>

      <MediaAdminClient />
    </main>
  );
}