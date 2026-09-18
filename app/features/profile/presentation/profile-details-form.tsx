"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileDetailsSchema, ProfileDetailsInput } from "@/lib/validations/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as profileApi from "@/lib/api/profile";
import type { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/store/auth-store";

export function ProfileDetailsForm({ defaultValues }: { defaultValues: ProfileDetailsInput }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuthStore((s) => s.setSession);
  const token = useAuthStore((s) => s.token);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileDetailsInput>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues,
  });

  const onSubmit = async (data: ProfileDetailsInput) => {
    setSaved(false);
    setError(null);
    try {
      const res = await profileApi.updateProfile(data);
      setSaved(true);
      // Update local user state with new profile data
      if (token) {
        setSession(token, res.user);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to save changes");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-foreground mb-1.5 block">First Name</label>
          <Input {...register("firstName")} />
          {errors.firstName && <p className="text-destructive text-sm mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="text-sm text-foreground mb-1.5 block">Last Name</label>
          <Input {...register("lastName")} />
          {errors.lastName && <p className="text-destructive text-sm mt-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div>
        <label className="text-sm text-foreground mb-1.5 block">Phone Number</label>
        <Input {...register("phoneNumber")} placeholder="+234 801 234 5678" />
        {errors.phoneNumber && <p className="text-destructive text-sm mt-1">{errors.phoneNumber.message}</p>}
      </div>
      <div>
        <label className="text-sm text-foreground mb-1.5 block">Alias/Username</label>
        <Input {...register("alias")} placeholder="e.g. nolly_ace" />
        {errors.alias && <p className="text-destructive text-sm mt-1">{errors.alias.message}</p>}
      </div>
      {saved && <p className="text-primary text-sm">Profile updated successfully!</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
    </form>
  );
}