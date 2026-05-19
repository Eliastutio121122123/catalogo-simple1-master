import { api } from "./odooClient";
import { storeService } from "./storeService";

class CartAdapter {
  toLines(items) {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => ({
        product_id: Number(item.productId || item.id || 0),
        qty: Number(item.qty || 0),
        price: Number(item.price || 0),
      }))
      .filter((line) => line.product_id > 0 && line.qty > 0);
  }

  fromCart(cart) {
    const lines = Array.isArray(cart?.lines) ? cart.lines : [];
    return lines.map((line) => {
      const pair = line.product_id || [];
      const productId = Array.isArray(pair) ? pair[0] : pair;
      const name = Array.isArray(pair) ? pair[1] : "Producto";
      return {
        id: productId,
        productId,
        lineId: line.id,
        name,
        qty: Number(line.product_uom_qty || 0),
        price: Number(line.price_unit || 0),
      };
    });
  }
}

class CartHydrator {
  constructor(storeSvc) {
    this.storeSvc = storeSvc;
  }

  async hydrate(items) {
    if (!Array.isArray(items) || items.length === 0) return items || [];
    const ids = Array.from(new Set(items.map((i) => i.productId || i.id).filter(Boolean)));
    const rows = await Promise.all(
      ids.map((id) =>
        this.storeSvc
          .getProduct(id)
          .then((row) => [id, row])
          .catch(() => [id, null])
      )
    );
    const map = new Map(rows);
    return items.map((item) => {
      const row = map.get(item.productId || item.id);
      if (!row) return item;
      const catalog = Array.isArray(row.catalog_id) ? row.catalog_id[1] : row.catalog_id || "";
      const category = Array.isArray(row.categ_id) ? row.categ_id[1] : "General";
      const currency = Array.isArray(row.currency_id) ? row.currency_id[1] : (row.currency_id || item.currency || "DOP");
      return {
        ...item,
        name: row.name || item.name,
        catalog,
        category,
        imageUrl: row.image_url || item.imageUrl || "",
        price: Number(row.list_price || item.price || 0),
        currency: String(currency || "DOP").toUpperCase(),
        vendor: row.vendor || item.vendor || null,
      };
    });
  }
}

class CartService {
  constructor(client, adapter, hydrator) {
    this.client = client;
    this.adapter = adapter;
    this.hydrator = hydrator;
  }

  async getCart() {
    return await this.client.get("/store/cart");
  }

  async saveCart(items, cartId) {
    const lines = this.adapter.toLines(items);
    return await this.client.post("/store/cart", { lines, cart_id: cartId });
  }

  async saveDelivery(delivery, cartId) {
    return await this.client.post("/store/delivery", {
      cart_id: cartId || null,
      delivery: delivery || {},
    });
  }

  async loadHydratedCart() {
    const data = await this.getCart();
    const cart = data?.cart || null;
    if (!cart) return { cartId: null, items: [] };
    const items = this.adapter.fromCart(cart);
    const hydrated = await this.hydrator.hydrate(items);
    return { cartId: cart.id, items: hydrated };
  }
}

export const cartService = new CartService(api, new CartAdapter(), new CartHydrator(storeService));
