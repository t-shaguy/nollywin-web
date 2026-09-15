"use client";
import { MoreHorizontal } from "lucide-react";
import { WhatsAppIcon, XLogoIcon } from "@/components/icons/brand-icons";

export function ShareRow({ code }: { code: string }) {
  const inviteLink = `https://nollywin.example/join?ref=${code}`;
  const message = `Join me on NollyWin and start earning! Use my code ${code}: ${inviteLink}`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const shareX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, "_blank");
  };

  const shareMore = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join NollyWin", text: message, url: inviteLink });
      } catch {
        // User cancelled the native share sheet — nothing to do
      }
    } else {
      // Web Share API unsupported (most desktop browsers) — fall back to clipboard
      try {
        await navigator.clipboard.writeText(message);
      } catch {
        // Clipboard also unavailable — silently ignore, invite link card above still works
      }
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        type="button"
        onClick={shareWhatsApp}
        className="flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl py-3 hover:opacity-90 transition-opacity font-medium text-sm"
      >
        <WhatsAppIcon width={20} height={20} className="text-white" />
        WhatsApp
      </button>
      <button
        type="button"
        onClick={shareX}
        className="flex items-center justify-center gap-2 bg-[#1DA1F2] text-white rounded-xl py-3 hover:opacity-90 transition-opacity font-medium text-sm"
      >
        <XLogoIcon width={20} height={20} className="text-white" />
        X
      </button>
      <button
        type="button"
        onClick={shareMore}
        className="flex items-center justify-center gap-2 bg-gray-600 text-white rounded-xl py-3 hover:opacity-90 transition-opacity font-medium text-sm"
      >
        <MoreHorizontal size={20} className="text-white" />
        More
      </button>
    </div>
  );
}
