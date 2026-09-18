"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminLogin } from "@/lib/api/admin";
import { useAdminAuthStore } from "@/store/admin-auth-store";

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const setSession = useAdminAuthStore((s) => s.setSession);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginInput) => {
    setServerError(null);
    try {
      const res = await adminLogin({
        email: data.email,
        password: data.password,
      });
      setSession(res.admin_token, res.admin);
      router.push("/admin/overview");
    } catch (err: any) {
      setServerError(err?.message || "Couldn't log in. Check your details and try again.");
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

        {/* Form */}
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
      </div>
    </div>
  );
}
