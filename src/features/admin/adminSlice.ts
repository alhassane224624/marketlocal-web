import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/axios";

export interface Stats {
  total_utilisateurs: number;
  total_acheteurs: number;
  total_vendeurs: number;
  total_boutiques: number;
  boutiques_en_attente: number;
  total_produits: number;
  total_commandes: number;
  chiffre_affaires_total: number;
  commissions_total?: number;
}

export interface ShopAdmin {
  id: number;
  nom: string;
  description: string | null;
  statut: "en_attente" | "valide" | "refuse";
  commission?: string;
  is_active?: boolean;
  kyc_status?: string;
  created_at?: string;
  user: { id: number; name: string; email: string };
}

interface AdminState {
  stats: Stats | null;
  shops: ShopAdmin[];
  status: "idle" | "loading" | "failed";
}

const initialState: AdminState = {
  stats: null,
  shops: [],
  status: "idle",
};

export const fetchStats = createAsyncThunk("admin/fetchStats", async () => {
  const response = await api.get("/admin/stats");
  return response.data;
});

export const fetchAllShops = createAsyncThunk("admin/fetchShops", async () => {
  const response = await api.get("/admin/shops");
  return response.data;
});

export const validateShop = createAsyncThunk(
  "admin/validateShop",
  async (shopId: number) => {
    const response = await api.put(`/admin/shops/${shopId}/valider`);
    return response.data;
  }
);

export const refuseShop = createAsyncThunk(
  "admin/refuseShop",
  async (shopId: number) => {
    const response = await api.put(`/admin/shops/${shopId}/refuser`);
    return response.data;
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.status = "idle";
        state.stats = action.payload;
      })
      .addCase(fetchAllShops.fulfilled, (state, action) => {
        state.shops = action.payload;
      })
      .addCase(validateShop.fulfilled, (state, action) => {
        const shop = state.shops.find((s) => s.id === action.payload.id);
        if (shop) shop.statut = "valide";
      })
      .addCase(refuseShop.fulfilled, (state, action) => {
        const shop = state.shops.find((s) => s.id === action.payload.id);
        if (shop) shop.statut = "refuse";
      });
  },
});

export default adminSlice.reducer;