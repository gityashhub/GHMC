export interface Company {
  id: string;
  name: string;
  address: string;
  city: string;
  contact: string;
  gstNumber: string;
  materials: { material: string; rate: number; unit: "MT" | "Kg" | "KL" }[];
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
}

export const mockCompanies: Company[] = [];
