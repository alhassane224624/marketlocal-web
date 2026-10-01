import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  product_id: number;
  nom: string;
  prix: number;
  quantite: number;
  stock: number;
  shop_nom: string;
  image?: string;
}

interface CartState {
  items: CartItem[];
}

const loadFromStorage = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("cart");
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem("cart");
    return [];
  }
};

const saveToStorage = (items: CartItem[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("cart", JSON.stringify(items));
  }
};

const initialState: CartState = {
  items: loadFromStorage(),
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, "quantite">>) => {
      const existing = state.items.find(
        (item) => item.product_id === action.payload.product_id
      );
      if (existing) {
        if (existing.quantite < existing.stock) {
          existing.quantite += 1;
        }
      } else {
        state.items.push({ ...action.payload, quantite: 1 });
      }
      saveToStorage(state.items);
    },
    incrementQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find((i) => i.product_id === action.payload);
      if (item && item.quantite < item.stock) item.quantite += 1;
      saveToStorage(state.items);
    },
    decrementQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find((i) => i.product_id === action.payload);
      if (item) item.quantite -= 1;
      state.items = state.items.filter((i) => i.quantite > 0);
      saveToStorage(state.items);
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((i) => i.product_id !== action.payload);
      saveToStorage(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      saveToStorage(state.items);
    },
  },
});

export const { addToCart, incrementQuantity, decrementQuantity, removeFromCart, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;