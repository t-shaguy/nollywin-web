"use client";
import Link from "next/link";
import { Monitor } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export function Navbar() {
  const { token, user } = useAuthStore();
  const isLoggedIn = token && token !== "guest-session-token";
  const isAdmin = user?.role === "ADMIN";

  return (
    <nav className="flex items-center justify-between px-8 py-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-brand-gradient h-9 w-9 rounded-lg flex items-center justify-center">
          <Monitor size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-brand-gradient font-bold text-xl">NollyWin</span>
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {isLoggedIn && user ? (
          <>
            {/* User avatar/initials linking to home */}
            <Link 
              href="/home"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              title={`${user.firstName} ${user.lastName}`}
            >
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-9 w-9 rounded-full object-cover border-2 border-primary/30"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold border-2 border-primary/30">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
              )}
            </Link>
            {/* Show admin login only if user is admin */}
            {isAdmin && (
              <Link href="/admin/login" className="hover:text-primary transition-colors">
                Admin Dashboard
              </Link>
            )}
          </>
        ) : (
          <>
            {/* Not logged in - show login and admin links */}
            <Link 
              href="/auth" 
              className="bg-primary/10 hover:bg-primary/20 text-primary px-5 py-2.5 rounded-xl font-medium transition-colors border border-primary/30"
            >
              Login / Sign Up
            </Link>
            <Link href="/admin/login" className="hover:text-primary transition-colors">
              Admin Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}