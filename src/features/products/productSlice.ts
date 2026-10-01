import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/axios";

export interface Product {
  id: number;
  nom: string;
  description: string | null;
  prix: string;
  stock: number;
  image: string | null;
  shop: { id: number; nom: string };
  category: { id: number; nom: string };
  reviews?: { id: number; note: number; commentaire: string | null }[];
}

interface ProductsState {
  items: Product[];
  current: Product | null;
  status: "idle" | "loading" | "failed";
  currentPage: number;
  lastPage: number;
}

const initialState: ProductsState = {
  items: [],
  current: null,
  status: "idle",
  currentPage: 1,
  lastPage: 1,
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