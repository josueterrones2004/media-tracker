import type {
  Metadata,
} from "next";

import AppShell from "@/components/AppShell";

import "./globals.css";

export const metadata:
  Metadata = {
  title:
    "Media Tracker",

  description:
    "Tu biblioteca personal de películas, series, libros y juegos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-zinc-950 text-zinc-100">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}