"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/login" })}
      className="w-full rounded-full border border-zinc-300 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-700 transition hover:border-accent hover:text-accent sm:w-auto"
    >
      Sair
    </button>
  );
}
