import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import shopReducer from "@/features/shop/shopSlice";
import productReducer from "@/features/products/productSlice";
import categoryReducer from "@/features/categories/categorySlice";
import cartReducer from "@/features/cart/cartSlice";
import adminReducer from "@/features/admin/adminSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shop: shopReducer,
    products: productReducer,
    categories: categoryReducer,
    cart: cartReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;