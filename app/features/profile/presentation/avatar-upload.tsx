"use client";
import { useState, useRef, useEffect } from "react";
import { User } from "lucide-react";
import * as profileApi from "@/lib/api/profile";
import type { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

export function AvatarUpload({ currentUrl }: { currentUrl?: string }) {
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((s) => s.user);

  // Calculate initials for fallback
  const hasRealName = user?.firstName && user.lastName;
  const initials = hasRealName 
    ? `${user.firstName!.charAt(0)}${user.lastName!.charAt(0)}`.toUpperCase()
    : null;

  // Fetch existing avatar on mount if currentUrl exists
  useEffect(() => {
    if (!currentUrl) return;
    
    profileApi.getAvatar()
      .then((blob) => {
        setPreview(URL.createObjectURL(blob));
      })
      .catch(() => {
        // 404 means no avatar uploaded yet - that's fine, leave preview empty
      });
  }, [currentUrl]);

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

    // Set immediate preview from local file
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);
    
    try {
      await profileApi.uploadAvatar(file);
      // Upload successful - preview is already set from local file
      // No need to re-fetch; the createObjectURL preview is correct
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to upload avatar");
      // Revert preview on error - try to fetch existing avatar
      if (currentUrl) {
        profileApi.getAvatar()
          .then((blob) => setPreview(URL.createObjectURL(blob)))
          .catch(() => setPreview(undefined));
      } else {
        setPreview(undefined);
      }
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
        className="relative h-20 w-20 rounded-full bg-brand-gradient flex items-center justify-center overflow-hidden disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
        ) : initials ? (
          <span className="text-white text-2xl font-bold">{initials}</span>
        ) : (
          <User size={32} className="text-white" strokeWidth={2} />
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