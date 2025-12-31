import React, { useState, useEffect } from "react";
import { mockCompanies } from "@/lib/companies";

export type NewInwardFormValues = {
  date?: string;
  lotNo?: string;
  month?: string;
  companyName?: string;
  vehicleNo?: string;
  category?: "Solid" | "Semi-solid" | "Liquid";
  materials?: { material: string; rate: number; unit: "MT" | "Kg" | "KL"; quantity: number; manifestNo: string }[];
};

interface Props {
  onCancel: () => void;
  onCreate: (data: Partial<NewInwardFormValues>[]) => void; // Changed to array for multiple entries
}

export default function NewInwardForm({ onCancel, onCreate }: Props) {
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<{ material: string; rate: number; unit: "MT" | "Kg" | "KL"; quantity: number; manifestNo: string }[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    lotNo: "",
    month: "",
    companyName: "",
    vehicleNo: "",
    category: "Solid" as "Solid" | "Semi-solid" | "Liquid",
  });

  const handleCompanyChange = (companyName: string) => {
    const company = mockCompanies.find(c => c.name === companyName);
    setSelectedCompany(company || null);
    setSelectedMaterials([]);
    setFormData(prev => ({ ...prev, companyName }));
  };

  const addMaterial = (materialName: string) => {
    if (!selectedCompany || !materialName) return;

    const material = selectedCompany.materials.find((m: any) => m.material === materialName);
    if (!material) return;

    // Check if material already exists
    if (selectedMaterials.some(m => m.material === materialName)) return;

    const newMaterial = {
      material: material.material,
      rate: material.rate,
      unit: material.unit,
      quantity: 0,
      manifestNo: ""
    };

    setSelectedMaterials([...selectedMaterials, newMaterial]);
  };

  const removeMaterial = (index: number) => {
    setSelectedMaterials(selectedMaterials.filter((_, i) => i !== index));
  };

  const updateMaterialQty = (index: number, quantity: number) => {
    setSelectedMaterials(selectedMaterials.map((material, i) =>
      i === index ? { ...material, quantity } : material
    ));
  };

  const updateMaterialManifestNo = (index: number, manifestNo: string) => {
    setSelectedMaterials(selectedMaterials.map((material, i) =>
      i === index ? { ...material, manifestNo } : material
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (selectedMaterials.length === 0) {
      alert("Please select at least one material");
      return;
    }

    const invalidMaterials = selectedMaterials.filter(m => m.quantity <= 0 || !m.manifestNo?.trim());
    if (invalidMaterials.length > 0) {
      alert("Please enter valid quantities and manifest numbers for all selected materials");
      return;
    }

    if (!formData.vehicleNo.trim()) {
      alert("Please enter vehicle number");
      return;
    }

    // Create multiple inward entries
    const inwardEntries = selectedMaterials.map(material => ({
      ...formData,
      wasteName: material.material,
      rate: material.rate,
      unit: material.unit,
      quantity: material.quantity,
      manifestNo: material.manifestNo,
    }));

    onCreate(inwardEntries);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Date *</label>
          <input
            type="date"
            className="input-field w-full"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Lot No.</label>
          <input
            type="text"
            className="input-field w-full"
            value={formData.lotNo}
            onChange={(e) => setFormData(prev => ({ ...prev, lotNo: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Month</label>
          <input
            type="text"
            className="input-field w-full"
            value={formData.month}
            onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Company *</label>
          <select
            className="input-field w-full"
            value={formData.companyName}
            onChange={(e) => handleCompanyChange(e.target.value)}
          >
            <option value="">Select Company</option>
            {mockCompanies.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Vehicle No. *</label>
          <input
            type="text"
            className="input-field w-full"
            value={formData.vehicleNo}
            onChange={(e) => setFormData(prev => ({ ...prev, vehicleNo: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Category *</label>
          <select
            className="input-field w-full"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as "Solid" | "Semi-solid" | "Liquid" }))}
          >
            <option value="Solid">Solid</option>
            <option value="Semi-solid">Semi-solid</option>
            <option value="Liquid">Liquid</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Add Materials *</label>
          {selectedCompany && selectedCompany.materials.length > 0 ? (
            <select
              className="input-field w-full"
              onChange={(e) => {
                addMaterial(e.target.value);
                e.target.value = ""; // Reset selection
              }}
              value=""
            >
              <option value="">Select Material to Add</option>
              {selectedCompany.materials
                .filter((material: any) => !selectedMaterials.some(m => m.material === material.material))
                .map((material: any, index: number) => (
                  <option key={index} value={material.material}>
                    {material.material} (₹{material.rate}/{material.unit})
                  </option>
                ))}
            </select>
          ) : (
            <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
              Select a company first
            </div>
          )}
        </div>
      </div>

      {/* Selected Materials List */}
      {selectedMaterials.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Selected Materials</label>
          <div className="space-y-3">
            {selectedMaterials.map((material, index) => (
              <div key={index} className="flex gap-3 items-end p-3 rounded-lg bg-secondary/30">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Material
                  </label>
                  <div className="text-sm font-medium text-foreground p-2 bg-muted/50 rounded">
                    {material.material}
                  </div>
                </div>
                <div className="w-20">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Unit
                  </label>
                  <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                    {material.unit}
                  </div>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Rate
                  </label>
                  <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                    ₹{material.rate}
                  </div>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    value={material.quantity}
                    onChange={(e) => updateMaterialQty(index, Number(e.target.value))}
                    className="input-field w-full"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Manifest No *
                  </label>
                  <input
                    type="text"
                    value={material.manifestNo}
                    onChange={(e) => updateMaterialManifestNo(index, e.target.value)}
                    className="input-field w-full"
                    placeholder="MN-2024-XXX"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeMaterial(index)}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Remove material"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Create Inward Entries
        </button>
      </div>
    </form>
  );
}
