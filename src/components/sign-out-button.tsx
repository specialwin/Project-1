"use client";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/signin" })}
      className="uppercase tracking-wider2 text-muted hover:text-ink text-sm"
    >
      ออกจากระบบ
    </button>
  );
}
