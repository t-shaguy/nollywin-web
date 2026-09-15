"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileDetailsSchema, ProfileDetailsInput } from "@/lib/validations/profile";
import { apiClient } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProfileDetailsForm({ defaultValues }: { defaultValues: ProfileDetailsInput }) {
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileDetailsInput>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues,
  });

  const onSubmit = async (data: ProfileDetailsInput) => {
    setSaved(false);
    try {
      await apiClient("/users/profile", { method: "PUT", body: JSON.stringify(data) });
      setSaved(true);
    } catch {
      // TODO: error toast once backend is live
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="text-sm text-foreground mb-1.5 block">Full Name</label>
        <Input {...register("fullName")} />
        {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName.message}</p>}
      </div>
      <div>
        <label className="text-sm text-foreground mb-1.5 block">Email Address</label>
        <Input type="email" {...register("email")} />
        {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
      </div>
      {saved && <p className="text-primary text-sm">Saved.</p>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
    </form>
  );
}