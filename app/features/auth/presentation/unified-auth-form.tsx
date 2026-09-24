"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordStrength } from "@/components/ui/password-strength";
import { OtpInput } from "@/components/ui/otp-input";
import { useCountdown } from "@/hooks/use-countdown";
import * as authApi from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/client";

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
  rememberMe: z.boolean().optional(),
});

const signupPhoneSchema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
});

const signupEmailSchema = z.object({
  firstName: z.string().min(2, "Enter your first name"),
  lastName: z.string().min(2, "Enter your last name"),
  phoneNumber: z.string().min(10, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email address"),
  alias: z.string().min(2, "Enter your alias/username"),
  referralCode: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginPhoneInput = z.infer<typeof loginPhoneSchema>;
type LoginEmailInput = z.infer<typeof loginEmailSchema>;
type SignupPhoneInput = z.infer<typeof signupPhoneSchema>;
type SignupEmailInput = z.infer<typeof signupEmailSchema>;

type FormData = LoginPhoneInput | LoginEmailInput | SignupPhoneInput | SignupEmailInput;

// Helper: Convert local Nigerian phone format to international format
function toInternationalPhone(input: string): string {
  const digits = input.trim().replace(/\D/g, ""); // strip anything non-numeric
  if (digits.startsWith("234")) return `+${digits}`;      // already has country code
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`; // strip leading 0, add +234
  return `+234${digits}`; // no leading 0, just prepend
}

export function UnifiedAuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [step, setStep] = useState<FlowStep>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [emailForOtp, setEmailForOtp] = useState<string>("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
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

  // WebOTP: auto-fill OTP from SMS where browser supports it
  useEffect(() => {
    if (step !== "otp") return; // Only active on OTP step
    if (!("OTPCredential" in window)) return; // Check browser support
    
    const ac = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal } as CredentialRequestOptions)
      .then((otp: Credential | null) => {
        if (otp && "code" in otp) {
          const code = (otp as { code: string }).code;
          setOtpDigits(code.split(""));
        }
      })
      .catch(() => {}); // Silently fail if not supported
    
    return () => ac.abort();
  }, [step]);

  // Reset form when mode or method changes
  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    // Force email method when switching to signup (signup only supports email)
    if (newMode === "signup" && method === "phone") {
      setMethod("email");
    }
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

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      if (mode === "login") {
        // Login flow
        if (method === "phone") {
          // Login + Phone → Request OTP
          const { phone } = data as LoginPhoneInput;
          await authApi.requestPhoneOtp({ phoneNumber: toInternationalPhone(phone) });
          setPhoneNumber(phone);
          setStep("otp");
          resetCountdown();
        } else {
          // Login + Email → Direct login with password
          const { email, password, rememberMe } = data as LoginEmailInput;
          const res = await authApi.login({ email, password });
          setSession(res.accessToken, res.profile, rememberMe);
          router.push("/home");
        }
      } else {
        // Signup flow
        if (method === "phone") {
          // Signup + Phone → Request OTP
          const { phone } = data as SignupPhoneInput;
          await authApi.requestPhoneOtp({ phoneNumber: toInternationalPhone(phone) });
          setPhoneNumber(phone);
          setStep("otp");
          resetCountdown();
        } else {
          // Signup + Email → Register with full details
          const { firstName, lastName, phoneNumber, email, alias, referralCode, password, confirmPassword } = data as SignupEmailInput;
          await authApi.register({
            firstName,
            lastName,
            phoneNumber: toInternationalPhone(phoneNumber),
            email,
            alias,
            referralCode: referralCode || undefined,
            password,
            confirmPassword,
          });
          // After registration, may need OTP verification - adjust based on actual API response
          // For now, assume registration requires email OTP verification
          setEmailForOtp(email);
          setStep("otp");
          resetCountdown();
        }
      }
    } catch (error) {
      const apiError = error as ApiError;
      setServerError(apiError.message || "Something went wrong. Please try again.");
    }
  };

  const handleOtpVerify = async () => {
    const code = otpDigits.join("");
    if (code.length < 6) {
      setOtpError("Enter all 6 digits");
      return;
    }
    setOtpError(null);
    setIsVerifying(true);
    try {
      if (method === "phone") {
        // Phone OTP verification
        const res = await authApi.verifyPhoneOtp({ phoneNumber: toInternationalPhone(phoneNumber), code });
        if (res.accessToken && res.profile) {
          setSession(res.accessToken, res.profile);
          router.push("/home");
        } else {
          // OTP verified but no token yet - may need additional steps
          setOtpError("Verification successful, but unable to complete login");
        }
      } else {
        // Email OTP verification (for registration)
        const purpose = mode === "signup" ? "REGISTRATION" : "PASSWORD_RESET";
        const res = await authApi.verifyOtp({ email: emailForOtp, code, purpose });
        if (res.accessToken && res.profile) {
          setSession(res.accessToken, res.profile);
          router.push("/home");
        } else {
          // Email verified - redirect to login or show success
          router.push("/auth?verified=true");
        }
      }
    } catch (error) {
      const apiError = error as ApiError;
      setOtpError(apiError.message || "That code didn't work. Check it and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpResend = async () => {
    resetCountdown();
    try {
      if (method === "phone") {
        await authApi.requestPhoneOtp({ phoneNumber: toInternationalPhone(phoneNumber) });
      } else {
        const purpose = mode === "signup" ? "REGISTRATION" : "PASSWORD_RESET";
        await authApi.resendOtp({ email: emailForOtp, purpose });
      }
    } catch (error) {
      const apiError = error as ApiError;
      setOtpError(apiError.message || "Couldn't resend the code. Try again shortly.");
    }
  };

  const handleBackToForm = () => {
    setStep("form");
    setOtpDigits(Array(6).fill(""));
    setOtpError(null);
  };

  const handleBackToLanding = () => {
    router.push("/");
  };

  // Google Sign-In Handler
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsGoogleLoading(true);
    setServerError(null);
    
    try {
      // credentialResponse.credential contains the ID token (JWT) that backend needs
      const idToken = credentialResponse.credential;
      
      if (!idToken) {
        throw new Error("No ID token received from Google");
      }
      
      // Get referral code from form if in signup mode
      // NOTE: Backend Postman docs don't explicitly show referralCode field.
      // Sending it anyway (harmless if ignored). If it causes errors in testing,
      // we'll need to remove it from the request body.
      const referralCode = mode === "signup" ? watch("referralCode") : undefined;
      
      // Send ID token to backend (backend will verify with Google)
      // Backend behavior (confirmed from API docs):
      // - If email matches existing PLAYER account: links Google identity, preserves phone/points/wallet
      // - If no account exists: creates new ACTIVE account (name+email from Google, NO phone)
      // - If email is ADMIN or auth-only account: returns 403
      const res = await authApi.googleAuth({ 
        idToken,
        referralCode 
      });
      
      setSession(res.accessToken, res.profile, true);
      
      // POST-GOOGLE-SIGNUP PHONE NUDGE:
      // If Google account was just created (or linked account has no phone),
      // redirect to /profile to prompt for phone number instead of /home.
      // This is a soft nudge, not a hard gate - user can navigate elsewhere freely.
      if (!res.profile.phoneNumber || res.profile.phoneNumber.trim() === "") {
        router.push("/profile?prompt=phone");
      } else {
        router.push("/home");
      }
    } catch (err) {
      const apiError = err as ApiError;
      
      // TASK 2: Distinct error for 403 (admin account trying to sign in via Google)
      if (apiError.status === 403) {
        setServerError("This email is registered as an admin account and can't sign in here via Google.");
      } else {
        setServerError(apiError.message || "Google Sign-In failed. Please try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setServerError("Google Sign-In was cancelled or failed. Please try again.");
  };

  const handleContinueAsGuest = () => {
    const guestUser = {
      email: "guest@nollywin.local",
      firstName: "Guest",
      lastName: "User",
      phoneNumber: "",
      alias: "Guest",
      role: "PLAYER" as const,
      status: "ACTIVE" as const,
      lastPasswordChangedAt: new Date().toISOString(),
      avatarUrl: null,
      totalPoints: 0,
      gamesPlayed: 0,
      bestScore: 0,
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
          <h2 className="text-2xl font-semibold text-white">
            {method === "phone" ? "Verify your number" : "Verify your email"}
          </h2>
          <p className="text-sm text-white/50">
            We sent a 6-digit code to <span className="text-white font-medium">{method === "phone" ? phoneNumber : emailForOtp}</span>
          </p>
        </div>

        <OtpInput value={otpDigits} onChange={setOtpDigits} length={6} />

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

      {/* Method Toggle (Phone / Email) - Phone only shown for Login */}
      <div className={`flex gap-2.5 ${mode === "signup" ? "justify-center" : ""}`}>
        {mode === "login" && (
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
        )}
        <button
          type="button"
          onClick={() => handleMethodChange("email")}
          className={`${mode === "signup" ? "w-full max-w-xs" : "flex-1"} py-2.5 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
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
        {/* Signup + Email fields */}
        {mode === "signup" && method === "email" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white mb-1.5 block font-medium">First Name</label>
                <Input 
                  placeholder="Adaeze" 
                  {...register("firstName")} 
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary text-sm h-11 rounded-lg"
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(errors as any).firstName && <p className="text-destructive text-xs mt-1">{String((errors as any).firstName.message)}</p>}
              </div>
              <div>
                <label className="text-xs text-white mb-1.5 block font-medium">Last Name</label>
                <Input 
                  placeholder="Okonkwo" 
                  {...register("lastName")} 
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary text-sm h-11 rounded-lg"
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(errors as any).lastName && <p className="text-destructive text-xs mt-1">{String((errors as any).lastName.message)}</p>}
              </div>
            </div>
            <div>
              <label className="text-xs text-white mb-1.5 block font-medium">Phone Number</label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center px-3 h-11 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-medium whitespace-nowrap">
                  NG +234
                </div>
                <Input 
                  placeholder="080 1234 5678" 
                  {...register("phoneNumber")} 
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary text-sm h-11"
                />
              </div>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(errors as any).phoneNumber && <p className="text-destructive text-xs mt-1">{String((errors as any).phoneNumber.message)}</p>}
            </div>
            <div>
              <label className="text-xs text-white mb-1.5 block font-medium">Alias/Username</label>
              <Input 
                placeholder="e.g. nolly_ace" 
                {...register("alias")} 
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary text-sm h-11 rounded-lg"
              />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(errors as any).alias && <p className="text-destructive text-xs mt-1">{String((errors as any).alias.message)}</p>}
            </div>
            <div>
              <label className="text-xs text-white mb-1.5 block font-medium">Referral Code (Optional)</label>
              <Input 
                placeholder="Enter referral code" 
                {...register("referralCode")} 
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary text-sm h-11 rounded-lg"
              />
            </div>
          </>
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
          <>
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
            {/* Confirm Password field (only for Signup + Email) */}
            {mode === "signup" && (
              <div>
                <label className="text-xs text-white mb-1.5 block font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary text-sm h-11 rounded-lg"
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(errors as any).confirmPassword && <p className="text-destructive text-xs mt-1">{String((errors as any).confirmPassword.message)}</p>}
              </div>
            )}
            
            {/* Remember Me & Forgot Password (only for Login + Email) */}
            {mode === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <input 
                    type="checkbox" 
                    {...register("rememberMe")} 
                    className="accent-primary rounded"
                  />
                  Remember me
                </label>
                <a 
                  href="/forgot-password" 
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Forgot password?
                </a>
              </div>
            )}
          </>
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

        {/* Google Sign-In */}
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
          <div className="w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              size="large"
              width="100%"
              text={mode === "signup" ? "signup_with" : "signin_with"}
              shape="rectangular"
            />
          </div>
        ) : (
          <div className="text-xs text-center text-yellow-500/80 bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/30">
            Google Sign-In: GOOGLE_CLIENT_ID not configured. Contact Trada to enable this feature.
          </div>
        )}

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
