import { api } from "./odooClient";

function productRisk(stock, minStock) {
  const qty = Number(stock) || 0;
  const min = Number(minStock) || 0;
  if (qty <= 0) return "out";
  if (qty <= min) return "low";
  return "ok";
}

const inventoryService = {
  listProducts: async () => {
    const rows = await api.get("/api/vendor/inventory");
    return Array.isArray(rows)
      ? rows.map((p) => ({
          ...p,
          risk: p.risk || productRisk(p.stock, p.minStock),
          updatedAt: p.updatedAt || null,
        }))
      : [];
  },

  getProductById: async (productId) => {
    const rows = await api.get("/api/vendor/inventory");
    if (!Array.isArray(rows)) return null;
    return rows.find(p => String(p.id) === String(productId)) || null;
  },

  listMovements: async () => {
    const rows = await api.get("/api/vendor/inventory/movements");
    return Array.isArray(rows) ? rows : [];
  },

  adjustStock: async ({
    productId,
    type,
    quantity,
    note = "",
    reference = "",
    user = "Vendedor",
  }) => {
    const payload = {
      product_id: productId,
      type,
      quantity,
      note,
      reference,
      user,
    };
    return api.post("/api/vendor/inventory/movements", payload);
  },
};

export default inventoryService;
