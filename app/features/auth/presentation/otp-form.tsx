"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OtpInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/use-countdown";
import { simulateRequest } from "@/lib/api/simulate";

export function OtpForm() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const { seconds, isActive, reset } = useCountdown(60);

  // WebOTP: auto-fills the code from SMS where the browser supports it
  useEffect(() => {
    if (!("OTPCredential" in window)) return;
    const ac = new AbortController();
    navigator.credentials
      .get({ otp: { transport: ["sms"] }, signal: ac.signal } as CredentialRequestOptions)
      .then((otp: Credential | null) => {
        if (otp && "code" in otp) setDigits((otp as { code: string }).code.split(""));
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const code = digits.join("");

  const handleVerify = async () => {
    if (code.length < 6) return setError("Enter all 6 digits");
    setError(null);
    setIsVerifying(true);
    try {
      // TODO: swap back to apiClient("/auth/verify-otp", ...) once the backend exists.
      await simulateRequest({ ok: true });
      router.push("/login");
    } catch {
      setError("That code didn't work. Check it and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    reset();
    try {
      // TODO: swap back to apiClient("/auth/resend-otp", ...) once the backend exists.
      await simulateRequest({ ok: true });
    } catch {
      setError("Couldn't resend the code. Try again shortly.");
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <p className="text-center text-muted-foreground text-sm">
        We sent a 6-digit code to <span className="text-foreground">{email || "your email"}</span>
      </p>

      <OtpInput value={digits} onChange={setDigits} />

      {error && <p className="text-destructive text-sm text-center">{error}</p>}

      <Button onClick={handleVerify} disabled={isVerifying} className="w-full justify-center">
        {isVerifying ? "Verifying..." : "Verify"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isActive ? (
          `Resend code in ${seconds}s`
        ) : (
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            Resend code
          </button>
        )}
      </p>
    </div>
  );
}