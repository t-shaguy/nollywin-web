"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
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
  const [loginMode, setLoginMode] = useState<"password" | "magic">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const setSession = useAdminAuthStore((s) => s.setSession);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
  });

  const { register: registerMagic, handleSubmit: handleSubmitMagic, formState: { errors: errorsMagic, isSubmitting: isSubmittingMagic } } = useForm<MagicLinkInput>({
    resolver: zodResolver(magicLinkSchema),
  });

  const onSubmit = async (data: AdminLoginInput) => {
    setServerError(null);
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

  const onSubmitMagicLink = async (data: MagicLinkInput) => {
    setServerError(null);
    setMagicLinkSent(false);
    try {
      const res = await requestAdminMagicLink(data.email);
      setMagicLinkSent(true);
      setServerError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send magic link";
      setServerError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      {/* Card Container */}
      <div className="w-full max-w-md bg-[#1A1A1A] rounded-3xl p-8 relative">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8 mt-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-gradient-to-r from-[#F40289] to-[#FC0D28] p-2 rounded-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="1" fill="white"/>
                <rect x="3" y="14" width="7" height="7" rx="1" fill="white"/>
                <rect x="14" y="3" width="7" height="7" rx="1" fill="white"/>
                <rect x="14" y="14" width="7" height="7" rx="1" fill="white"/>
              </svg>
            </div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F40289] to-[#FC0D28] font-bold text-xl">
              NollyWin
            </span>
          </div>

          <h1 className="text-white text-2xl font-bold mb-2">Admin Login</h1>
          <p className="text-white/60 text-sm">Access the NollyWin admin dashboard</p>
        </div>

        {/* Login Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setLoginMode("password");
              setServerError(null);
              setMagicLinkSent(false);
            }}
            className={`flex-1 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              loginMode === "password"
                ? "bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white"
                : "bg-[#2A2A2A] text-white/60 hover:text-white"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode("magic");
              setServerError(null);
              setMagicLinkSent(false);
            }}
            className={`flex-1 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              loginMode === "magic"
                ? "bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white"
                : "bg-[#2A2A2A] text-white/60 hover:text-white"
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Form */}
        {loginMode === "password" ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-white/80 text-sm mb-2 block">Email Address</label>
              <Input
                type="email"
                placeholder="admin@nollywin.com"
                {...register("email")}
                className="bg-[#0D0D0D] border-[#2A2A2A] text-white placeholder:text-white/30 h-12 rounded-xl focus:border-[#F40289] focus:ring-[#F40289]"
              />
              {errors.email && <p className="text-[#FC0D28] text-sm mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-white/80 text-sm mb-2 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="bg-[#0D0D0D] border-[#2A2A2A] text-white placeholder:text-white/30 h-12 rounded-xl focus:border-[#F40289] focus:ring-[#F40289] pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-[#FC0D28] text-sm mt-1.5">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="bg-[#FC0D28]/10 border border-[#FC0D28]/30 rounded-xl p-3 text-sm text-[#FC0D28]">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-[#F40289] to-[#FC0D28] hover:opacity-90 text-white font-medium rounded-xl transition-opacity justify-center"
            >
              {isSubmitting ? "Logging in..." : "Login with Password"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitMagic(onSubmitMagicLink)} className="space-y-5">
            <div>
              <label className="text-white/80 text-sm mb-2 block">Email Address</label>
              <Input
                type="email"
                placeholder="admin@nollywin.com"
                {...registerMagic("email")}
                className="bg-[#0D0D0D] border-[#2A2A2A] text-white placeholder:text-white/30 h-12 rounded-xl focus:border-[#F40289] focus:ring-[#F40289]"
              />
              {errorsMagic.email && <p className="text-[#FC0D28] text-sm mt-1.5">{errorsMagic.email.message}</p>}
            </div>

            {magicLinkSent && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-sm text-green-500">
                Magic link sent! Check your email inbox.
              </div>
            )}

            {serverError && (
              <div className="bg-[#FC0D28]/10 border border-[#FC0D28]/30 rounded-xl p-3 text-sm text-[#FC0D28]">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmittingMagic}
              className="w-full h-12 bg-gradient-to-r from-[#F40289] to-[#FC0D28] hover:opacity-90 text-white font-medium rounded-xl transition-opacity justify-center gap-2"
            >
              <Mail size={18} />
              {isSubmittingMagic ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
