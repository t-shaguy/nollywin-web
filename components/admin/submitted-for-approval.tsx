"use client";
import { CheckCircle, Clock, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubmittedForApprovalProps {
  changeRequestId: string;
  message?: string;
  onDone: () => void;
}

export function SubmittedForApproval({
  changeRequestId,
  message,
  onDone,
}: SubmittedForApprovalProps) {
  const [copied, setCopied] = useState(false);

  const shortId = changeRequestId.slice(0, 8);

  const handleCopy = () => {
    navigator.clipboard.writeText(changeRequestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewInApprovals = () => {
    window.open(`/admin/change-requests?cr=${changeRequestId}`, "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
          <Clock size={14} className="text-amber-500" />
        </div>
      </div>

      {/* Heading */}
      <h3 className="text-lg font-semibold text-white mb-2">
        Submitted for approval
      </h3>

      {/* Description */}
      <p className="text-[13px] text-gray-400 mb-1">
        {message || "A checker needs to approve this before it takes effect."}
      </p>

      {/* Change Request ID */}
      <div className="flex items-center gap-2 mt-4 mb-6">
        <span className="text-xs text-gray-500 font-mono">
          CR-{shortId}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            "w-7 h-7 rounded-md border border-[#2a2a2a] flex items-center justify-center",
            "text-gray-400 hover:text-white hover:bg-white/5 transition-all",
            copied && "text-green-500 border-green-500/30"
          )}
          aria-label="Copy full ID"
          title="Copy full change request ID"
        >
          {copied ? (
            <CheckCircle size={14} />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full">
        <Button
          variant="outline"
          size="md"
          onClick={handleViewInApprovals}
          className="flex-1 gap-2"
        >
          <ExternalLink size={14} />
          View in Approvals
        </Button>
        <Button
          variant="gradient"
          size="md"
          onClick={onDone}
          className="flex-1"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
