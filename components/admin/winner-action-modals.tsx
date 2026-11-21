/**
 * Winner Action Modals
 * 
 * Forms for REDEEM and FULFIL actions on winners (CASH and ITEM types)
 * Supports multipart form data with file uploads (proofs)
 */

"use client";
import { useState, useRef, useEffect } from "react";
import { X, Upload, FileIcon, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { redeemWinner, fulfilWinner } from "@/lib/api/admin-winners";
import { useSubmitForApproval } from "@/hooks/use-submit-for-approval";
import { SubmittedForApproval } from "@/components/admin/submitted-for-approval";
import { ErrorBanner } from "@/components/admin/error-banner";

// ============================================================================
// Single File Upload Component
// ============================================================================

interface SingleFileUpload {
  file: File | null;
  preview?: string;
}

interface SingleFileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  required?: boolean;
  label: string;
}

function SingleFileUpload({ file, onFileChange, accept = "image/jpeg,image/png,image/webp,application/pdf", required = false, label }: SingleFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Create preview for images
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onFileChange(droppedFiles[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold block">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      
      {!file ? (
        <>
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
              transition-colors
              ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
            `}
          >
            <Upload size={24} className="mx-auto text-muted-foreground mb-1.5" />
            <p className="text-[13px] font-medium mb-0.5">
              Drop file or click to browse
            </p>
            <p className="text-[10px] text-muted-foreground">
              Images and PDFs up to 5MB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
            required={required}
          />
        </>
      ) : (
        /* File Preview */
        <div className="flex items-start gap-2.5 p-2.5 bg-secondary/50 rounded-lg">
          {/* Preview/Icon */}
          <div className="w-10 h-10 rounded bg-background flex items-center justify-center shrink-0 overflow-hidden">
            {preview ? (
              <img src={preview} alt={file.name} className="w-full h-full object-cover" />
            ) : (
              <FileIcon size={18} className="text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-colors shrink-0"
            aria-label="Remove file"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Redeem CASH Modal
// ============================================================================

interface RedeemCashModalProps {
  open: boolean;
  onClose: () => void;
  winnerId: string;
  winnerName: string;
  onSuccess?: () => void;
}

export function RedeemCashModal({ open, onClose, winnerId, winnerName, onSuccess }: RedeemCashModalProps) {
  const { loading, error, pendingApproval, changeRequestId, submit, reset } = useSubmitForApproval({
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
  });
  
  const [file, setFile] = useState<File | null>(null);

  // Form fields
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!accountNumber || !bankCode || !bankName || !accountName) {
      return;
    }

    if (!file) {
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append("accountNumber", accountNumber);
    formData.append("bankCode", bankCode);
    formData.append("bankName", bankName);
    formData.append("accountName", accountName);
    if (note) formData.append("note", note);
    formData.append("file", file, file.name);

    await submit(() => redeemWinner(winnerId, formData));
  };

  const handleClose = () => {
    setFile(null);
    setAccountNumber("");
    setBankCode("");
    setBankName("");
    setAccountName("");
    setNote("");
    reset();
    onClose();
  };

  const proofKinds = [
    { value: "ACCOUNT_ENQUIRY", label: "Account Enquiry" },
    { value: "ID_VERIFICATION", label: "ID Verification" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <Modal open={open} onClose={handleClose} title="Record bank details">
      {pendingApproval && changeRequestId ? (
        <SubmittedForApproval
          changeRequestId={changeRequestId}
          onDone={handleClose}
        />
      ) : (
        <>
          <p className="text-[11px] text-muted-foreground mb-3">
            This goes to a checker for approval. No money is sent from this app.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
        {/* Winner Info */}
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-[11px] text-muted-foreground mb-0.5">Winner</p>
          <p className="text-[13px] font-medium">{winnerName}</p>
        </div>

        {/* Bank Details */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold">Bank Details</h3>
          
          <div>
            <label className="text-[11px] font-medium block mb-1">
              Account Number <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="0123456789"
              required
              maxLength={10}
              className="h-8 text-[13px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium block mb-1">
              Bank Code <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              placeholder="058 (GTBank), 057 (Zenith), etc."
              required
              className="h-8 text-[13px]"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">3-digit CBN bank code</p>
          </div>

          <div>
            <label className="text-[11px] font-medium block mb-1">
              Bank Name <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Guaranty Trust Bank"
              required
              className="h-8 text-[13px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium block mb-1">
              Account Name <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="John Doe"
              required
              className="h-8 text-[13px]"
            />
          </div>
        </div>

        {/* File Upload */}
        <SingleFileUpload
          file={file}
          onFileChange={setFile}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required={true}
          label="Account-name check screenshot"
        />

        {/* Note */}
        <div>
          <label className="text-[11px] font-medium block mb-1">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Additional information..."
            rows={2}
            className="w-full px-2.5 py-2 text-[13px] rounded-lg border border-border bg-background placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} />}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" onClick={handleClose} size="sm" className="flex-1" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="flex-1" disabled={loading}>
            {loading ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          This will create a change request for checker approval
        </p>
      </form>
        </>
      )}
    </Modal>
  );
}

// ============================================================================
// Redeem ITEM Modal
// ============================================================================

interface RedeemItemModalProps {
  open: boolean;
  onClose: () => void;
  winnerId: string;
  winnerName: string;
  onSuccess?: () => void;
}

export function RedeemItemModal({ open, onClose, winnerId, winnerName, onSuccess }: RedeemItemModalProps) {
  const { loading, error, pendingApproval, changeRequestId, submit, reset } = useSubmitForApproval({
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
  });
  
  const [file, setFile] = useState<File | null>(null);

  // Form fields
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!deliveryAddress || !contactPhone) {
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append("deliveryAddress", deliveryAddress);
    formData.append("contactPhone", contactPhone);
    if (note) formData.append("note", note);
    if (file) formData.append("file", file, file.name);

    await submit(() => redeemWinner(winnerId, formData));
  };

  const handleClose = () => {
    setFile(null);
    setDeliveryAddress("");
    setContactPhone("");
    setNote("");
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Record delivery details">
      {pendingApproval && changeRequestId ? (
        <SubmittedForApproval
          changeRequestId={changeRequestId}
          onDone={handleClose}
        />
      ) : (
        <>
          <p className="text-[11px] text-muted-foreground mb-3">
            This goes to a checker for approval. No money is sent from this app.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
        {/* Winner Info */}
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-[11px] text-muted-foreground mb-0.5">Winner</p>
          <p className="text-[13px] font-medium">{winnerName}</p>
        </div>

        {/* Delivery Details */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold">Delivery Details</h3>
          
          <div>
            <label className="text-[11px] font-medium block mb-1">
              Delivery Address <span className="text-destructive">*</span>
            </label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Full delivery address..."
              rows={2}
              required
              className="w-full px-2.5 py-2 text-[13px] rounded-lg border border-border bg-background resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium block mb-1">
              Contact Phone <span className="text-destructive">*</span>
            </label>
            <Input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              required
              className="h-8 text-[13px]"
            />
          </div>
        </div>

        {/* File Upload */}
        <SingleFileUpload
          file={file}
          onFileChange={setFile}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required={false}
          label="Supporting file (optional)"
        />

        {/* Note */}
        <div>
          <label className="text-[11px] font-medium block mb-1">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Additional information..."
            rows={2}
            className="w-full px-2.5 py-2 text-[13px] rounded-lg border border-border bg-background placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} />}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" onClick={handleClose} size="sm" className="flex-1" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="flex-1" disabled={loading}>
            {loading ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          This will create a change request for checker approval
        </p>
      </form>
        </>
      )}
    </Modal>
  );
}

// ============================================================================
// Fulfil CASH Modal
// ============================================================================

interface FulfilCashModalProps {
  open: boolean;
  onClose: () => void;
  winnerId: string;
  winnerName: string;
  onSuccess?: () => void;
  redeemDate?: string | null; // ISO UTC datetime from redemption.redeemedAt
}

export function FulfilCashModal({ open, onClose, winnerId, winnerName, onSuccess, redeemDate }: FulfilCashModalProps) {
  const { loading, error, pendingApproval, changeRequestId, submit, reset } = useSubmitForApproval({
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Form fields
  const [payoutReference, setPayoutReference] = useState("");
  const [fulfilledOn, setFulfilledOn] = useState("");
  const [note, setNote] = useState("");

  // Get today and redeemDate in Africa/Lagos timezone (date part only)
  const getTodayLagos = () => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }); // YYYY-MM-DD
  };

  const getRedeemDateLagos = () => {
    if (!redeemDate) return null;
    try {
      const date = new Date(redeemDate);
      return date.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }); // YYYY-MM-DD
    } catch {
      return null;
    }
  };

  // Validate fulfilled date
  const validateFulfilledDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    const today = getTodayLagos();
    const redeemDateStr = getRedeemDateLagos();
    
    if (dateStr > today) {
      return "Date cannot be in the future";
    }
    
    if (redeemDateStr && dateStr < redeemDateStr) {
      return `Date cannot be earlier than the redeem date (${redeemDateStr})`;
    }
    
    return null;
  };

  // Handle fulfilled date change
  const handleFulfilledOnChange = (value: string) => {
    setFulfilledOn(value);
    setDateError(validateFulfilledDate(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!payoutReference || !fulfilledOn) {
      return;
    }

    // Check date validation
    const dateValidationError = validateFulfilledDate(fulfilledOn);
    if (dateValidationError) {
      setDateError(dateValidationError);
      return;
    }

    if (!file) {
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append("payoutReference", payoutReference);
    formData.append("fulfilledOn", fulfilledOn); // Plain date YYYY-MM-DD
    if (note) formData.append("note", note);
    formData.append("file", file, file.name);

    await submit(() => fulfilWinner(winnerId, formData));
  };

  const handleClose = () => {
    setFile(null);
    setPayoutReference("");
    setFulfilledOn("");
    setNote("");
    reset();
    setDateError(null);
    onClose();
  };

  const proofKinds = [
    { value: "TRANSFER_RECEIPT", label: "Transfer Receipt" },
    { value: "PAYMENT_CONFIRMATION", label: "Payment Confirmation" },
    { value: "OTHER", label: "Other" },
  ];

  // Set today's date as default
  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal open={open} onClose={handleClose} title="Record payout">
      {pendingApproval && changeRequestId ? (
        <SubmittedForApproval
          changeRequestId={changeRequestId}
          onDone={handleClose}
        />
      ) : (
        <>
          <p className="text-[11px] text-muted-foreground mb-3">
            This goes to a checker for approval. No money is sent from this app.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
        {/* Winner Info */}
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-[11px] text-muted-foreground mb-0.5">Winner</p>
          <p className="text-[13px] font-medium">{winnerName}</p>
        </div>

        {/* Payout Details */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold">Payout Details</h3>
          
          <div>
            <label className="text-[11px] font-medium block mb-1">
              Payout Reference <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={payoutReference}
              onChange={(e) => setPayoutReference(e.target.value)}
              placeholder="Transaction reference or receipt number"
              required
              className="h-8 text-[13px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium block mb-1">
              Fulfilled On <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={fulfilledOn}
              onChange={(e) => handleFulfilledOnChange(e.target.value)}
              max={getTodayLagos()}
              min={getRedeemDateLagos() || undefined}
              required
              className="h-8 text-[13px]"
            />
            {dateError ? (
              <p className="text-[10px] text-destructive mt-0.5">{dateError}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-0.5">Date the payout was made</p>
            )}
          </div>
        </div>

        {/* File Upload */}
        <SingleFileUpload
          file={file}
          onFileChange={setFile}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required={true}
          label="Transfer receipt"
        />

        {/* Note */}
        <div>
          <label className="text-[11px] font-medium block mb-1">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Additional information..."
            rows={2}
            className="w-full px-2.5 py-2 text-[13px] rounded-lg border border-border bg-background placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} />}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" onClick={handleClose} size="sm" className="flex-1" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="flex-1" disabled={loading}>
            {loading ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          This will create a change request for checker approval
        </p>
      </form>
        </>
      )}
    </Modal>
  );
}

// ============================================================================
// Fulfil ITEM Modal
// ============================================================================

interface FulfilItemModalProps {
  open: boolean;
  onClose: () => void;
  winnerId: string;
  winnerName: string;
  onSuccess?: () => void;
  redeemDate?: string | null; // ISO UTC datetime from redemption.redeemedAt
}

export function FulfilItemModal({ open, onClose, winnerId, winnerName, onSuccess, redeemDate }: FulfilItemModalProps) {
  const { loading, error, pendingApproval, changeRequestId, submit, reset } = useSubmitForApproval({
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Form fields
  const [fulfilledOn, setFulfilledOn] = useState("");
  const [note, setNote] = useState("");

  // Get today and redeemDate in Africa/Lagos timezone (date part only)
  const getTodayLagos = () => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }); // YYYY-MM-DD
  };

  const getRedeemDateLagos = () => {
    if (!redeemDate) return null;
    try {
      const date = new Date(redeemDate);
      return date.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }); // YYYY-MM-DD
    } catch {
      return null;
    }
  };

  // Validate fulfilled date
  const validateFulfilledDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    const today = getTodayLagos();
    const redeemDateStr = getRedeemDateLagos();
    
    if (dateStr > today) {
      return "Date cannot be in the future";
    }
    
    if (redeemDateStr && dateStr < redeemDateStr) {
      return `Date cannot be earlier than the redeem date (${redeemDateStr})`;
    }
    
    return null;
  };

  // Handle fulfilled date change
  const handleFulfilledOnChange = (value: string) => {
    setFulfilledOn(value);
    setDateError(validateFulfilledDate(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fulfilledOn) {
      return;
    }

    // Check date validation
    const dateValidationError = validateFulfilledDate(fulfilledOn);
    if (dateValidationError) {
      setDateError(dateValidationError);
      return;
    }

    if (!file) {
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append("fulfilledOn", fulfilledOn); // Plain date YYYY-MM-DD
    if (note) formData.append("note", note);
    formData.append("file", file, file.name);

    await submit(() => fulfilWinner(winnerId, formData));
  };

  const handleClose = () => {
    setFile(null);
    setFulfilledOn("");
    setNote("");
    reset();
    setDateError(null);
    onClose();
  };

  const proofKinds = [
    { value: "COLLECTION_PHOTO", label: "Collection Photo" },
    { value: "HANDOVER_PHOTO", label: "Handover Photo" },
    { value: "DELIVERY_PROOF", label: "Delivery Proof" },
    { value: "OTHER", label: "Other" },
  ];

  // Set today's date as default and max
  const today = getTodayLagos();
  const minDate = getRedeemDateLagos();

  return (
    <Modal open={open} onClose={handleClose} title="Record handover">
      {pendingApproval && changeRequestId ? (
        <SubmittedForApproval
          changeRequestId={changeRequestId}
          onDone={handleClose}
        />
      ) : (
        <>
          <p className="text-[11px] text-muted-foreground mb-3">
            This goes to a checker for approval. No money is sent from this app.
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
        {/* Winner Info */}
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <p className="text-[11px] text-muted-foreground mb-0.5">Winner</p>
          <p className="text-[13px] font-medium">{winnerName}</p>
        </div>

        {/* Handover Details */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold">Handover Details</h3>
          
          <div>
            <label className="text-[11px] font-medium block mb-1">
              Fulfilled On <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={fulfilledOn}
              onChange={(e) => handleFulfilledOnChange(e.target.value)}
              max={getTodayLagos()}
              min={getRedeemDateLagos() || undefined}
              required
              className="h-8 text-[13px]"
            />
            {dateError ? (
              <p className="text-[10px] text-destructive mt-0.5">{dateError}</p>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-0.5">Date the item was handed over</p>
            )}
          </div>
        </div>

        {/* File Upload */}
        <SingleFileUpload
          file={file}
          onFileChange={setFile}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required={true}
          label="Collection photo or delivery proof"
        />

        {/* Note */}
        <div>
          <label className="text-[11px] font-medium block mb-1">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Additional information..."
            rows={2}
            className="w-full px-2.5 py-2 text-[13px] rounded-lg border border-border bg-background placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} />}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" onClick={handleClose} size="sm" className="flex-1" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="flex-1" disabled={loading}>
            {loading ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          This will create a change request for checker approval
        </p>
      </form>
        </>
      )}
    </Modal>
  );
}

