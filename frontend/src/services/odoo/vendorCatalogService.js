import { api } from "./odooClient";

class VendorCatalogService {
  constructor(client) {
    this.client = client;
    this.base = "/api/vendor/catalogs";
  }

  list() {
    return this.client.get(this.base);
  }

  get(id) {
    return this.client.get(`${this.base}/${id}`);
  }

  create(payload) {
    return this.client.post(this.base, payload);
  }

  update(id, payload) {
    return this.client.put(`${this.base}/${id}`, payload);
  }

  patch(id, payload) {
    return this.client.patch(`${this.base}/${id}`, payload);
  }

  remove(id) {
    return this.client.delete(`${this.base}/${id}`);
  }
}

export const vendorCatalogService = new VendorCatalogService(api);
