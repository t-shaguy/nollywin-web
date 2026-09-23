"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { verifyAdminMagicLink } from "@/lib/api/admin";
import { useAdminAuthStore } from "@/store/admin-auth-store";

function MagicLinkVerifyContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAdminAuthStore((s) => s.setSession);

  useEffect(() => {
    async function verify() {
      const token = searchParams.get("token");
      
      if (!token) {
        setStatus("error");
        setError("No verification token provided");
        return;
      }

      try {
        const res = await verifyAdminMagicLink(token);
        console.log("Magic link verification response:", res);
        
        // Assuming response has accessToken and email fields
        if (res.accessToken && res.email) {
          setSession(res.accessToken, { email: res.email });
          setStatus("success");
          setTimeout(() => {
            router.push("/admin/overview");
          }, 2000);
        } else {
          setStatus("error");
          setError("Invalid response from server");
        }
      } catch (err) {
        console.error("Magic link verification error:", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Verification failed");
      }
    }

    verify();
  }, [searchParams, router, setSession]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#1A1A1A] rounded-3xl p-8 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-[#F40289] to-[#FC0D28] p-3 rounded-xl">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="1" fill="white"/>
              <rect x="3" y="14" width="7" height="7" rx="1" fill="white"/>
              <rect x="14" y="3" width="7" height="7" rx="1" fill="white"/>
              <rect x="14" y="14" width="7" height="7" rx="1" fill="white"/>
            </svg>
          </div>
        </div>

        {status === "loading" && (
          <>
            <Loader2 size={48} className="text-[#F40289] animate-spin mx-auto mb-4" />
            <h1 className="text-white text-2xl font-bold mb-2">Verifying...</h1>
            <p className="text-white/60 text-sm">Please wait while we verify your magic link</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h1 className="text-white text-2xl font-bold mb-2">Verified!</h1>
            <p className="text-white/60 text-sm">Redirecting to admin dashboard...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={48} className="text-[#FC0D28] mx-auto mb-4" />
            <h1 className="text-white text-2xl font-bold mb-2">Verification Failed</h1>
            <p className="text-white/60 text-sm mb-6">{error || "Could not verify magic link"}</p>
            <button
              onClick={() => router.push("/admin/login")}
              className="px-6 py-3 bg-gradient-to-r from-[#F40289] to-[#FC0D28] text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}


export default function MagicLinkVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-[#1A1A1A] rounded-3xl p-8 text-center">
          <Loader2 size={48} className="text-[#F40289] animate-spin mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <MagicLinkVerifyContent />
    </Suspense>
  );
}
