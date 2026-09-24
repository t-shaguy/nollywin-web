"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ChangePasswordForm } from "@/app/features/profile/presentation/change-password-form";

export default function ChangePasswordPage() {
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Change Password</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
