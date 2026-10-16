import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/axios";
import { apiError } from "@/lib/errors";

export interface Shop {
  id: number;
  user_id: number;
  nom: string;
  description: string | null;
  /** Ce que le vendeur veut vendre (lu par l'admin avant validation). */
  activite?: string | null;
  logo: string | null;
  statut: "en_attente" | "valide" | "refuse";
  motif_refus?: string | null;
  valide_at?: string | null;
  commission?: string;
  stripe_account_id?: string | null;
  kyc_status?: "not_started" | "pending" | "verified";
  is_active?: boolean;
  products?: { id: number; nom: string; prix: string; stock: number; en_vente?: boolean; image: string | null; category: { id: number; nom: string } | null }[];
}

interface ShopState {
  shop: Shop | null;
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: ShopState = {
  shop: null,
  status: "idle",
  error: null,
};

export const createShop = createAsyncThunk(
  "shop/create",
  async (
    data: { nom: string; description?: string; activite: string; logo?: File | null },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("nom", data.nom);
      if (data.description) formData.append("description", data.description);
      formData.append("activite", data.activite);
      if (data.logo) formData.append("logo", data.logo);

      const response = await api.post("/shops", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(apiError(err, "Erreur lors de la création de la boutique"));
    }
  }
);

export const fetchMyShop = createAsyncThunk(
  "shop/fetchMine",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/shops/mine");
      return response.data;
    } catch {
      return rejectWithValue(null); // pas de boutique = normal, pas une vraie erreur
    }
  }
);

export const updateShop = createAsyncThunk(
  "shop/update",
  async (
    data: { nom?: string; description?: string; activite?: string; logo?: File | null },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      if (data.nom) formData.append("nom", data.nom);
      if (data.description !== undefined) formData.append("description", data.description);
      if (data.activite !== undefined) formData.append("activite", data.activite);
      if (data.logo) formData.append("logo", data.logo);
      // Method spoofing : Laravel ne parse pas le corps multipart des requêtes PUT.
      formData.append("_method", "PUT");

      const response = await api.post("/shops/mine", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(apiError(err, "Erreur lors de la mise à jour de la boutique"));
    }
  }
);

const shopSlice = createSlice({
  name: "shop",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createShop.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(createShop.fulfilled, (state, action) => {
        state.status = "idle";
        state.shop = action.payload;
      })
      .addCase(createShop.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchMyShop.fulfilled, (state, action) => {
        state.shop = action.payload;
      })
      .addCase(fetchMyShop.rejected, (state) => {
        state.shop = null;
      })
      .addCase(updateShop.fulfilled, (state, action) => {
        state.shop = action.payload;
      });
  },
});

export default shopSlice.reducer;