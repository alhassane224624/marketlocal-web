"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { hydrateCart } from "@/features/cart/cartSlice";
import { fetchMe } from "@/features/auth/authSlice";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrateCart());
    // Session existante : on recharge l'utilisateur pour toutes les pages, publiques comprises.
    if (localStorage.getItem("token") && !store.getState().auth.user) store.dispatch(fetchMe());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
