import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/common/Modal";
import companiesService from "@/services/companies.service";
import transportersService from "@/services/transporters.service";
import inwardService from "@/services/inward.service";
import outwardService from "@/services/outward.service";
import settingsService from "@/services/settings.service";
import invoicesService, { CreateInvoiceData } from "@/services/invoices.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Removed unused interfaces if any
interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'Inward' | 'Outward' | 'Transporter';
  preselectedEntryIds?: string[]; // For creating invoice from entries
  onSuccess?: () => void;
}

export default function CreateInvoiceModal({ isOpen, onClose, type, preselectedEntryIds = [], onSuccess }: Props) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    companyId: '',
    transporterId: '',
    customerName: '',
    materials: [] as Array<{
      materialName: string;
      rate?: number;
      unit?: string;
      quantity?: number;
      amount?: number;
      manifestNo?: string;
    }>,
    manifestNos: [] as string[],
    inwardEntryIds: preselectedEntryIds,
    outwardEntryIds: [] as string[],
    subtotal: 0,
    cgstRate: undefined as number | undefined,
    sgstRate: undefined as number | undefined,
    gstNo: '',
    billedTo: '',
    shippedTo: '',
    description: '',
  });

  const [isPaymentReceived, setIsPaymentReceived] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch companies (for Inward invoices)
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesService.getCompanies({ limit: 100 }),
    enabled: type === 'Inward' && isOpen,
  });

  // Fetch transporters (for Outward/Transporter invoices)
  const { data: transportersData } = useQuery({
    queryKey: ['transporters'],
    queryFn: () => transportersService.getTransporters({ limit: 100 }),
    enabled: (type === 'Outward' || type === 'Transporter') && isOpen,
  });

  // Fetch inward entries (for linking)
  const { data: inwardEntriesData } = useQuery({
    queryKey: ['inward-entries-for-invoice'],
    queryFn: () => inwardService.getEntries({ limit: 100 }),
    enabled: (type === 'Inward' || preselectedEntryIds.length > 0) && isOpen,
  });

  // Fetch outward entries (for linking)
  const { data: outwardEntriesData } = useQuery({
    queryKey: ['outward-entries-for-invoice'],
    queryFn: () => outwardService.getEntries({ limit: 100 }),
    enabled: (type === 'Outward' || type === 'Transporter') && isOpen,
  });

  // Fetch GST rates from settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
    enabled: isOpen,
  });

  // Auto-populate preselected entries
  useEffect(() => {
    if (preselectedEntryIds.length > 0 && inwardEntriesData) {
      const entries = inwardEntriesData.entries.filter(e => preselectedEntryIds.includes(e.id));
      if (entries.length > 0) {
        const firstEntry = entries[0];
        setFormData(prev => ({
          ...prev,
          companyId: firstEntry.companyId,
          customerName: firstEntry.company?.name || '',
          manifestNos: entries.map(e => e.manifestNo).filter(Boolean),
          inwardEntryIds: preselectedEntryIds,
        }));
      }
    }
  }, [preselectedEntryIds, inwardEntriesData]);

  // Auto-populate GST rates from settings
  useEffect(() => {
    if (settings) {
      const cgstSetting = settings.find(s => s.key === 'cgst_rate');
      const sgstSetting = settings.find(s => s.key === 'sgst_rate');
      if (cgstSetting && sgstSetting) {
        setFormData(prev => ({
          ...prev,
          cgstRate: parseFloat(cgstSetting.value || '9'),
          sgstRate: parseFloat(sgstSetting.value || '9'),
        }));
      }
    }
  }, [settings]);

  const companies = companiesData?.companies || [];
  const transporters = transportersData?.transporters || [];
  const inwardEntries = inwardEntriesData?.entries || [];
  const outwardEntries = outwardEntriesData?.entries || [];

  const selectedCompany = companies.find(c => c.id === formData.companyId);
  const companyMaterials = selectedCompany?.materials || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (type === 'Inward' && !formData.companyId) {
      toast.error('Please select a company');
      return;
    }

    if ((type === 'Outward' || type === 'Transporter') && !formData.transporterId) {
      toast.error('Please select a transporter');
      return;
    }

    if (formData.materials.length === 0 && (!formData.subtotal || formData.subtotal === 0)) {
      // Only error if BOTH materials list is empty AND subtotal is 0/undefined
      toast.error('Please add at least one material or enter a subtotal');
      return;
    }

    setIsSubmitting(true);

    try {
      const invoiceData: CreateInvoiceData = {
        type,
        date: formData.date,
        companyId: formData.companyId || undefined,
        transporterId: formData.transporterId || undefined,
        customerName: formData.customerName || undefined,
        materials: formData.materials.length > 0 ? formData.materials : undefined,
        manifestNos: formData.manifestNos.length > 0 ? formData.manifestNos : undefined,
        inwardEntryIds: formData.inwardEntryIds.length > 0 ? formData.inwardEntryIds : undefined,
        outwardEntryIds: formData.outwardEntryIds.length > 0 ? formData.outwardEntryIds : undefined,
        subtotal: formData.subtotal > 0 ? formData.subtotal : undefined,
        cgstRate: formData.cgstRate,
        sgstRate: formData.sgstRate,
        gstNo: formData.gstNo || undefined,
        billedTo: formData.billedTo || undefined,
        shippedTo: formData.shippedTo || undefined,
        description: formData.description || undefined,
        paymentReceived: isPaymentReceived ? grandTotal : undefined,
        paymentReceivedOn: isPaymentReceived ? paymentDate : undefined,
      };

      await invoicesService.createInvoice(invoiceData);
      toast.success('Invoice created successfully');
      onSuccess?.();
      onClose();
      // Reset form
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        companyId: '',
        transporterId: '',
        customerName: '',
        materials: [],
        manifestNos: [],
        inwardEntryIds: [],
        outwardEntryIds: [],
        subtotal: 0,
        cgstRate: undefined,
        sgstRate: undefined,
        gstNo: '',
        billedTo: '',
        shippedTo: '',
        description: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };



  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updated = [...prev.materials];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-calculate amount if quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        const qty = field === 'quantity' ? value : updated[index].quantity || 0;
        const rate = field === 'rate' ? value : updated[index].rate || 0;
        updated[index].amount = qty * rate;
      }

      return { ...prev, materials: updated };
    });
  };

  // Calculate totals
  const subtotal = formData.materials.reduce((sum, m) => sum + (m.amount || 0), 0) || formData.subtotal;
  const cgstRate = formData.cgstRate || 9;
  const sgstRate = formData.sgstRate || 9;
  const cgst = (subtotal * cgstRate) / 100;
  const sgst = (subtotal * sgstRate) / 100;
  const grandTotal = subtotal + cgst + sgst;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Create ${type} Invoice`} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Date *</label>
            <input
              type="date"
              className="input-field w-full"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {type === 'Inward' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Company *</label>
              <select
                className="input-field w-full"
                value={formData.companyId}
                onChange={(e) => {
                  const company = companies.find(c => c.id === e.target.value);
                  setFormData({
                    ...formData,
                    companyId: e.target.value,
                    customerName: company?.name || '',
                  });
                }}
                required
              >
                <option value="">Select Company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {(type === 'Outward' || type === 'Transporter') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Transporter *</label>
              <select
                className="input-field w-full"
                value={formData.transporterId}
                onChange={(e) => {
                  const transporter = transporters.find(t => t.id === e.target.value);
                  setFormData({
                    ...formData,
                    transporterId: e.target.value,
                    customerName: transporter?.name || '',
                  });
                }}
                required
              >
                <option value="">Select Transporter</option>
                {transporters.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Customer Name</label>
            <input
              type="text"
              className="input-field w-full"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            />
          </div>
        </div>

        {/* Link Entries Section - Moved up for better flow */}
        {type === 'Inward' && inwardEntries.length > 0 && (
          <div className="border rounded-lg p-3 bg-card">
            <label className="block text-sm font-medium text-foreground mb-2">Link Inward Entries</label>
            <div className="max-h-[150px] overflow-y-auto space-y-1 pr-1">
              {inwardEntries
                .filter(e => !e.invoiceId) // Only show uninvoiced entries
                .map(entry => {
                  const isSelected = formData.inwardEntryIds.includes(entry.id);
                  return (
                    <div key={entry.id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded border border-transparent hover:border-border transition-colors">
                      <input
                        type="checkbox"
                        id={`entry-${entry.id}`}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={isSelected}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          let newEntryIds = [...formData.inwardEntryIds];
                          let newMaterials = [...formData.materials];
                          let newManifestNos = [...formData.manifestNos];

                          if (checked) {
                            newEntryIds.push(entry.id);
                            // Add material from entry
                            newMaterials.push({
                              materialName: entry.wasteName,
                              rate: entry.rate ? Number(entry.rate) : 0,
                              unit: entry.unit,
                              quantity: Number(entry.quantity),
                              amount: (Number(entry.quantity) * (entry.rate ? Number(entry.rate) : 0)),
                              manifestNo: entry.manifestNo,
                            });
                            // Add manifest no
                            if (entry.manifestNo && !newManifestNos.includes(entry.manifestNo)) {
                              newManifestNos.push(entry.manifestNo);
                            }
                          } else {
                            newEntryIds = newEntryIds.filter(id => id !== entry.id);
                            // Remove material associated with this entry (by manifest No and waste name match)
                            // Note: This is a bit loose, ideally we'd track entry ID in material, but for now this works for simple cases
                            const matIndex = newMaterials.findIndex(m => m.manifestNo === entry.manifestNo && m.materialName === entry.wasteName);
                            if (matIndex !== -1) {
                              newMaterials.splice(matIndex, 1);
                            }
                            // Remove manifest no if no other material uses it
                            const isManifestUsed = newMaterials.some(m => m.manifestNo === entry.manifestNo);
                            if (!isManifestUsed) {
                              newManifestNos = newManifestNos.filter(m => m !== entry.manifestNo);
                            }
                          }

                          setFormData(prev => ({
                            ...prev,
                            inwardEntryIds: newEntryIds,
                            materials: newMaterials,
                            manifestNos: newManifestNos,
                          }));
                        }}
                      />
                      <label htmlFor={`entry-${entry.id}`} className="text-sm cursor-pointer flex-1 flex justify-between">
                        <span>{entry.manifestNo} - {entry.wasteName}</span>
                        <span className="text-muted-foreground">{entry.quantity} {entry.unit}</span>
                      </label>
                    </div>
                  );
                })}
              {inwardEntries.filter(e => !e.invoiceId).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No available entries to link.</p>
              )}
            </div>
          </div>
        )}

        {/* Removed Manual Add Material Section */}

        {formData.materials.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Invoice Items</label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {formData.materials.map((material, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-secondary/50 rounded-lg items-center text-sm">
                  <div className="col-span-3">
                    <div className="font-medium truncate" title={material.materialName}>{material.materialName}</div>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                      value={material.quantity || ''}
                      onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                    />
                  </div>
                  <div className="col-span-1 text-xs text-muted-foreground">
                    {material.unit}
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                      value={material.rate || ''}
                      onChange={(e) => updateMaterial(index, 'rate', parseFloat(e.target.value) || 0)}
                      placeholder="Rate"
                    />
                  </div>
                  <div className="col-span-3 text-right font-medium">
                    ₹{Number(material.amount || 0).toFixed(2)}
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => removeMaterial(index)}
                      className="text-destructive hover:text-destructive/80 p-1"
                    >
                      <span className="sr-only">Remove</span>
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(type === 'Outward' || type === 'Transporter') && outwardEntries.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Link Outward Entries (Optional)</label>
            <select
              className="input-field w-full"
              multiple
              size={5}
              value={formData.outwardEntryIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFormData(prev => ({
                  ...prev,
                  outwardEntryIds: selected,
                  manifestNos: [
                    ...prev.manifestNos,
                    ...selected.map(id => {
                      const entry = outwardEntries.find(e => e.id === id);
                      return entry?.manifestNo;
                    }).filter(Boolean) as string[],
                  ],
                }));
              }}
            >
              {outwardEntries
                .filter(e => !e.invoiceId) // Only show uninvoiced entries
                .map(entry => (
                  <option key={entry.id} value={entry.id}>
                    {entry.manifestNo} - {entry.cementCompany} ({entry.quantity} {entry.unit})
                  </option>
                ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Hold Ctrl/Cmd to select multiple entries</p>
          </div>
        )}

        {/* Manual Subtotal (if no materials) */}
        {formData.materials.length === 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Subtotal *</label>
            <input
              type="number"
              step="0.01"
              className="input-field w-full"
              value={formData.subtotal || ''}
              onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
              required={formData.materials.length === 0}
            />
          </div>
        )}

        {/* GST Rates & Totals & Additional Fields - Compacted */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">GST No</label>
              <input
                type="text"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={formData.gstNo}
                onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Billed To</label>
              <input
                type="text"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={formData.billedTo}
                onChange={(e) => setFormData({ ...formData, billedTo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Shipped To</label>
              <input
                type="text"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={formData.shippedTo}
                onChange={(e) => setFormData({ ...formData, shippedTo: e.target.value })}
              />
            </div>
            <div className="md:col-span-3">
              <input
                type="text"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                placeholder="Description (Optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="col-span-4 bg-muted/30 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block">CGST %</label>
                <input
                  type="number"
                  className="h-7 w-full rounded border border-input px-1 text-right text-xs bg-muted"
                  value={String(cgstRate)}
                  readOnly
                  disabled
                />
              </div>
              <div className="text-right flex flex-col justify-end">
                <span className="text-xs">₹{cgst.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block">SGST %</label>
                <input
                  type="number"
                  className="h-7 w-full rounded border border-input px-1 text-right text-xs bg-muted"
                  value={String(sgstRate)}
                  readOnly
                  disabled
                />
              </div>
              <div className="text-right flex flex-col justify-end">
                <span className="text-xs">₹{sgst.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between border-t border-border pt-2 mt-2 mb-2">
              <span className="font-semibold">Total</span>
              <span className="font-bold">₹{grandTotal.toFixed(2)}</span>
            </div>

            {/* Payment Received Section */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium cursor-pointer select-none flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPaymentReceived}
                    onChange={(e) => setIsPaymentReceived(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Payment Received?
                </label>
              </div>
              {isPaymentReceived && (
                <div className="flex gap-2 items-center animate-in slide-in-from-top-1 fade-in duration-200">
                  <label className="text-[10px] text-muted-foreground whitespace-nowrap">Date:</label>
                  <input
                    type="date"
                    className="h-7 w-full rounded border border-input px-2 text-xs bg-background"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description moved to above grid for specific layout or handled there */}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Invoice'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

