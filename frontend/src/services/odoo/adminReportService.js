import { api } from "./odooClient";

class AdminReportService {
  constructor(client) {
    this.client = client;
    this.base = "/api/admin/reports";
  }

  async list() {
    const rows = await this.client.get(this.base);
    return Array.isArray(rows) ? rows : [];
  }
}

const adminReportService = new AdminReportService(api);
export default adminReportService;

