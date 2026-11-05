"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ChangePasswordForm } from "@/app/features/profile/presentation/change-password-form";

export default function ChangePasswordPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-5 md:space-y-6">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={() => router.back()}
          className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold">Change Password</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
