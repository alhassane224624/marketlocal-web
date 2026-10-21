import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/axios";

export interface ProductImage {
  id: number;
  url: string;
  position: number;
}

export interface Product {
  id: number;
  nom: string;
  description: string | null;
  prix: string;
  stock: number;
  /** false : retiré de la vente par le vendeur (invisible dans le catalogue). */
  en_vente?: boolean;
  image: string | null;
  note_moyenne?: number | null;
  nombre_avis?: number;
  shop: { id: number; nom: string; logo?: string | null };
  category: { id: number; nom: string };
  category_id?: number;
  categories?: { id: number; nom: string }[];
  images?: ProductImage[];
  reviews?: { id: number; note: number; commentaire: string | null; user?: { id: number; name: string } }[];
}

interface ProductsState {
  items: Product[];
  current: Product | null;
  status: "idle" | "loading" | "failed";
  currentPage: number;
  lastPage: number;
  total: number;
}

const initialState: ProductsState = {
  items: [],
  current: null,
  status: "idle",
  currentPage: 1,
  lastPage: 1,
  total: 0,
};

export const fetchProducts = createAsyncThunk(
  "products/fetch",
  async (
    params: {
      category_id?: number;
      shop_id?: number;
      prix_min?: number;
      prix_max?: number;
      q?: string;
      page?: number;
      tri?: "recent" | "prix_asc" | "prix_desc" | "note";
      en_stock?: 1;
    } = {}
  ) => {
    const response = await api.get("/products", { params });
    return response.data;
  }
);

export const fetchProduct = createAsyncThunk(
  "products/fetchOne",
  async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  }
);

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "idle";
        state.items = action.payload.data;
        state.currentPage = action.payload.current_page;
        state.lastPage = action.payload.last_page;
        state.total = action.payload.total;
      })
      .addCase(fetchProducts.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(fetchProduct.pending, (state) => {
        state.status = "loading";
        state.current = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.status = "idle";
        state.current = action.payload;
      })
      .addCase(fetchProduct.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default productSlice.reducer;