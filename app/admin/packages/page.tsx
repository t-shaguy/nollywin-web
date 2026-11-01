"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Star, Plus, CheckCircle } from "lucide-react";
import { AdminModal } from "@/components/admin/admin-modal";
import { AdminInput } from "@/components/admin/admin-field";
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
        <div className="bg-card border border-border rounded p-12 flex items-center justify-center">
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
        <div className="bg-green-500/10 border border-green-500/30 rounded p-4 text-green-600 flex items-start gap-3 text-sm">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{successMessage}</p>
            <p className="text-xs mt-1 opacity-80">Changes will take effect after approval by a checker.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      {packages.length === 0 && !loading ? (
        <div className="bg-card border border-border rounded p-12 text-center text-muted-foreground text-sm">
          No packages available yet. Create your first package to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded p-4 text-center flex flex-col items-center border bg-card border-border"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                <Star size={20} className="text-muted-foreground" />
              </div>
              <p className="font-semibold text-sm mt-3">{pkg.name}</p>
              <p className="text-2xl font-bold mt-2 tabular-nums">{formatNaira(pkg.fee)}</p>
              <p className="text-xs text-muted-foreground mt-1">{pkg.durationDays} {pkg.durationDays === 1 ? 'day' : 'days'}</p>
              
              {/* Read-only attempts info */}
              <div className="mt-3 text-xs text-muted-foreground">
                {pkg.attemptsIncluded} attempts {pkg.attemptsPeriod?.toLowerCase()}
              </div>
              
              <div className={`mt-4 rounded px-2.5 py-1 text-xs font-medium ${
                pkg.active 
                  ? "bg-green-500/10 border border-green-500/30 text-green-600" 
                  : "bg-secondary border border-border text-muted-foreground"
              }`}>
                {pkg.active ? "Active" : "Disabled"}
              </div>

              <div className="flex gap-2 mt-4 w-full">
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
        <AdminModal
          open={!!editingPackage}
          onClose={() => {
            setEditingPackage(null);
            setError(null);
          }}
          title="Edit Package"
          description="Update package details. Changes require approval."
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingPackage(null);
                  setError(null);
                }}
                disabled={submitting}
                className="h-8 px-3 text-[13px] font-medium rounded border border-border bg-transparent hover:bg-secondary transition-colors duration-120 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmitEdit)}
                disabled={submitting}
                className="h-8 px-3 text-[13px] font-medium rounded bg-brand-gradient text-white hover:opacity-90 transition-opacity duration-120 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-5">
            <AdminInput
              label="Package Name"
              placeholder="Weekly Plan"
              error={errors.name?.message}
              {...register("name", { required: "Name is required" })}
            />
            
            <AdminInput
              label="Duration (Days)"
              type="number"
              placeholder="7"
              error={errors.durationDays?.message}
              {...register("durationDays", { required: "Duration is required", valueAsNumber: true, min: 1 })}
            />
            
            <AdminInput
              label="Fee (₦ Naira)"
              type="number"
              step="0.01"
              placeholder="500"
              helper="Enter amount in naira (₦)"
              error={errors.fee?.message}
              {...register("fee", { required: "Fee is required", valueAsNumber: true, min: 0 })}
            />
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active-edit"
                {...register("active")}
                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
              />
              <label htmlFor="active-edit" className="text-sm font-medium cursor-pointer text-foreground">
                Active (visible to users)
              </label>
            </div>
            
            {/* Read-only info */}
            <div className="bg-secondary/30 rounded p-3 text-sm border border-border">
              <p className="font-medium mb-2 text-foreground">Read-only fields</p>
              <p className="text-xs text-muted-foreground">
                • Attempts: {editingPackage.attemptsIncluded} {editingPackage.attemptsPeriod?.toLowerCase()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                These fields cannot be edited from the admin panel.
              </p>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Add Modal */}
      <AdminModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setError(null);
        }}
        title="Add New Package"
        description="Create a new subscription package. Changes require approval."
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setError(null);
              }}
              disabled={submitting}
              className="h-8 px-3 text-[13px] font-medium rounded border border-border bg-transparent hover:bg-secondary transition-colors duration-120 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmitAdd)}
              disabled={submitting}
              className="h-8 px-3 text-[13px] font-medium rounded bg-brand-gradient text-white hover:opacity-90 transition-opacity duration-120 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmitAdd)} className="space-y-5">
          <AdminInput
            label="Package Name"
            placeholder="Custom Plan"
            error={errors.name?.message}
            {...register("name", { required: "Name is required" })}
          />
          
          <AdminInput
            label="Duration (Days)"
            type="number"
            placeholder="30"
            error={errors.durationDays?.message}
            {...register("durationDays", { required: "Duration is required", valueAsNumber: true, min: 1 })}
          />
          
          <AdminInput
            label="Fee (₦ Naira)"
            type="number"
            step="0.01"
            placeholder="2000"
            helper="Enter amount in naira (₦)"
            error={errors.fee?.message}
            {...register("fee", { required: "Fee is required", valueAsNumber: true, min: 0 })}
          />
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active-new"
              {...register("active")}
              defaultChecked
              className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
            <label htmlFor="active-new" className="text-sm font-medium cursor-pointer text-foreground">
              Active (visible to users)
            </label>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
