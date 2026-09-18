"use client";
import { useState, useRef } from "react";
import * as profileApi from "@/lib/api/profile";
import type { ApiError } from "@/lib/api/client";

export function AvatarUpload({ currentUrl }: { currentUrl?: string }) {
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);
    
    try {
      const res = await profileApi.uploadAvatar(file);
      // Update preview with server URL if provided
      if (res.avatarUrl) {
        setPreview(res.avatarUrl);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to upload avatar");
      // Revert preview on error
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative h-24 w-24 rounded-full bg-brand-gradient flex items-center justify-center overflow-hidden disabled:opacity-50"
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <span className="text-white text-2xl font-bold">?</span>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
            Uploading...
          </div>
        )}
      </button>
      <input 
        ref={fileRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
        disabled={uploading}
      />
      <button 
        type="button" 
        onClick={() => fileRef.current?.click()} 
        disabled={uploading}
        className="text-primary text-sm font-medium hover:underline disabled:opacity-50"
      >
        Change photo
      </button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}