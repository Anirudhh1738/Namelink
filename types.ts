export interface LinkEntry {
  id: string;
  name: string;
  ip: string;
  description?: string;
  approved: boolean;
  createdAt: string;
}

export interface SearchErrorState {
  type: "not_found" | "pending" | "internal" | null;
  name?: string;
}
