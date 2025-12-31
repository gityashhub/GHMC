import { useState } from "react";

interface TransporterData {
  month?: string;
  date?: string;
  cementCompany?: string;
  transporterName?: string;
  location?: string;
  manifestNo?: string;
  vehicleNo?: string;
  wasteName?: string;
  quantity?: number;
  unit?: string;
  packing?: string;
  invoiceNo?: string;
  vehicleCapacity?: string;
  rate?: number;
  amount?: number;
  detCharges?: number;
  gst?: number;
  grossAmount?: number;
  paidOn?: string;
}

interface Props {
  onCancel: () => void;
  onCreate: (data: Partial<TransporterData>) => void;
  transporters: string[];
  existingEntries?: any[];
}

export default function NewOutwardTransporterForm({ onCancel, onCreate, transporters, existingEntries = [] }: Props) {
  const [form, setForm] = useState<Partial<TransporterData>>({
    month: "",
    date: new Date().toISOString().slice(0, 10),
    cementCompany: "",
    transporterName: transporters[0] || "",
    location: "",
    manifestNo: "",
    vehicleNo: "",
    wasteName: "",
    quantity: 0,
    unit: "MT",
    packing: "",
    invoiceNo: "",
    vehicleCapacity: "",
    rate: 0,
    amount: 0,
    detCharges: 0,
    gst: 0,
    grossAmount: 0,
    paidOn: "",
  });

  function update<K extends keyof Partial<TransporterData>>(k: K, v: any) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function populateFromEntry(e: any | null) {
    if (!e) return;
    setForm((s) => ({
      ...s,
      month: e.month || s.month,
      date: e.date || s.date,
      cementCompany: e.cementCompany || s.cementCompany,
      transporterName: e.transporterName || s.transporterName,
      location: e.location || s.location,
      manifestNo: e.manifestNo || s.manifestNo,
      wasteName: e.wasteName || s.wasteName,
      quantity: e.quantity || s.quantity,
      packing: e.packing || s.packing,
      vehicleNo: e.vehicleNo || s.vehicleNo,
    }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate(form);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Select Outward Entry</label>
          <select
            className="input-field w-full"
            onChange={(e) => {
              const id = e.target.value;
              if (!id) {
                // clear selection
                return;
              }
              const entry = existingEntries.find((x) => String(x.id) === id);
              populateFromEntry(entry || null);
            }}
            defaultValue=""
          >
            <option value="">-- Select outward entry to import --</option>
            {existingEntries.map((en) => (
              <option key={en.id} value={en.id}>
                {`${en.manifestNo || en.lotNo || en.id} — ${en.cementCompany || en.companyName || ""} ${en.date ? `(${en.date})` : ""}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground">Inv. No.</label>
          <input className="input-field w-full" value={form.invoiceNo as any} onChange={(e) => update("invoiceNo", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Vehicle Capacity (MT)</label>
          <input className="input-field w-full" value={form.vehicleCapacity as any} onChange={(e) => update("vehicleCapacity", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Rate</label>
          <input type="number" className="input-field w-full" value={form.rate as any} onChange={(e) => update("rate", Number(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground">Amount</label>
          <input type="number" className="input-field w-full" value={form.amount as any} onChange={(e) => update("amount", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Detention charges</label>
          <input type="number" className="input-field w-full" value={form.detCharges as any} onChange={(e) => update("detCharges", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">GST</label>
          <input type="number" className="input-field w-full" value={form.gst as any} onChange={(e) => update("gst", Number(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <button type="submit" className="btn-primary">Create Entry</button>
      </div>
    </form>
  );
}
