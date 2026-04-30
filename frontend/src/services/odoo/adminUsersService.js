import { api } from "./odooClient";

class AdminUsersService {
  constructor(client) {
    this.client = client;
    this.base = "/api/admin/users";
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

const adminUsersService = new AdminUsersService(api);
export default adminUsersService;
