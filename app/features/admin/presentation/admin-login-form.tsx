"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Monitor } from "lucide-react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminLogin } from "@/lib/api/admin";
import { requestAdminMagicLink } from "@/lib/api/admin";
import { useAdminAuthStore } from "@/store/admin-auth-store";

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const magicLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type AdminLoginInput = z.infer<typeof adminLoginSchema>;
type MagicLinkInput = z.infer<typeof magicLinkSchema>;

export function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const router = useRouter();
  const setSession = useAdminAuthStore((s) => s.setSession);

  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginInput) => {
    setServerError(null);
    setMagicLinkSent(false);
    try {
      const res = await adminLogin({
        email: data.email,
        password: data.password,
      });
      // REAL API: accessToken (not admin_token), email (not admin object)
      setSession(res.accessToken, { email: res.email });
      router.push("/admin/overview");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Couldn't log in. Check your details and try again.";
      setServerError(errorMessage);
    }
  };

  const handleMagicLink = async () => {
    const email = getValues("email");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setServerError("Please enter a valid email address first");
      return;
    }

    setServerError(null);
    setMagicLinkSent(false);
    setMagicLinkLoading(true);
    
    try {
      await requestAdminMagicLink(email);
      setMagicLinkSent(true);
      setServerError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send magic link";
      setServerError(errorMessage);
    } finally {
      setMagicLinkLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      {/* Card Container */}
      <div className="w-full max-w-md bg-[#1A1A1A] rounded-3xl p-8 border border-[#2A2A2A]/50">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="text-white/70 hover:text-white transition-colors flex items-center gap-2 text-sm mb-8"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="bg-gradient-to-r from-[#F40289] to-[#FC0D28] p-2.5 rounded-xl">
              <Monitor size={24} strokeWidth={2} className="text-white" />
            </div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F40289] to-[#FC0D28] font-bold text-2xl">
              NollyWin
            </span>
          </div>

          <h1 className="text-white text-3xl font-bold mb-2">Admin Login</h1>
          <p className="text-white/50 text-sm">Access the NollyWin admin dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="text-white text-sm font-medium mb-2.5 block">Email Address</label>
            <Input
              type="email"
              placeholder="admin@nollywin.com"
              {...register("email")}
              className="bg-[#0D0D0D] border-[#2A2A2A] text-white placeholder:text-white/30 h-14 rounded-2xl focus:border-[#F40289] focus:ring-[#F40289] text-base"
            />
            {errors.email && <p className="text-[#FC0D28] text-sm mt-2">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2.5 block">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="bg-[#0D0D0D] border-[#2A2A2A] text-white placeholder:text-white/30 h-14 rounded-2xl focus:border-[#F40289] focus:ring-[#F40289] pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-[#FC0D28] text-sm mt-2">{errors.password.message}</p>}
          </div>

          {magicLinkSent && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 text-sm text-green-400">
              ✓ Magic link sent! Check your email inbox.
            </div>
          )}

          {serverError && (
            <div className="bg-[#FC0D28]/10 border border-[#FC0D28]/30 rounded-2xl p-4 text-sm text-[#FC0D28]">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-gradient-to-r from-[#F40289] to-[#FC0D28] hover:opacity-90 text-white font-semibold rounded-2xl transition-opacity justify-center text-base"
          >
            {isSubmitting ? "Logging in..." : "Login with Password"}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2A2A2A]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1A1A1A] text-white/40">or</span>
            </div>
          </div>

          {/* Magic Link Button */}
          <Button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLinkLoading}
            className="w-full h-14 bg-[#0D0D0D] border-2 border-[#2A2A2A] hover:border-[#F40289] text-white font-semibold rounded-2xl transition-colors justify-center text-base"
          >
            {magicLinkLoading ? "Sending..." : "Login with Magic Link"}
          </Button>
        </form>
      </div>
    </div>
  );
}
