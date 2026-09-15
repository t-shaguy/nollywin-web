"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function InviteLinkCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const inviteLink = `https://nollywin.example/join?ref=${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — user can still select/copy the text manually
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
      <p className="text-sm text-muted-foreground">Your referral code</p>
      <p className="text-3xl font-bold text-brand-gradient tracking-widest">{code}</p>
      <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-3">
        <span className="flex-1 text-sm text-muted-foreground truncate text-left">{inviteLink}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-primary text-sm font-medium shrink-0"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
