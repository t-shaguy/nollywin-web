import Link from "next/link";
import { ForgotPasswordForm } from "../features/auth/presentation/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Reset Password</h1>
        <p className="text-center text-muted-foreground text-sm mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <ForgotPasswordForm />
        <p className="text-center text-sm text-muted-foreground mt-6">
          Remembered it?{" "}
          <Link href="/auth" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}