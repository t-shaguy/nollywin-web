/**
 * Hook to convert authenticated avatar API path to displayable blob URL
 * 
 * Backend returns avatarUrl as "/api/v1/users/avatar" which requires auth headers,
 * so we can't use it directly in <img src>. This hook fetches the binary and
 * creates a local object URL for display.
 */

import { useState, useEffect } from "react";
import { getAvatar } from "@/lib/api/profile";

export function useAvatarUrl(avatarUrl: string | null | undefined): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    // If no avatar URL, clear blob
    if (!avatarUrl) {
      setBlobUrl(null);
      return;
    }

    // Fetch avatar binary and create object URL
    let objectUrl: string | null = null;
    
    getAvatar()
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        // 404 or other error - no avatar available
        setBlobUrl(null);
      });

    // Cleanup: revoke object URL when component unmounts or avatarUrl changes
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [avatarUrl]);

  return blobUrl;
}
