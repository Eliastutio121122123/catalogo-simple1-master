import { api } from "./odooClient";

class StoreService {
  constructor(client) {
    this.client = client;
  }

  buildQuery(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      qs.append(key, String(value));
    });
    const query = qs.toString();
    return query ? `?${query}` : "";
  }

  listCatalogs(params) {
    return this.client.get(`/store/catalogs${this.buildQuery(params)}`);
  }

  getHome(params) {
    return this.client.get(`/store/home${this.buildQuery(params)}`);
  }

  listCategories(params) {
    return this.client.get(`/store/categories${this.buildQuery(params)}`);
  }

  getStats() {
    return this.client.get("/store/stats");
  }

  getCatalog(slugOrId) {
    return this.client.get(`/store/catalogs/${slugOrId}`);
  }

  listProducts(params) {
    return this.client.get(`/store/products${this.buildQuery(params)}`);
  }

  getProduct(id) {
    return this.client.get(`/store/products/${id}`);
  }
}

export const storeService = new StoreService(api);
