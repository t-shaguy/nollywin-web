"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Monitor } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { simulateRequest } from "@/lib/api/simulate";
import { useAdminAuthStore } from "@/store/admin-auth-store";

interface AdminLoginInput {
  email: string;
  password: string;
}

export default function AdminLoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const setSession = useAdminAuthStore((s) => s.setSession);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminLoginInput>();

  const onSubmit = async (data: AdminLoginInput) => {
    setServerError(null);
    try {
      // TODO: swap back to apiClient("/admin/auth/login", ...) once the backend exists
      const res = await simulateRequest({ token: "admin-session-token", admin: { email: data.email } });
      setSession(res.token, res.admin);
      router.push("/admin/overview");
    } catch {
      setServerError("Couldn't log in. Check your details and try again.");
    }
  };

  const handleMagicLink = async () => {
    setServerError(null);
    try {
      // TODO: swap back to apiClient("/admin/auth/magic-link", ...) once the backend exists
      await simulateRequest({ ok: true });
      setServerError(null);
      // In real implementation, would show "Check your email" message
      alert("Magic link sent! Check your email.");
    } catch {
      setServerError("Couldn't send magic link. Try again.");
    }
  };

  return (
    <main className="theme-admin min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-brand-gradient h-10 w-10 rounded-lg flex items-center justify-center">
            <Monitor size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-brand-gradient font-bold text-xl">NollyWin</span>
        </div>

        <h1 className="text-xl font-bold text-center mb-6">Admin Login</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email Address</label>
            <Input 
              type="email" 
              placeholder="admin@nollywin.com" 
              {...register("email", { required: "Email is required" })}
              className="bg-input/50"
            />
            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <Input 
              type="password" 
              placeholder="••••••••" 
              {...register("password", { required: "Password is required" })}
              className="bg-input/50"
            />
            {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-destructive text-sm">{serverError}</p>}

          <Button type="submit" disabled={isSubmitting} variant="gradient" className="w-full justify-center">
            {isSubmitting ? "Logging in..." : "Login with Password"}
          </Button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button variant="outline" onClick={handleMagicLink} className="w-full justify-center">
          Login with Magic Link
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-5">
          <Link href="/" className="hover:text-primary transition-colors">
            Back to Home
          </Link>
        </p>
      </div>
    </main>
  );
}
