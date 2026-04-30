import { api } from "./odooClient";

class AdminVendorsService {
  constructor(client) {
    this.client = client;
    this.base = "/api/admin/vendors";
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
}

const adminVendorsService = new AdminVendorsService(api);
export default adminVendorsService;
