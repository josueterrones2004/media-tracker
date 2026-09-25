"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import Header from "@/components/Header";
import LogoutButton from "@/components/LogoutButton";
import Sidebar from "@/components/Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

const navigation = [
  { href: "/", label: "Inicio" },
  { href: "/games", label: "Juegos" },
  { href: "/movies", label: "Películas" },
  { href: "/series", label: "Series" },
  { href: "/books", label: "Libros" },
  { href: "/social", label: "Social" },
  { href: "/notifications", label: "Notificaciones" },
  { href: "/profile", label: "Perfil" },
];

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/auth") {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      {/* DESKTOP SIDEBAR */}

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* MOBILE NAVIGATION */}

      <div className="relative z-50 lg:hidden">
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="text-lg font-bold text-fuchsia-400"
          >
            Media Tracker
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className="rounded-lg border border-zinc-800 p-2 text-zinc-200 transition hover:bg-zinc-900"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 top-16 z-40 bg-black/70"
            />

            <nav
              id="mobile-navigation"
              aria-label="Navegación principal"
              className="fixed inset-x-0 top-16 z-50 flex max-h-[calc(100dvh-4rem)] flex-col overflow-y-auto border-b border-zinc-800 bg-zinc-950 p-4 shadow-2xl"
            >
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm transition ${
                    pathname === item.href
                      ? "bg-fuchsia-500/10 text-fuchsia-300"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-3 border-t border-zinc-800 pt-3">
                <LogoutButton />
              </div>
            </nav>
          </>
        )}
      </div>

      {/* PAGE CONTENT */}

      <div className="min-h-screen min-w-0 lg:ml-64">
        <Header />

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </>
  );
}