"use client";
import { useState } from "react";
import Link from "next/link";
import { Monitor, User, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useAvatarUrl } from "@/hooks/use-avatar-url";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { token, user } = useAuthStore();
  const isLoggedIn = token && token !== "guest-session-token";
  const isAdmin = user?.role === "ADMIN";

  // Convert authenticated avatar URL to displayable blob URL
  const avatarBlobUrl = useAvatarUrl(user?.avatarUrl);

  // Determine display name and initials for avatar
  const displayName = user
    ? (user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.alias || user.phoneNumber || "NollyWin Player")
    : "User";
  
  const hasRealName = user?.firstName && user.lastName;
  const initials = hasRealName 
    ? `${user.firstName!.charAt(0)}${user.lastName!.charAt(0)}`.toUpperCase()
    : null;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="relative">
      <div className="flex items-center justify-between px-4 sm:px-8 py-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 z-50">
          <div className="bg-brand-gradient h-9 w-9 rounded-lg flex items-center justify-center">
            <Monitor size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-brand-gradient font-bold text-xl">NollyWin</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 text-sm">
          {isLoggedIn && user ? (
            <>
              {/* User avatar/initials linking to home */}
              <Link 
                href="/home"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                title={displayName}
              >
                {avatarBlobUrl ? (
                  <img 
                    src={avatarBlobUrl} 
                    alt={displayName}
                    className="h-9 w-9 rounded-full object-cover border-2 border-primary/30"
                  />
                ) : initials ? (
                  <div className="h-9 w-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold border-2 border-primary/30">
                    {initials}
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-full bg-brand-gradient flex items-center justify-center text-white border-2 border-primary/30">
                    <User size={18} strokeWidth={2} />
                  </div>
                )}
              </Link>
              {/* Show admin dashboard only if user is admin */}
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

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden z-50 p-2 hover:bg-secondary/50 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X size={24} className="text-foreground" />
          ) : (
            <Menu size={24} className="text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Dropdown */}
      <div
        className={`fixed top-[80px] right-0 w-64 bg-card border-l border-b border-border shadow-lg z-40 md:hidden transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col p-4 space-y-4">
          {isLoggedIn && user ? (
            <>
              {/* User Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                {avatarBlobUrl ? (
                  <img 
                    src={avatarBlobUrl} 
                    alt={displayName}
                    className="h-12 w-12 rounded-full object-cover border-2 border-primary/30"
                  />
                ) : initials ? (
                  <div className="h-12 w-12 rounded-full bg-brand-gradient flex items-center justify-center text-white text-base font-bold border-2 border-primary/30">
                    {initials}
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-brand-gradient flex items-center justify-center text-white border-2 border-primary/30">
                    <User size={20} strokeWidth={2} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              <Link 
                href="/home"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <User size={18} />
                <span>Dashboard</span>
              </Link>

              {isAdmin && (
                <Link 
                  href="/admin/login"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-lg transition-colors"
                >
                  <Monitor size={18} />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link 
                href="/auth"
                onClick={closeMobileMenu}
                className="bg-primary/10 hover:bg-primary/20 text-primary px-5 py-3 rounded-xl font-medium transition-colors border border-primary/30 text-center"
              >
                Login / Sign Up
              </Link>
              <Link 
                href="/admin/login"
                onClick={closeMobileMenu}
                className="p-3 hover:bg-secondary/50 rounded-lg transition-colors text-center"
              >
                Admin Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}