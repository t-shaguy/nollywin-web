"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { simulateRequest } from "@/lib/api/simulate";
import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordStrength } from "@/components/ui/password-strength";
import { OtpInput } from "@/components/ui/otp-input";
import { useCountdown } from "@/hooks/use-countdown";

type AuthMode = "login" | "signup";
type AuthMethod = "phone" | "email";
type FlowStep = "form" | "otp";

// Validation schemas for each combination
const loginPhoneSchema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
});

const loginEmailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupPhoneSchema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
});

const signupEmailSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginPhoneInput = z.infer<typeof loginPhoneSchema>;
type LoginEmailInput = z.infer<typeof loginEmailSchema>;
type SignupPhoneInput = z.infer<typeof signupPhoneSchema>;
type SignupEmailInput = z.infer<typeof signupEmailSchema>;

type FormData = LoginPhoneInput | LoginEmailInput | SignupPhoneInput | SignupEmailInput;

export function UnifiedAuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [step, setStep] = useState<FlowStep>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(4).fill(""));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const { seconds, isActive, reset: resetCountdown } = useCountdown(60);

  // Dynamically select schema based on mode + method
  const getSchema = () => {
    if (mode === "login" && method === "phone") return loginPhoneSchema;
    if (mode === "login" && method === "email") return loginEmailSchema;
    if (mode === "signup" && method === "phone") return signupPhoneSchema;
    return signupEmailSchema;
  };

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(getSchema()) as any,
    mode: "onChange",
  });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset: resetForm } = form;
  const passwordValue = watch("password") || "";

  // Reset form when mode or method changes
  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setStep("form");
    resetForm();
    setServerError(null);
  };

  const handleMethodChange = (newMethod: AuthMethod) => {
    setMethod(newMethod);
    setStep("form");
    resetForm();
    setServerError(null);
  };

  const onSubmit = async (data: Record<string, string>) => {
    setServerError(null);
    try {
      if (mode === "login") {
        // Login flow
        if (method === "phone") {
          // Login + Phone → OTP required
          const { phone } = data as LoginPhoneInput;
          setPhoneNumber(phone);
          await simulateRequest({ ok: true }, 800);
          setStep("otp");
          resetCountdown();
        } else {
          // Login + Email → Direct to /home
          const { email } = data as LoginEmailInput;
          const res = await simulateRequest({ token: "dev-session-token", user: { email, fullName: "John Doe" } }, 1200);
          setSession(res.token, res.user);
          router.push("/home");
        }
      } else {
        // Signup flow
        if (method === "phone") {
          // Signup + Phone → OTP required
          const { phone } = data as SignupPhoneInput;
          setPhoneNumber(phone);
          await simulateRequest({ ok: true }, 800);
          setStep("otp");
          resetCountdown();
        } else {
          // Signup + Email → Direct to /home (no OTP)
          const { email, fullName } = data as SignupEmailInput;
          const res = await simulateRequest({ token: "dev-session-token", user: { email, fullName } }, 1200);
          setSession(res.token, res.user);
          router.push("/home");
        }
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  };

  const handleOtpVerify = async () => {
    const code = otpDigits.join("");
    if (code.length < 4) {
      setOtpError("Enter all 4 digits");
      return;
    }
    setOtpError(null);
    setIsVerifying(true);
    try {
      await simulateRequest({ ok: true }, 1000);
      const last4 = phoneNumber.slice(-4);
      const userName = mode === "signup" ? `Player ${last4}` : "John Doe";
      const res = await simulateRequest({
        token: "dev-session-token",
        user: { email: `phone-${phoneNumber}@nollywin.local`, fullName: userName },
      }, 500);
      setSession(res.token, res.user);
      router.push("/home");
    } catch {
      setOtpError("That code didn't work. Check it and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpResend = async () => {
    resetCountdown();
    try {
      await simulateRequest({ ok: true }, 800);
    } catch {
      setOtpError("Couldn't resend the code. Try again shortly.");
    }
  };

  const handleBackToForm = () => {
    setStep("form");
    setOtpDigits(Array(4).fill(""));
    setOtpError(null);
  };

  const handleBackToLanding = () => {
    router.push("/");
  };

  const handleContinueAsGuest = () => {
    const guestUser = {
      email: "guest@nollywin.local",
      fullName: "Guest User"
    };
    setSession("guest-session-token", guestUser);
    router.push("/home");
  };

  // OTP Step
  if (step === "otp") {
    return (
      <div className="bg-black rounded-2xl px-10 py-10 shadow-2xl space-y-6 border border-white/[0.08] max-w-lg mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBackToForm}
          className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Logo + Brand */}
        <div className="flex items-center justify-center gap-2.5 py-2">
          <div className="bg-brand-gradient h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
              <rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-brand-gradient">NollyWin</h1>
        </div>

        <div className="text-center space-y-2 pt-2">
          <h2 className="text-2xl font-semibold text-white">Verify your number</h2>
          <p className="text-sm text-white/50">
            We sent a 4-digit code to <span className="text-white font-medium">{phoneNumber}</span>
          </p>
        </div>

        <OtpInput value={otpDigits} onChange={setOtpDigits} length={4} />

        {otpError && <p className="text-destructive text-xs text-center">{otpError}</p>}

        <Button 
          onClick={handleOtpVerify} 
          disabled={isVerifying} 
          className="w-full justify-center text-base py-3 font-semibold rounded-lg"
        >
          {isVerifying ? "Verifying..." : "Verify & Continue"}
        </Button>

        <p className="text-center text-sm text-white/50">
          {isActive ? (
            `Resend code in ${seconds}s`
          ) : (
            <>
              Didn&apos;t get it?{" "}
              <button onClick={handleOtpResend} className="text-primary font-medium hover:underline">
                Resend OTP
              </button>
            </>
          )}
        </p>
      </div>
    );
  }

  // Form Step
  return (
    <div className="bg-black rounded-3xl px-8 py-8 shadow-2xl space-y-5 border border-white/[0.08] max-w-md mx-auto">
      {/* Back Button */}
      <button
        onClick={handleBackToLanding}
        className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
        aria-label="Go back"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      {/* Logo + Brand */}
      <div className="flex items-center justify-center gap-2.5 py-1">
        <div className="bg-brand-gradient h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
            <rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-brand-gradient">NollyWin</h1>
      </div>

      {/* Mode Toggle (Login / Sign Up) - Segmented control like a switch */}
      <div className="bg-white/5 p-1 rounded-lg border border-white/10 flex gap-1 pt-1">
        <button
          type="button"
          onClick={() => handleModeChange("login")}
          className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
            mode === "login"
              ? "bg-auth-accent text-white"
              : "bg-transparent text-white/40 hover:text-white/60"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("signup")}
          className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all ${
            mode === "signup"
              ? "bg-auth-accent text-white"
              : "bg-transparent text-white/40 hover:text-white/60"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Method Toggle (Phone / Email) */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => handleMethodChange("phone")}
          className={`flex-1 py-2.5 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
            method === "phone"
              ? "border border-auth-accent bg-[#2A0814] text-auth-accent"
              : "border border-white/20 text-white/50 hover:text-white/70 hover:border-white/30"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Phone
        </button>
        <button
          type="button"
          onClick={() => handleMethodChange("email")}
          className={`flex-1 py-2.5 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
            method === "email"
              ? "border border-auth-accent bg-[#2A0814] text-auth-accent"
              : "border border-white/20 text-white/50 hover:text-white/70 hover:border-white/30"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2"/>
            <path d="m3 7 9 6 9-6"/>
          </svg>
          Email
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
        {/* Full Name field (only for Signup + Email) */}
        {mode === "signup" && method === "email" && (
          <div>
            <label className="text-xs text-white mb-1.5 block font-medium">Full Name</label>
            <Input 
              placeholder="Adaeze Okonkwo" 
              {...register("fullName")} 
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary text-sm h-11 rounded-lg"
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(errors as any).fullName && <p className="text-destructive text-xs mt-1">{String((errors as any).fullName.message)}</p>}
          </div>
        )}

        {/* Phone field */}
        {method === "phone" && (
          <div>
            <label className="text-xs text-white mb-1.5 block font-medium">Phone Number</label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center px-3 h-11 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-medium whitespace-nowrap">
                NG +234
              </div>
              <Input 
                placeholder="080 1234 5678" 
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary text-sm h-11" 
                {...register("phone")} 
              />
            </div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(errors as any).phone && <p className="text-destructive text-xs mt-1">{String((errors as any).phone.message)}</p>}
          </div>
        )}

        {/* Email field */}
        {method === "email" && (
          <div>
            <label className="text-xs text-white mb-1.5 block font-medium">Email Address</label>
            <Input 
              type="email" 
              placeholder="you@example.com" 
              {...register("email")} 
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary text-sm h-11 rounded-lg"
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(errors as any).email && <p className="text-destructive text-xs mt-1">{String((errors as any).email.message)}</p>}
          </div>
        )}

        {/* Password field (only for Email method) */}
        {method === "email" && (
          <div>
            <label className="text-xs text-white mb-1.5 block font-medium">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary pr-10 text-sm h-11 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode === "signup" && <PasswordStrength password={passwordValue} />}
            {(errors as { password?: { message?: string } }).password && (
              <p className="text-destructive text-xs mt-1">
                {String((errors as { password?: { message?: string } }).password?.message)}
              </p>
            )}
          </div>
        )}

        {serverError && <p className="text-destructive text-xs">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full justify-center text-sm py-2.5 font-semibold mt-5 rounded-lg">
          {isSubmitting
            ? mode === "login" && method === "phone"
              ? "Sending..."
              : mode === "login"
              ? "Logging in..."
              : mode === "signup" && method === "phone"
              ? "Sending..."
              : "Creating account..."
            : mode === "login" && method === "phone"
            ? "Send OTP"
            : mode === "login"
            ? "Login"
            : mode === "signup" && method === "phone"
            ? "Send OTP"
            : "Create Account"}
        </Button>

        {/* Divider with "or" */}
        <div className="relative py-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2.5 bg-black text-white/40">or</span>
          </div>
        </div>

        {/* Continue as Guest */}
        <button
          type="button"
          onClick={handleContinueAsGuest}
          className="w-full py-2.5 rounded-xl font-medium text-sm text-white/70 hover:text-white border border-white/20 hover:border-white/30 transition-all"
        >
          Continue as Guest
        </button>
      </form>
    </div>
  );
}
