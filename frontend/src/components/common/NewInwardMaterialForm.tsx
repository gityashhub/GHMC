import { useState } from "react";

interface MaterialData {
  invoiceNo?: string;
  vehicleCapacity?: string;
  transporterName?: string;
  rate?: number;
  amount?: number;
  detCharges?: number;
  gst?: number;
  grossAmount?: number;
  paidOn?: string;
  selectedEntryId?: string | null;
}

interface Props {
  onCancel: () => void;
  onCreate: (data: Partial<MaterialData>) => void;
  transporters: string[];
  existingEntries?: any[];
}

export default function NewInwardMaterialForm({ onCancel, onCreate, transporters, existingEntries = [] }: Props) {
  const [form, setForm] = useState<Partial<MaterialData>>({
    transporterName: transporters[0] || "",
    invoiceNo: "",
    vehicleCapacity: "",
    rate: 0,
    amount: 0,
    detCharges: 0,
    gst: 0,
    grossAmount: 0,
    paidOn: "",
  });
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  function update<K extends keyof Partial<MaterialData>>(k: K, v: any) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function populateFromEntry(e: any | null) {
    if (!e) return;
    // nothing to auto-fill into the material form other than keeping track of the selected entry id
  }

  return (
    <form
      onSubmit={(e) => {
          e.preventDefault();
          onCreate({ ...form, selectedEntryId });
        }}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Select Inward Entry</label>
        <select
          className="input-field w-full"
          onChange={(e) => {
            const id = e.target.value;
            if (!id) {
              setSelectedEntryId(null);
              return;
            }
            setSelectedEntryId(id);
            const entry = existingEntries.find((x) => String(x.id) === id);
            populateFromEntry(entry || null);
          }}
          defaultValue=""
        >
          <option value="">-- Select inward entry to import --</option>
          {existingEntries.map((en) => (
            <option key={en.id} value={en.id}>
              {`${en.srNo || ""} ${en.date ? `(${en.date})` : ""} — ${en.lotNo || en.manifestNo || en.id} — ${en.companyName || ""}`}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground">Transporter Name</label>
          <select className="input-field w-full" value={form.transporterName} onChange={(e) => update("transporterName", e.target.value)}>
            <option value="">Select Transporter</option>
            {transporters.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Inv. No.</label>
          <input className="input-field w-full" value={form.invoiceNo as any} onChange={(e) => update("invoiceNo", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Vehicle Capacity</label>
          <input className="input-field w-full" value={form.vehicleCapacity as any} onChange={(e) => update("vehicleCapacity", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground">Rate</label>
          <input type="number" className="input-field w-full" value={form.rate as any} onChange={(e) => update("rate", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Amount</label>
          <input type="number" className="input-field w-full" value={form.amount as any} onChange={(e) => update("amount", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Detention. charges.</label>
          <input type="number" className="input-field w-full" value={form.detCharges as any} onChange={(e) => update("detCharges", Number(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground">GST</label>
          <input type="number" className="input-field w-full" value={form.gst as any} onChange={(e) => update("gst", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Gross Amount</label>
          <input type="number" className="input-field w-full" value={form.grossAmount as any} onChange={(e) => update("grossAmount", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Paid On</label>
          <input type="date" className="input-field w-full" value={form.paidOn as any} onChange={(e) => update("paidOn", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Create Inward Material Record</button>
      </div>
    </form>
  );
}
