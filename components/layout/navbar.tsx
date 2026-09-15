import Link from "next/link";
import { Monitor } from "lucide-react";

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-6">
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-brand-gradient h-9 w-9 rounded-lg flex items-center justify-center">
          <Monitor size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-brand-gradient font-bold text-xl">NollyWin</span>
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link 
          href="/auth" 
          className="bg-primary/10 hover:bg-primary/20 text-primary px-5 py-2.5 rounded-xl font-medium transition-colors border border-primary/30"
        >
          Login / Sign Up
        </Link>
        <Link href="/admin/login" className="hover:text-primary transition-colors">Admin Login</Link>
      </div>
    </nav>
  );
}