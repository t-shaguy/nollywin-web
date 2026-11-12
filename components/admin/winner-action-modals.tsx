/**
 * Winner Action Modals
 * 
 * Forms for REDEEM and FULFIL actions on winners (CASH and ITEM types)
 * Supports multipart form data with file uploads (proofs)
 */

"use client";
import { useState, useRef } from "react";
import { X, Upload, FileIcon, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { redeemWinner, fulfilWinner } from "@/lib/api/admin-winners";

// ============================================================================
// File Upload Component
// ============================================================================

interface FileWithPreview {
  file: File;
  preview?: string;
  kind: string; // Proof kind for this file
}

interface FileUploadProps {
  files: FileWithPreview[];
  onFilesChange: (files: FileWithPreview[]) => void;
  accept?: string;
  maxFiles?: number;
  requiredKinds?: Array<{ value: string; label: string }>;
}

function FileUpload({ files, onFilesChange, accept = "image/*,application/pdf", maxFiles = 5, requiredKinds }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    addFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const remaining = maxFiles - files.length;
    const filesToAdd = newFiles.slice(0, remaining);

    const filesWithPreview = filesToAdd.map((file) => {
      const fileObj: FileWithPreview = {
        file,
        kind: requiredKinds?.[0]?.value || "PROOF", // Default to first kind or generic
      };

      // Create preview for images
      if (file.type.startsWith("image/")) {
        fileObj.preview = URL.createObjectURL(file);
      }

      return fileObj;
    });

    onFilesChange([...files, ...filesWithPreview]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    // Revoke preview URL if exists
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview!);
    }
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  const updateFileKind = (index: number, kind: string) => {
    const newFiles = [...files];
    newFiles[index].kind = kind;
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors
          ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
          ${files.length >= maxFiles ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium mb-1">
          {files.length >= maxFiles ? "Maximum files reached" : "Drop files here or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">
          {accept.includes("image") && "Images and "}PDFs up to 10MB • Max {maxFiles} files
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={files.length >= maxFiles}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileObj, index) => {
            const isImage = fileObj.file.type.startsWith("image/");

            return (
              <div key={index} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                {/* Preview/Icon */}
                <div className="w-12 h-12 rounded bg-background flex items-center justify-center shrink-0 overflow-hidden">
                  {isImage && fileObj.preview ? (
                    <img src={fileObj.preview} alt={fileObj.file.name} className="w-full h-full object-cover" />
                  ) : (
                    <FileIcon size={20} className="text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileObj.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(fileObj.file.size)}</p>
                  
                  {/* Kind Selector */}
                  {requiredKinds && requiredKinds.length > 1 && (
                    <select
                      value={fileObj.kind}
                      onChange={(e) => updateFileKind(index, e.target.value)}
                      className="mt-2 w-full px-2 py-1 text-xs rounded border border-border bg-background"
                    >
                      {requiredKinds.map((kind) => (
                        <option key={kind.value} value={kind.value}>
                          {kind.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-2 hover:bg-destructive/10 hover:text-destructive rounded transition-colors shrink-0"
                  aria-label="Remove file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  // Form fields
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!accountNumber || !bankCode || !accountName) {
      setError("Please fill in all required bank details");
      return;
    }

    if (files.length === 0) {
      setError("Please upload at least one proof (e.g., account enquiry screenshot)");
      return;
    }

    try {
      setSubmitting(true);

      // Build FormData
      const formData = new FormData();
      formData.append("accountNumber", accountNumber);
      formData.append("bankCode", bankCode);
      formData.append("bankName", bankName);
      formData.append("accountName", accountName);
      if (note) formData.append("note", note);

      // Add files with their kinds
      files.forEach((fileObj) => {
        formData.append("proofs", fileObj.file);
        formData.append("proofKinds", fileObj.kind);
      });

      const response = await redeemWinner(winnerId, formData);

      // Success
      alert(`Success! ${response.message}\nChange Request ID: ${response.changeRequestId}`);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("Error redeeming winner:", err);
      
      // Handle 409 conflict
      if (err.status === 409) {
        setError(err.message || "A redeem request is already pending approval for this winner.");
      } else if (err.status === 403) {
        setError("You don't have permission to do this.");
      } else {
        setError(err.message || "Failed to submit redeem request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Cleanup
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setAccountNumber("");
    setBankCode("");
    setBankName("");
    setAccountName("");
    setNote("");
    setError(null);
    onClose();
  };

  const proofKinds = [
    { value: "ACCOUNT_ENQUIRY", label: "Account Enquiry" },
    { value: "ID_VERIFICATION", label: "ID Verification" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <Modal open={open} onClose={handleClose} title="Redeem Prize (CASH)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Winner Info */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Winner</p>
          <p className="text-sm font-medium">{winnerName}</p>
        </div>

        {/* Bank Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Bank Details</h3>
          
          <div>
            <label className="text-xs font-medium block mb-1.5">
              Account Number <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="0123456789"
              required
              maxLength={10}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5">
              Bank Code <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              placeholder="058 (GTBank), 057 (Zenith), etc."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">3-digit CBN bank code</p>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5">Bank Name</label>
            <Input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Guaranty Trust Bank"
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5">
              Account Name <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
        </div>

        {/* Proofs */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Proofs <span className="text-destructive">*</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Upload account enquiry screenshot or ID verification
          </p>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            accept="image/*,application/pdf"
            maxFiles={3}
            requiredKinds={proofKinds}
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-medium block mb-1.5">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Additional information..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          This will create a change request for checker approval
        </p>
      </form>
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  // Form fields
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!deliveryAddress || !contactPhone) {
      setError("Please fill in delivery address and contact phone");
      return;
    }

    if (files.length === 0) {
      setError("Please upload at least one proof (e.g., collection photo, ID verification)");
      return;
    }

    try {
      setSubmitting(true);

      // Build FormData
      const formData = new FormData();
      formData.append("deliveryAddress", deliveryAddress);
      formData.append("contactPhone", contactPhone);
      if (note) formData.append("note", note);

      // Add files with their kinds
      files.forEach((fileObj) => {
        formData.append("proofs", fileObj.file);
        formData.append("proofKinds", fileObj.kind);
      });

      const response = await redeemWinner(winnerId, formData);

      // Success
      alert(`Success! ${response.message}\nChange Request ID: ${response.changeRequestId}`);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("Error redeeming winner:", err);
      
      if (err.status === 409) {
        setError(err.message || "A redeem request is already pending approval for this winner.");
      } else if (err.status === 403) {
        setError("You don't have permission to do this.");
      } else {
        setError(err.message || "Failed to submit redeem request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Cleanup
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setDeliveryAddress("");
    setContactPhone("");
    setNote("");
    setError(null);
    onClose();
  };

  const proofKinds = [
    { value: "COLLECTION_PHOTO", label: "Collection Photo" },
    { value: "ID_VERIFICATION", label: "ID Verification" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <Modal open={open} onClose={handleClose} title="Redeem Prize (ITEM)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Winner Info */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Winner</p>
          <p className="text-sm font-medium">{winnerName}</p>
        </div>

        {/* Delivery Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Delivery Details</h3>
          
          <div>
            <label className="text-xs font-medium block mb-1.5">
              Delivery Address <span className="text-destructive">*</span>
            </label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Full delivery address..."
              rows={3}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5">
              Contact Phone <span className="text-destructive">*</span>
            </label>
            <Input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              required
            />
          </div>
        </div>

        {/* Proofs */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Proofs <span className="text-destructive">*</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Upload collection photo or ID verification
          </p>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            accept="image/*,application/pdf"
            maxFiles={3}
            requiredKinds={proofKinds}
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-medium block mb-1.5">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Additional information..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          This will create a change request for checker approval
        </p>
      </form>
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
}

export function FulfilCashModal({ open, onClose, winnerId, winnerName, onSuccess }: FulfilCashModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  // Form fields
  const [payoutReference, setPayoutReference] = useState("");
  const [fulfilledOn, setFulfilledOn] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!payoutReference || !fulfilledOn) {
      setError("Please fill in payout reference and fulfillment date");
      return;
    }

    if (files.length === 0) {
      setError("Please upload at least one proof (transfer receipt required)");
      return;
    }

    try {
      setSubmitting(true);

      // Build FormData
      const formData = new FormData();
      formData.append("payoutReference", payoutReference);
      formData.append("fulfilledOn", fulfilledOn); // Plain date YYYY-MM-DD
      if (note) formData.append("note", note);

      // Add files with their kinds
      files.forEach((fileObj) => {
        formData.append("proofs", fileObj.file);
        formData.append("proofKinds", fileObj.kind);
      });

      const response = await fulfilWinner(winnerId, formData);

      // Success
      alert(`Success! ${response.message}\nChange Request ID: ${response.changeRequestId}`);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("Error fulfilling winner:", err);
      
      if (err.status === 409) {
        setError(err.message || "A fulfil request is already pending approval for this winner.");
      } else if (err.status === 403) {
        setError("You don't have permission to do this.");
      } else {
        setError(err.message || "Failed to submit fulfil request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Cleanup
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setPayoutReference("");
    setFulfilledOn("");
    setNote("");
    setError(null);
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
    <Modal open={open} onClose={handleClose} title="Fulfil Prize (CASH)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Winner Info */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Winner</p>
          <p className="text-sm font-medium">{winnerName}</p>
        </div>

        {/* Payout Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Payout Details</h3>
          
          <div>
            <label className="text-xs font-medium block mb-1.5">
              Payout Reference <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={payoutReference}
              onChange={(e) => setPayoutReference(e.target.value)}
              placeholder="Transaction reference or receipt number"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5">
              Fulfilled On <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={fulfilledOn}
              onChange={(e) => setFulfilledOn(e.target.value)}
              max={today}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Date the payout was made</p>
          </div>
        </div>

        {/* Proofs */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Proofs <span className="text-destructive">*</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Upload transfer receipt or payment confirmation
          </p>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            accept="image/*,application/pdf"
            maxFiles={3}
            requiredKinds={proofKinds}
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-medium block mb-1.5">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Additional information..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          This will create a change request for checker approval
        </p>
      </form>
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
}

export function FulfilItemModal({ open, onClose, winnerId, winnerName, onSuccess }: FulfilItemModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  // Form fields
  const [fulfilledOn, setFulfilledOn] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fulfilledOn) {
      setError("Please select the handover date");
      return;
    }

    if (files.length === 0) {
      setError("Please upload at least one proof (handover photo required)");
      return;
    }

    try {
      setSubmitting(true);

      // Build FormData
      const formData = new FormData();
      formData.append("fulfilledOn", fulfilledOn); // Plain date YYYY-MM-DD
      if (note) formData.append("note", note);

      // Add files with their kinds
      files.forEach((fileObj) => {
        formData.append("proofs", fileObj.file);
        formData.append("proofKinds", fileObj.kind);
      });

      const response = await fulfilWinner(winnerId, formData);

      // Success
      alert(`Success! ${response.message}\nChange Request ID: ${response.changeRequestId}`);
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("Error fulfilling winner:", err);
      
      if (err.status === 409) {
        setError(err.message || "A fulfil request is already pending approval for this winner.");
      } else if (err.status === 403) {
        setError("You don't have permission to do this.");
      } else {
        setError(err.message || "Failed to submit fulfil request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Cleanup
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setFulfilledOn("");
    setNote("");
    setError(null);
    onClose();
  };

  const proofKinds = [
    { value: "COLLECTION_PHOTO", label: "Collection Photo" },
    { value: "HANDOVER_PHOTO", label: "Handover Photo" },
    { value: "DELIVERY_PROOF", label: "Delivery Proof" },
    { value: "OTHER", label: "Other" },
  ];

  // Set today's date as default
  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal open={open} onClose={handleClose} title="Fulfil Prize (ITEM)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Winner Info */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Winner</p>
          <p className="text-sm font-medium">{winnerName}</p>
        </div>

        {/* Handover Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Handover Details</h3>
          
          <div>
            <label className="text-xs font-medium block mb-1.5">
              Fulfilled On <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              value={fulfilledOn}
              onChange={(e) => setFulfilledOn(e.target.value)}
              max={today}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Date the item was handed over</p>
          </div>
        </div>

        {/* Proofs */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Proofs <span className="text-destructive">*</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Upload handover photo or delivery proof
          </p>
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            accept="image/*,application/pdf"
            maxFiles={3}
            requiredKinds={proofKinds}
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-medium block mb-1.5">Note (Optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Additional information..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          This will create a change request for checker approval
        </p>
      </form>
    </Modal>
  );
}
