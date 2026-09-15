"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { usePackagesStore, Package, PlanId } from "@/store/packages-store";

interface PackageFormData {
  name: string;
  price: number;
}

export default function PackagesPage() {
  const { packages, updatePackage } = usePackagesStore();
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { register, handleSubmit, reset } = useForm<PackageFormData>();

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    reset({ name: pkg.name, price: pkg.price });
  };

  const handleToggleActive = (pkg: Package) => {
    updatePackage(pkg.id, { active: !pkg.active });
  };

  const onSubmitEdit = (data: PackageFormData) => {
    if (editingPackage) {
      updatePackage(editingPackage.id, { name: data.name, price: data.price });
      setEditingPackage(null);
      reset();
    }
  };

  const onSubmitAdd = (data: PackageFormData) => {
    // For demo purposes, create a simple ID from the name
    const id = data.name.toLowerCase().replace(/\s+/g, "-") as PlanId;
    usePackagesStore.getState().addPackage({
      id,
      name: data.name,
      price: data.price,
      duration: "per month",
      attempts: "Unlimited",
      active: true,
    });
    setShowAddModal(false);
    reset();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Packages & Fees</h1>
          <p className="text-muted-foreground mt-1">Manage subscription plans and pricing</p>
        </div>
        <Button variant="gradient" onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus size={18} />
          Add New Package
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`rounded-2xl p-6 text-center flex flex-col items-center border ${
              pkg.mostPopular ? "bg-primary/10 border-primary" : "bg-card border-border"
            }`}
          >
            {pkg.mostPopular && (
              <span className="bg-primary text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full -mt-9 mb-4">
                Most Popular
              </span>
            )}
            <Star size={28} className={pkg.mostPopular ? "text-primary fill-primary" : "text-muted-foreground"} />
            <p className="font-bold text-lg mt-4">{pkg.name}</p>
            <p className="text-2xl font-extrabold mt-2 line-through decoration-2">{pkg.price}</p>
            
            <div className={`mt-4 rounded-full px-4 py-1.5 text-sm font-medium ${
              pkg.active 
                ? "bg-primary/10 border border-primary/30 text-primary" 
                : "bg-secondary border border-border text-muted-foreground"
            }`}>
              {pkg.active ? "Active" : "Disabled"}
            </div>

            <div className="flex gap-2 mt-6 w-full">
              <Button variant="outline" onClick={() => handleEdit(pkg)} className="flex-1">
                Edit
              </Button>
              <Button 
                variant={pkg.active ? "outline" : "gradient"} 
                onClick={() => handleToggleActive(pkg)}
                className="flex-1"
              >
                {pkg.active ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPackage && (
        <Modal
          open={!!editingPackage}
          onClose={() => setEditingPackage(null)}
          title="Edit Package"
        >
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Package Name</label>
              <Input {...register("name", { required: true })} placeholder="Weekly Plan" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Price</label>
              <Input {...register("price", { required: true })} placeholder="₦500" />
            </div>
            <Button type="submit" variant="gradient" className="w-full justify-center">
              Save Changes
            </Button>
          </form>
        </Modal>
      )}

      {/* Add Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Package"
      >
        <form onSubmit={handleSubmit(onSubmitAdd)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Package Name</label>
            <Input {...register("name", { required: true })} placeholder="Custom Plan" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Price</label>
            <Input {...register("price", { required: true })} placeholder="₦2,000" />
          </div>
          <Button type="submit" variant="gradient" className="w-full justify-center">
            Add Package
          </Button>
        </form>
      </Modal>
    </div>
  );
}
