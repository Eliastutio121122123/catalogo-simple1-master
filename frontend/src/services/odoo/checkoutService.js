import { storeService } from "./storeService";

class CheckoutItemRefresher {
  constructor(storeSvc) {
    this.storeSvc = storeSvc;
  }

  async refresh(items) {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return list;

    const ids = Array.from(
      new Set(list.map((i) => Number(i.productId || i.id || 0)).filter((id) => id > 0))
    );
    const rows = await Promise.all(
      ids.map((id) =>
        this.storeSvc
          .getProduct(id)
          .then((row) => [id, row])
          .catch(() => [id, null])
      )
    );
    const map = new Map(rows);

      return list.map((item) => {
        const id = Number(item.productId || item.id || 0);
        const row = map.get(id);
        if (!row) return item;
        const catalog = Array.isArray(row.catalog_id) ? row.catalog_id[1] : row.catalog_id || item.catalog || "";
        const currency = Array.isArray(row.currency_id) ? row.currency_id[1] : (row.currency_id || item.currency || "DOP");
        return {
          ...item,
          name: row.name || item.name,
          catalog,
          imageUrl: row.image_url || item.imageUrl || "",
          price: Number(row.list_price || item.price || 0),
          currency: String(currency || "DOP").toUpperCase(),
          vendor: row.vendor || item.vendor || null,
        };
      });
  }
}

export const checkoutService = new CheckoutItemRefresher(storeService);
