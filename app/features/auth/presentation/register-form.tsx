"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { registerSchema, RegisterInput } from "@/lib/validations/auth";
import { simulateRequest } from "@/lib/api/simulate";
import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordStrength } from "@/components/ui/password-strength";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setSession = useAuthStore((s) => s.setSession);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });
  const passwordValue = watch("password") || "";

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      // TODO: swap back to the real apiClient("/auth/register", ...) call once the backend exists.
      await simulateRequest({ ok: true });
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch {
      setServerError("Couldn't create your account. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-5">
      <div>
        <label className="text-sm text-foreground mb-1.5 block">Full Name</label>
        <Input placeholder="Chidi Okafor" {...register("fullName")} />
        {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName.message}</p>}
      </div>

      <div>
        <label className="text-sm text-foreground mb-1.5 block">Phone Number</label>
        <div className="flex">
          <span className="flex items-center px-4 rounded-l-xl border border-r-0 border-border bg-input text-muted-foreground">+234</span>
          <Input placeholder="8012345678" className="rounded-l-none" {...register("phone")} />
        </div>
        {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="text-sm text-foreground mb-1.5 block">Email Address</label>
        <Input type="email" placeholder="player@example.com" {...register("email")} />
        {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="text-sm text-foreground mb-1.5 block">Password</label>
        <div className="relative">
          <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} />
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <PasswordStrength password={passwordValue} />
        {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
      </div>

      {serverError && <p className="text-destructive text-sm">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full justify-center">
        {isSubmitting ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}