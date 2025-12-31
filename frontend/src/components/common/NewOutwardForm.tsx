import { useState } from "react";

interface NewOutwardData {
  date?: string;
  month?: string;
  manifestNo?: string;
  cementCompany?: string;
  location?: string;
  transporterName?: string;
  vehicleNo?: string;
  wasteName?: string;
  quantity?: number;
  unit?: string;
  packing?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  rate?: number;
  amount?: number;
  gst?: number;
  grossAmount?: number;
  vehicleCapacity?: string;
  detCharges?: number;
  paidOn?: string;
  dueOn?: string;
}

interface Props {
  onCancel: () => void;
  onCreate: (data: Partial<NewOutwardData>) => void;
  transporters: string[];
}

export default function NewOutwardForm({ onCancel, onCreate, transporters }: Props) {
  const [form, setForm] = useState<Partial<NewOutwardData>>({
    month: "",
    date: new Date().toISOString().slice(0, 10),
    cementCompany: "",
    transporterName: transporters[0] || "",
    location: "",
    packing: "",
    manifestNo: "",
    wasteName: "",
    quantity: 0,
    unit: "MT",
    invoiceNo: "",
    rate: 0,
    amount: 0,
    gst: 0,
    grossAmount: 0,
    paidOn: "",
    dueOn: "",
  });

  function update<K extends keyof Partial<NewOutwardData>>(k: K, v: any) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  const qty = Number(form.quantity || 0);
  const rate = Number(form.rate || 0);
  const amount = qty && rate ? qty * rate : Number(form.amount || 0);
  const gst = Number(form.gst || 0);
  const det = Number(form.detCharges || 0);
  const gross = amount + gst + det;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCreate({ ...form, amount, grossAmount: gross });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Month</label>
          <input className="input-field w-full" value={form.month} onChange={(e) => update("month", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
          <input type="date" className="input-field w-full" value={form.date} onChange={(e) => update("date", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Name of Cement Company</label>
          <input className="input-field w-full" value={form.cementCompany} onChange={(e) => update("cementCompany", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Transporter Name</label>
          <select className="input-field w-full" value={form.transporterName} onChange={(e) => update("transporterName", e.target.value)}>
            <option value="">Select Transporter</option>
            {transporters.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
          <input className="input-field w-full" value={form.location} onChange={(e) => update("location", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Packing</label>
          <input className="input-field w-full" value={form.packing} onChange={(e) => update("packing", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Manifest No.</label>
          <input className="input-field w-full" value={form.manifestNo} onChange={(e) => update("manifestNo", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Waste Name</label>
          <input className="input-field w-full" value={form.wasteName} onChange={(e) => update("wasteName", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Qty. (MT)</label>
          <input type="number" className="input-field w-full" value={form.quantity as any} onChange={(e) => update("quantity", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Inv. No.</label>
          <input className="input-field w-full" value={form.invoiceNo as any} onChange={(e) => update("invoiceNo", e.target.value)} />
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
          <label className="block text-sm text-muted-foreground">GST</label>
          <input type="number" className="input-field w-full" value={form.gst as any} onChange={(e) => update("gst", Number(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground">Gross Amount</label>
          <input type="number" className="input-field w-full" value={gross as any} onChange={(e) => update("grossAmount", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground">Paid On</label>
          <input type="date" className="input-field w-full" value={form.paidOn as any} onChange={(e) => update("paidOn", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground">Due On</label>
          <input type="date" className="input-field w-full" value={form.dueOn as any} onChange={(e) => update("dueOn", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Create Entry</button>
      </div>
    </form>
  );
}
