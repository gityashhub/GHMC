import { useState, useEffect } from "react";
import { OutwardMaterial, CreateOutwardMaterialData } from "@/services/outward.service";
import transportersService from "@/services/transporters.service";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
    onCancel: () => void;
    onSubmit: (data: CreateOutwardMaterialData) => void;
    entry?: OutwardMaterial;
    outwardEntries?: any[]; // Using any for now to avoid circular dependency issues or just simplifying
    isLoading?: boolean;
}

export default function OutwardMaterialForm({ onCancel, onSubmit, entry, outwardEntries = [], isLoading }: Props) {
    const { user } = useAuth();
    const [formData, setFormData] = useState<CreateOutwardMaterialData>({
        outwardEntryId: entry?.outwardEntryId || undefined,
        date: entry?.date ? new Date(entry.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        cementCompany: entry?.cementCompany || undefined,
        manifestNo: entry?.manifestNo || undefined,
        vehicleNo: entry?.vehicleNo || undefined,
        wasteName: entry?.wasteName || undefined,
        quantity: entry?.quantity || undefined,
        month: entry?.month || undefined,
        unit: (entry?.unit as "MT" | "Kg" | "KL") || undefined,
        transporterName: entry?.transporterName || '',
        invoiceNo: entry?.invoiceNo || undefined,
        vehicleCapacity: entry?.vehicleCapacity || undefined,
        rate: entry?.rate || undefined,
        amount: entry?.amount || undefined,
        detCharges: entry?.detCharges || undefined,
        gst: entry?.gst || undefined,
        grossAmount: entry?.grossAmount || undefined,
        paidOn: entry?.paidOn ? new Date(entry.paidOn).toISOString().slice(0, 10) : undefined,
    });

    // Fetch transporters
    const { data: transportersData } = useQuery({
        queryKey: ['transporters'],
        queryFn: () => transportersService.getTransporters({ limit: 100 }),
    });

    const transporters = transportersData?.transporters || [];

    // Auto-populate from selected entry
    useEffect(() => {
        if (formData.outwardEntryId && outwardEntries.length > 0) {
            const selectedEntry = outwardEntries.find(e => e.id === formData.outwardEntryId);
            if (selectedEntry) {
                setFormData(prev => ({
                    ...prev,
                    date: selectedEntry.date ? new Date(selectedEntry.date).toISOString().slice(0, 10) : prev.date,
                    cementCompany: selectedEntry.cementCompany || prev.cementCompany,
                    manifestNo: selectedEntry.manifestNo || prev.manifestNo,
                    vehicleNo: selectedEntry.vehicleNo || prev.vehicleNo,
                    wasteName: selectedEntry.wasteName || prev.wasteName,
                    quantity: selectedEntry.quantity || prev.quantity,
                    unit: selectedEntry.unit || prev.unit,
                    transporterName: selectedEntry.transporter?.name || prev.transporterName,
                    vehicleCapacity: selectedEntry.vehicleCapacity || prev.vehicleCapacity,
                }));
            }
        }
    }, [formData.outwardEntryId, outwardEntries]);

    useEffect(() => {
        const qty = formData.quantity || 0;
        const rate = formData.rate || 0;
        const amount = qty && rate ? qty * rate : formData.amount || 0;
        const detCharges = formData.detCharges || 0;
        const gst = formData.gst || 0;
        const grossAmount = amount + detCharges + gst;
        setFormData(prev => ({ ...prev, amount, grossAmount }));
    }, [formData.quantity, formData.rate, formData.detCharges, formData.gst]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.transporterName) {
            alert('Please select a transporter');
            return;
        }
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Select Outward Entry (Optional)</label>
                <select
                    className="input-field w-full"
                    value={formData.outwardEntryId || ''}
                    onChange={(e) => setFormData({ ...formData, outwardEntryId: e.target.value || undefined })}
                >
                    <option value="">-- Select outward entry to import --</option>
                    {outwardEntries.map((en) => (
                        <option key={en.id} value={en.id}>
                            {en.date ? new Date(en.date).toLocaleDateString() : ''} — {en.manifestNo || en.id} — {en.cementCompany || ''}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                    <input
                        type="date"
                        className="input-field w-full"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Cement Company</label>
                    <input
                        type="text"
                        className="input-field w-full"
                        value={formData.cementCompany || ''}
                        onChange={(e) => setFormData({ ...formData, cementCompany: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Manifest No.</label>
                    <input
                        type="text"
                        className="input-field w-full"
                        value={formData.manifestNo || ''}
                        onChange={(e) => setFormData({ ...formData, manifestNo: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Month</label>
                    <input
                        type="text"
                        className="input-field w-full"
                        value={formData.month || ''}
                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Vehicle No.</label>
                    <input
                        type="text"
                        className="input-field w-full"
                        value={formData.vehicleNo || ''}
                        onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Waste Name</label>
                    <input
                        type="text"
                        className="input-field w-full"
                        value={formData.wasteName || ''}
                        onChange={(e) => setFormData({ ...formData, wasteName: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Quantity</label>
                    <input
                        type="number"
                        step="0.01"
                        className="input-field w-full"
                        value={formData.quantity || ''}
                        onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || undefined })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Unit</label>
                    <select
                        className="input-field w-full"
                        value={formData.unit || ''}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    >
                        <option value="">Select Unit</option>
                        <option value="MT">MT</option>
                        <option value="Kg">Kg</option>
                        <option value="KL">KL</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Transporter Name *</label>
                    <select
                        className="input-field w-full"
                        value={formData.transporterName}
                        onChange={(e) => setFormData({ ...formData, transporterName: e.target.value })}
                        required
                    >
                        <option value="">Select Transporter</option>
                        {transporters.map((t) => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                    </select>
                </div>
                {user?.role === 'admin' && (
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Invoice No.</label>
                        <input
                            type="text"
                            className="input-field w-full"
                            value={formData.invoiceNo || ''}
                            onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value || undefined })}
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Vehicle Capacity</label>
                    <input
                        type="text"
                        className="input-field w-full"
                        value={formData.vehicleCapacity || ''}
                        onChange={(e) => setFormData({ ...formData, vehicleCapacity: e.target.value || undefined })}
                    />
                </div>
            </div>

            {user?.role === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Rate</label>
                        <input
                            type="number"
                            step="0.01"
                            className="input-field w-full"
                            value={formData.rate || ''}
                            onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || undefined })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            className="input-field w-full"
                            value={formData.amount || ''}
                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || undefined })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Detention Charges</label>
                        <input
                            type="number"
                            step="0.01"
                            className="input-field w-full"
                            value={formData.detCharges || ''}
                            onChange={(e) => setFormData({ ...formData, detCharges: parseFloat(e.target.value) || undefined })}
                        />
                    </div>
                </div>
            )}

            {user?.role === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">GST</label>
                        <input
                            type="number"
                            step="0.01"
                            className="input-field w-full"
                            value={formData.gst || ''}
                            onChange={(e) => setFormData({ ...formData, gst: parseFloat(e.target.value) || undefined })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Gross Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            className="input-field w-full bg-muted/10"
                            value={formData.grossAmount || ''}
                            readOnly
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Paid On</label>
                        <input
                            type="date"
                            className="input-field w-full"
                            value={formData.paidOn || ''}
                            onChange={(e) => setFormData({ ...formData, paidOn: e.target.value || undefined })}
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        entry ? 'Update Material Record' : 'Create Material Record'
                    )}
                </Button>
            </div>
        </form>
    );
}
