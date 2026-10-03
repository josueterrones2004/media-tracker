"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ChevronDown,
  ImageIcon,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  Suspense,
  useState,
} from "react";

import BugReportButton from "@/components/BugReportButton";
import GlobalSearch from "@/components/GlobalSearch";
import InstallAppPrompt from "@/components/InstallAppPrompt";
import NotificationsButton from "@/components/NotificationsButton";

import {
  createClient,
} from "@/lib/supabase/client";

type SpecialRole =
  | "OWNER"
  | "BETA_TESTER"
  | null;

type ShellProfile = {
  username:
    | string
    | null;

  display_name:
    | string
    | null;

  avatar_url:
    | string
    | null;

  special_role:
    SpecialRole;
};

interface AppShellProps {
  children:
    React.ReactNode;

  authenticated:
    boolean;

  profile:
    | ShellProfile
    | null;
}

const navigation = [
  {
    href: "/",
    label: "Inicio",
  },
  {
    href: "/games",
    label: "Juegos",
  },
  {
    href: "/movies",
    label: "Películas",
  },
  {
    href: "/series",
    label: "Series",
  },
  {
    href: "/books",
    label: "Libros",
  },
  {
    href: "/social",
    label: "Social",
  },
];

function isNavigationActive(
  pathname:
    string,

  href:
    string
) {
  if (
    href ===
    "/"
  ) {
    return (
      pathname ===
      "/"
    );
  }

  return (
    pathname ===
      href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

function isMediaDetailRoute(
  pathname:
    string
) {
  const segments =
    pathname
      .split("/")
      .filter(
        Boolean
      );

  if (
    segments.length !==
    2
  ) {
    return false;
  }

  return [
    "movies",
    "series",
    "books",
    "games",
  ].includes(
    segments[0]
  );
}

function getInitial(
  profile:
    | ShellProfile
    | null
) {
  const value =
    profile?.display_name ??
    profile?.username ??
    "U";

  return value
    .slice(
      0,
      1
    )
    .toUpperCase();
}

export default function AppShell({
  children,
  authenticated,
  profile,
}: AppShellProps) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    supabase,
  ] =
    useState(
      () =>
        createClient()
    );

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(
      false
    );

  const [
    profileMenuOpen,
    setProfileMenuOpen,
  ] =
    useState(
      false
    );

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(
      false
    );

  const isFlushProfileRoute =
    pathname ===
      "/profile" ||
    pathname ===
      "/profile/customize" ||
    (
      pathname.startsWith(
        "/profile/"
      ) &&
      pathname
        .split("/")
        .filter(
          Boolean
        ).length ===
        2
    );

  const isFlushRoute =
    isFlushProfileRoute ||
    isMediaDetailRoute(
      pathname
    );

  const displayName =
    profile?.display_name ??
    profile?.username ??
    "Usuario";

  async function handleLogout() {
    if (
      loggingOut
    ) {
      return;
    }

    setLoggingOut(
      true
    );

    const {
      error,
    } =
      await supabase.auth.signOut();

    if (
      error
    ) {
      console.error(
        "Error signing out:",
        error
      );

      setLoggingOut(
        false
      );

      return;
    }

    setMobileMenuOpen(
      false
    );

    setProfileMenuOpen(
      false
    );

    router.replace(
      "/auth"
    );

    router.refresh();
  }

  if (
    pathname.startsWith(
      "/auth"
    ) ||
    !authenticated
  ) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-[100] border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-xl">
        {/* DESKTOP */}

        <div className="hidden h-[70px] xl:block">
          <div className="mx-auto flex h-full w-full max-w-[1700px] items-center gap-4 px-6 2xl:gap-7">
            <Link
              href="/"
              onClick={() =>
                setProfileMenuOpen(
                  false
                )
              }
              className="shrink-0 text-xl font-bold tracking-tight text-fuchsia-400"
            >
              Media Tracker
            </Link>

            <nav className="flex shrink-0 items-center gap-0.5 2xl:gap-1">
              {navigation.map(
                (
                  item
                ) => {
                  const active =
                    isNavigationActive(
                      pathname,
                      item.href
                    );

                  return (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      className={`rounded-lg px-3 py-2 text-sm transition 2xl:px-3.5 ${
                        active
                          ? "bg-fuchsia-500/10 text-fuchsia-300"
                          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                      }`}
                    >
                      {
                        item.label
                      }
                    </Link>
                  );
                }
              )}
            </nav>

            <div className="ml-auto flex min-w-0 items-center gap-2 2xl:gap-3">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setProfileMenuOpen(
                      (
                        current
                      ) =>
                        !current
                    )
                  }
                  className="flex h-11 items-center gap-2 rounded-xl px-2 text-zinc-200 transition hover:bg-zinc-900"
                  aria-label="Abrir menú del perfil"
                  aria-expanded={
                    profileMenuOpen
                  }
                >
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                    {profile?.avatar_url ? (
                      <Image
                        src={
                          profile.avatar_url
                        }
                        alt={
                          displayName
                        }
                        width={
                          64
                        }
                        height={
                          64
                        }
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-500">
                        {getInitial(
                          profile
                        )}
                      </div>
                    )}
                  </div>

                  <span className="max-w-[110px] truncate text-sm font-semibold 2xl:max-w-[150px]">
                    {
                      displayName
                    }
                  </span>

                  <ChevronDown
                    size={
                      14
                    }
                    className={`shrink-0 text-zinc-600 transition ${
                      profileMenuOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </button>

                {profileMenuOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Cerrar menú del perfil"
                      onClick={() =>
                        setProfileMenuOpen(
                          false
                        )
                      }
                      className="fixed inset-0 z-40 cursor-default"
                    />

                    <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-2xl">
                      <Link
                        href="/profile"
                        onClick={() =>
                          setProfileMenuOpen(
                            false
                          )
                        }
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                      >
                        <UserRound
                          size={
                            17
                          }
                        />

                        Perfil
                      </Link>

                      {profile?.special_role ===
                        "OWNER" && (
                        <>
                          <Link
                            href="/admin/reports"
                            onClick={() =>
                              setProfileMenuOpen(
                                false
                              )
                            }
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                          >
                            <ShieldCheck
                              size={
                                17
                              }
                            />

                            Reportes
                          </Link>

                          <Link
                            href="/admin/media"
                            onClick={() =>
                              setProfileMenuOpen(
                                false
                              )
                            }
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                          >
                            <ImageIcon
                              size={
                                17
                              }
                            />

                            Editar portadas
                          </Link>
                        </>
                      )}

                      <div className="my-1 border-t border-zinc-800" />

                      <button
                        type="button"
                        onClick={() => {
                          void handleLogout();
                        }}
                        disabled={
                          loggingOut
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-500 transition hover:bg-zinc-900 hover:text-red-400 disabled:opacity-50"
                      >
                        <LogOut
                          size={
                            17
                          }
                        />

                        {loggingOut
                          ? "Cerrando..."
                          : "Cerrar sesión"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <Suspense
                fallback={
                  <div className="h-11 w-[280px] rounded-xl border border-zinc-800 bg-zinc-900/70 2xl:w-[420px]" />
                }
              >
                <GlobalSearch className="w-[280px] 2xl:w-[420px]" />
              </Suspense>

              <NotificationsButton />
            </div>
          </div>
        </div>

        {/* MOBILE / TABLET */}

        <div className="flex h-[70px] items-center justify-between px-4 xl:hidden">
          <Link
            href="/"
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
            className="text-lg font-bold tracking-tight text-fuchsia-400"
          >
            Media Tracker
          </Link>

          <div className="flex items-center gap-2">
            <NotificationsButton
              onNavigate={() =>
                setMobileMenuOpen(
                  false
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (
                    current
                  ) =>
                    !current
                )
              }
              aria-label={
                mobileMenuOpen
                  ? "Cerrar menú"
                  : "Abrir menú"
              }
              aria-expanded={
                mobileMenuOpen
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              {mobileMenuOpen ? (
                <X
                  size={
                    21
                  }
                />
              ) : (
                <Menu
                  size={
                    21
                  }
                />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() =>
                setMobileMenuOpen(
                  false
                )
              }
              className="fixed inset-0 top-[70px] z-40 bg-black/70 xl:hidden"
            />

            <div className="fixed inset-x-0 top-[70px] z-50 max-h-[calc(100dvh-70px)] overflow-y-auto border-b border-zinc-800 bg-zinc-950 p-4 shadow-2xl xl:hidden">
              <Link
                href="/profile"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="flex items-center gap-3 border-b border-zinc-800 pb-4 transition hover:opacity-80"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                  {profile?.avatar_url ? (
                    <Image
                      src={
                        profile.avatar_url
                      }
                      alt={
                        displayName
                      }
                      width={
                        96
                      }
                      height={
                        96
                      }
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-semibold text-zinc-500">
                      {getInitial(
                        profile
                      )}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-100">
                    {
                      displayName
                    }
                  </p>

                  {profile?.username && (
                    <p className="truncate text-sm text-zinc-600">
                      @
                      {
                        profile.username
                      }
                    </p>
                  )}

                  {profile?.special_role ===
                    "OWNER" && (
                    <p className="mt-0.5 text-[11px] font-medium text-fuchsia-400">
                      Owner
                    </p>
                  )}

                  {profile?.special_role ===
                    "BETA_TESTER" && (
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      Beta Tester
                    </p>
                  )}
                </div>
              </Link>

              <Suspense
                fallback={
                  <div className="mb-4 mt-4 h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900" />
                }
              >
                <GlobalSearch
                  className="mb-4 mt-4 w-full"
                  onNavigate={() =>
                    setMobileMenuOpen(
                      false
                    )
                  }
                />
              </Suspense>

              <nav className="space-y-1">
                {navigation.map(
                  (
                    item
                  ) => {
                    const active =
                      isNavigationActive(
                        pathname,
                        item.href
                      );

                    return (
                      <Link
                        key={
                          item.href
                        }
                        href={
                          item.href
                        }
                        onClick={() =>
                          setMobileMenuOpen(
                            false
                          )
                        }
                        className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                          active
                            ? "bg-fuchsia-500/10 text-fuchsia-300"
                            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                        }`}
                      >
                        {
                          item.label
                        }
                      </Link>
                    );
                  }
                )}

                <Link
                  href="/profile"
                  onClick={() =>
                    setMobileMenuOpen(
                      false
                    )
                  }
                  className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                    pathname ===
                      "/profile"
                      ? "bg-fuchsia-500/10 text-fuchsia-300"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  Perfil
                </Link>

                {profile?.special_role ===
                  "OWNER" && (
                  <>
                    <div className="my-2 border-t border-zinc-800" />

                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                      Administración
                    </p>

                    <Link
                      href="/admin/reports"
                      onClick={() =>
                        setMobileMenuOpen(
                          false
                        )
                      }
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        pathname.startsWith(
                          "/admin/reports"
                        )
                          ? "bg-fuchsia-500/10 text-fuchsia-300"
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                      }`}
                    >
                      <ShieldCheck
                        size={
                          17
                        }
                      />

                      Reportes
                    </Link>

                    <Link
                      href="/admin/media"
                      onClick={() =>
                        setMobileMenuOpen(
                          false
                        )
                      }
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        pathname.startsWith(
                          "/admin/media"
                        )
                          ? "bg-fuchsia-500/10 text-fuchsia-300"
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                      }`}
                    >
                      <ImageIcon
                        size={
                          17
                        }
                      />

                      Editar portadas
                    </Link>
                  </>
                )}
              </nav>

              <div className="mt-4 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    void handleLogout();
                  }}
                  disabled={
                    loggingOut
                  }
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-500 transition hover:bg-zinc-900 hover:text-red-400 disabled:opacity-50"
                >
                  <LogOut
                    size={
                      17
                    }
                  />

                  {loggingOut
                    ? "Cerrando..."
                    : "Cerrar sesión"}
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      <main
        className={
          isFlushRoute
            ? "min-w-0 p-0"
            : "min-w-0 p-4 sm:p-6 lg:p-8"
        }
      >
        {
          children
        }
      </main>

      <BugReportButton />

      <InstallAppPrompt />
    </div>
  );
}