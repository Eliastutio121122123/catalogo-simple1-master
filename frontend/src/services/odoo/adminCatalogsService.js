import { api } from "./odooClient";

class AdminCatalogsService {
  constructor(client) {
    this.client = client;
    this.base = "/api/admin/catalogs";
  }

  async list(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "" || value === "all") return;
      qs.set(key, String(value));
    });
    const endpoint = qs.toString() ? `${this.base}?${qs.toString()}` : this.base;
    return await this.client.get(endpoint);
  }

  async get(catalogId) {
    return await this.client.get(`${this.base}/${catalogId}`);
  }

  async update(catalogId, data) {
    return await this.client.put(`${this.base}/${catalogId}`, data);
  }
}

const adminCatalogsService = new AdminCatalogsService(api);
export default adminCatalogsService;
