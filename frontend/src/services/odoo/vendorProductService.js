import { api } from "./odooClient";
import { toImageDataUrl } from "../../utils/imageDataUrl";

function asText(value, fallback = "") {
  if (!value) return fallback;
  if (Array.isArray(value)) return value[1] || fallback;
  return String(value);
}

function normalize(product) {
  if (!product) return null;
  const price = Number(product.list_price || 0);
  const currency = Array.isArray(product.currency_id) ? product.currency_id[1] : (product.currency_id || "DOP");
  const stock = product.catalog_stock_qty != null
    ? Number(product.catalog_stock_qty || 0)
    : Number(product.qty_available || 0);
  const status = product.active === false ? "inactive" : "active";
  const catalog = asText(product.catalog_id, "Sin catalogo");
  const category = asText(product.categ_id, "Sin categoria");
  const sku = product.default_code || `PROD-${product.id}`;
  const imageBase64 = product.image_1920 || (Array.isArray(product.images_base64) ? product.images_base64[0] : "");
  const img = toImageDataUrl(imageBase64) || "📦";

  return {
    id: product.id,
    name: product.name || "-",
    sku,
    catalog,
    category,
    price,
    currency: String(currency || "DOP").toUpperCase(),
    stock,
    sold: Number(product.sold || 0),
    status,
    img,
    clr: "#0ea5e9",
    featured: false,
  };
}

const vendorProductService = {
  list: async (params = {}) => {
    const { limit = 50, offset = 0, q = "", category = "", min_price = "", max_price = "" } = params;
    const qs = new URLSearchParams();
    qs.set("limit", limit);
    qs.set("offset", offset);
    if (q) qs.set("q", q);
    if (category) qs.set("category", category);
    if (min_price) qs.set("min_price", min_price);
    if (max_price) qs.set("max_price", max_price);
    const endpoint = `/api/vendor/products?${qs.toString()}`;
    const rows = await api.get(endpoint);
    return Array.isArray(rows) ? rows.map(normalize) : [];
  },

  getById: async (id) => {
    return api.get(`/api/vendor/products/${id}`);
  },

  create: async (payload) => {
    return api.post("/api/vendor/products", payload);
  },

  update: async (id, payload) => {
    return api.put(`/api/vendor/products/${id}`, payload);
  },

  remove: async (id) => {
    return api.delete(`/api/vendor/products/${id}`);
  },
};

export default vendorProductService;
