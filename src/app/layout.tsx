import type { Metadata } from "next";
import "./globals.css";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Media Tracker",
  description: "Biblioteca personal de juegos, películas y series",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-zinc-950 text-zinc-100">
        <Sidebar />

        <div className="ml-64 min-h-screen">
          <Header />

          <main className="p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}