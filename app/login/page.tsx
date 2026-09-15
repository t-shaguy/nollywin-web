import { LoginForm } from "../features/auth/presentation/login-form";
import { BackButton } from "@/components/ui/back-button";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8">
        <BackButton />
        <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground mt-6">
  Don&apos;t have an account?{" "}
  <Link href="/register" className="text-primary font-medium hover:underline">
    Sign up
  </Link>
</p>
      </div>
    </main>
  );
}