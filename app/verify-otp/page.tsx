import { Suspense } from "react";
import { OtpForm } from "../features/auth/presentation/otp-form";

export default function VerifyOtpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Verify Your Email</h1>
        <Suspense>
          <OtpForm />
        </Suspense>
      </div>
    </main>
  );
}