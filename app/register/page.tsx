import { RegisterForm } from "../features/auth/presentation/register-form";
import { BackButton } from "@/components/ui/back-button";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8">
        <BackButton />
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground mt-6">
  Already have an account?{" "}
  <Link href="/login" className="text-primary font-medium hover:underline">
    Log in
  </Link>
</p>
      </div>
    </main>
  );
}