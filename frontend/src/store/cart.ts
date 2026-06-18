import { create } from "zustand";

import { cartApi } from "@/api/client";
import type { Cart } from "@/types";

type CartState = {
  cart: Cart | null;
  loading: boolean;
  setCart: (cart: Cart | null) => void;
  loadCart: () => Promise<void>;
  resetCart: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  loading: false,
  setCart: (cart) => set({ cart }),
  loadCart: async () => {
    if (!localStorage.getItem("accessToken")) {
      set({ cart: null, loading: false });
      return;
    }

    set({ loading: true });
    try {
      const { data } = await cartApi.get();
      set({ cart: data.data, loading: false });
    } catch {
      set({ cart: null, loading: false });
    }
  },
  resetCart: () => set({ cart: null, loading: false }),
}));
