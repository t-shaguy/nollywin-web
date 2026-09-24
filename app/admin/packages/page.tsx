"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Star, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  getPackages,
  createPackage,
  updatePackage,
  type SubscriptionPackage,
  type CreatePackageRequest,
  type UpdatePackageRequest,
} from "@/lib/api/admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminActionButton } from "@/components/admin/admin-action-button";

interface PackageFormData {
  name: string;
  durationDays: number;
  fee: number; // in Naira (backend expects Naira)
  active: boolean;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PackageFormData>();

  useEffect(() => {
    async function loadPackages() {
      try {
        setLoading(true);
        setError(null);
        const data = await getPackages();
        setPackages(data);
      } catch (err) {
        console.error("Error loading packages:", err);
        setError(err instanceof Error ? err.message : "Failed to load packages");
      } finally {
        setLoading(false);
      }
    }
    
    loadPackages();
  }, []);

  const handleEdit = (pkg: SubscriptionPackage) => {
    setEditingPackage(pkg);
    reset({
      name: pkg.name,
      durationDays: pkg.durationDays,
      fee: pkg.fee, // Already in Naira
      active: pkg.active,
    });
  };

  const onSubmitEdit = async (data: PackageFormData) => {
    if (!editingPackage) return;
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      const updateData: UpdatePackageRequest = {
        name: data.name,
        durationDays: data.durationDays,
        fee: data.fee, // Already in Naira
        active: data.active,
      };
      
      const response = await updatePackage(editingPackage.id, updateData);
      
      // Maker-checker: show success with changeRequestId
      setSuccessMessage(response.message || "Package update submitted for approval");
      setEditingPackage(null);
      reset();
      
      // Note: Do NOT update local state (maker-checker pattern)
    } catch (err) {
      console.error("Error updating package:", err);
      setError(err instanceof Error ? err.message : "Failed to update package");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitAdd = async (data: PackageFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      const createData: CreatePackageRequest = {
        name: data.name,
        durationDays: data.durationDays,
        fee: data.fee, // Already in Naira
        active: data.active,
      };
      
      const response = await createPackage(createData);
      
      // Maker-checker: show success with changeRequestId
      setSuccessMessage(response.message || "Package created and submitted for approval");
      setShowAddModal(false);
      reset();
      
      // Note: Do NOT add to local state (maker-checker pattern)
    } catch (err) {
      console.error("Error creating package:", err);
      setError(err instanceof Error ? err.message : "Failed to create package");
    } finally {
      setSubmitting(false);
    }
  };

  // Format naira (already in Naira from backend)
  const formatNaira = (naira: number) => {
    return `₦${naira.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader 
          title="Packages & Fees" 
          description="Manage subscription plans and pricing" 
        />
        <div className="bg-card border border-border rounded-2xl p-12 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading packages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Packages & Fees" 
        description="Manage subscription plans and pricing"
        action={
          <AdminActionButton icon={Plus} onClick={() => setShowAddModal(true)} size="md">
            Add Package
          </AdminActionButton>
        }
      />

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-600 flex items-start gap-3 text-sm">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{successMessage}</p>
            <p className="text-xs mt-1 opacity-80">Changes will take effect after approval by a checker.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {packages.length === 0 && !loading ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm">
          No packages available yet. Create your first package to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-2xl p-5 sm:p-6 text-center flex flex-col items-center border bg-card border-border"
            >
              <Star size={24} className="text-muted-foreground" />
              <p className="font-bold text-base sm:text-lg mt-3 sm:mt-4">{pkg.name}</p>
              <p className="text-xl sm:text-2xl font-extrabold mt-2">{formatNaira(pkg.fee)}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{pkg.durationDays} days</p>
              
              {/* Read-only attempts info */}
              <div className="mt-3 text-xs text-muted-foreground">
                {pkg.attemptsIncluded} attempts {pkg.attemptsPeriod?.toLowerCase()}
              </div>
              
              <div className={`mt-4 rounded-full px-3 py-1 text-xs font-medium ${
                pkg.active 
                  ? "bg-primary/10 border border-primary/30 text-primary" 
                  : "bg-secondary border border-border text-muted-foreground"
              }`}>
                {pkg.active ? "Active" : "Disabled"}
              </div>

              <div className="flex gap-2 mt-5 sm:mt-6 w-full">
                <AdminActionButton 
                  variant="secondary" 
                  onClick={() => handleEdit(pkg)} 
                  size="sm"
                  className="flex-1"
                >
                  Edit
                </AdminActionButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingPackage && (
        <Modal
          open={!!editingPackage}
          onClose={() => {
            setEditingPackage(null);
            setError(null);
          }}
          title="Edit Package"
        >
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Package Name</label>
              <Input {...register("name", { required: "Name is required" })} placeholder="Weekly Plan" />
              {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Duration (Days)</label>
              <Input 
                type="number" 
                {...register("durationDays", { required: "Duration is required", valueAsNumber: true, min: 1 })} 
                placeholder="7"
              />
              {errors.durationDays && <p className="text-destructive text-sm mt-1">{errors.durationDays.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Fee (₦ Naira)</label>
              <Input 
                type="number" 
                step="0.01"
                {...register("fee", { required: "Fee is required", valueAsNumber: true, min: 0 })} 
                placeholder="500"
              />
              {errors.fee && <p className="text-destructive text-sm mt-1">{errors.fee.message}</p>}
              <p className="text-xs text-muted-foreground mt-1">Enter amount in naira (₦)</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                {...register("active")}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="active" className="text-sm font-medium cursor-pointer">
                Active (visible to users)
              </label>
            </div>
            
            {/* Read-only info */}
            <div className="bg-secondary/30 rounded-xl p-3 text-sm">
              <p className="font-medium mb-1">Read-only fields:</p>
              <p className="text-xs text-muted-foreground">
                • Attempts: {editingPackage.attemptsIncluded} {editingPackage.attemptsPeriod?.toLowerCase()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                These fields cannot be edited from the admin panel.
              </p>
            </div>

            <Button type="submit" variant="gradient" className="w-full justify-center" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </form>
        </Modal>
      )}

      {/* Add Modal */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setError(null);
        }}
        title="Add New Package"
      >
        <form onSubmit={handleSubmit(onSubmitAdd)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Package Name</label>
            <Input {...register("name", { required: "Name is required" })} placeholder="Custom Plan" />
            {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Duration (Days)</label>
            <Input 
              type="number" 
              {...register("durationDays", { required: "Duration is required", valueAsNumber: true, min: 1 })} 
              placeholder="30"
            />
            {errors.durationDays && <p className="text-destructive text-sm mt-1">{errors.durationDays.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Fee (₦ Naira)</label>
            <Input 
              type="number" 
              step="0.01"
              {...register("fee", { required: "Fee is required", valueAsNumber: true, min: 0 })} 
              placeholder="2000"
            />
            {errors.fee && <p className="text-destructive text-sm mt-1">{errors.fee.message}</p>}
            <p className="text-xs text-muted-foreground mt-1">Enter amount in naira (₦)</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active-new"
              {...register("active")}
              defaultChecked
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="active-new" className="text-sm font-medium cursor-pointer">
              Active (visible to users)
            </label>
          </div>
          <Button type="submit" variant="gradient" className="w-full justify-center" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
