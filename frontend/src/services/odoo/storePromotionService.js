import { api } from "./odooClient";

export const storePromotionService = {
  quote: async ({ lines, cartId } = {}) => {
    const payload = {
      cart_id: cartId || null,
      lines: Array.isArray(lines) ? lines : [],
    };
    return await api.post("/store/promotions/quote", payload);
  },
};

