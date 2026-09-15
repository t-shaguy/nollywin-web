"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground mb-4"
      aria-label="Go back"
    >
      <ArrowLeft size={18} />
    </button>
  );
}
