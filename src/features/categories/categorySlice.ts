import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/axios";

export interface Category {
  id: number;
  nom: string;
}

interface CategoryState {
  items: Category[];
}

const initialState: CategoryState = {
  items: [],
};

export const fetchCategories = createAsyncThunk("categories/fetch", async () => {
  const response = await api.get("/categories");
  return response.data;
});

const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.items = action.payload;
    });
  },
});

export default categorySlice.reducer;