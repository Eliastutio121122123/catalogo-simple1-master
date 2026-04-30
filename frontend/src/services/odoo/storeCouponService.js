import { api } from "./odooClient";

export const storeCouponService = {
  validate: async ({ code, lines, cartId } = {}) => {
    const payload = {
      code: code ? String(code).trim().toUpperCase() : "",
      cart_id: cartId || null,
      lines: Array.isArray(lines) ? lines : [],
    };
    return await api.post("/store/coupons/validate", payload);
  },
};

