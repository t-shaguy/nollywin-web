"use client";
import { useState, useRef } from "react";

export function AvatarUpload({ currentUrl }: { currentUrl?: string }) {
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "https://api.nollywin.example/api/v1";
      await fetch(`${base}/users/avatar`, { method: "POST", body: formData });
    } catch {
      // no real backend yet — silently ignore for now
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative h-24 w-24 rounded-full bg-brand-gradient flex items-center justify-center overflow-hidden"
      >
        {preview ? <img src={preview} alt="Avatar" className="h-full w-full object-cover" /> : <span className="text-white text-2xl font-bold">?</span>}
        {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">Uploading...</div>}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <button type="button" onClick={() => fileRef.current?.click()} className="text-primary text-sm font-medium hover:underline">
        Change photo
      </button>
    </div>
  );
}