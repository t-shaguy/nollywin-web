import { Suspense } from "react";
import { ResetPasswordForm } from "../features/auth/presentation/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Set New Password</h1>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}