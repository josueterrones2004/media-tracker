"use client";

import {
  usePathname,
} from "next/navigation";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

interface AppShellProps {
  children:
    React.ReactNode;
}

export default function AppShell({
  children,
}: AppShellProps) {
  const pathname =
    usePathname();

  const isAuthPage =
    pathname === "/auth";

  if (isAuthPage) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      <Sidebar />

      <div className="ml-64 min-h-screen">
        <Header />

        <main className="p-8">
          {children}
        </main>
      </div>
    </>
  );
}