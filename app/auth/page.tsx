import { UnifiedAuthForm } from "@/app/features/auth/presentation/unified-auth-form";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <UnifiedAuthForm />
      </div>
    </div>
  );
}
