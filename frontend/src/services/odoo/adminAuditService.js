import { api } from "./odooClient";

class AdminAuditService {
  constructor(client) {
    this.client = client;
    this.base = "/api/admin/audit";
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

  async create(payload) {
    return await this.client.post(this.base, payload);
  }
}

const adminAuditService = new AdminAuditService(api);
export default adminAuditService;
