"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-destructive text-sm font-medium hover:underline">
        Sign Out
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Sign out?</h2>
            <p className="text-muted-foreground text-sm mb-6">You&apos;ll need to log in again to access your account.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 justify-center">Cancel</Button>
              <Button onClick={() => { logout(); router.push("/login"); }} className="flex-1 justify-center">Sign Out</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}