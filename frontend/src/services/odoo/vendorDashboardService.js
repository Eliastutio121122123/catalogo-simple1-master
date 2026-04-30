import { api } from "./odooClient";

class VendorDashboardService {
  constructor(client) {
    this.client = client;
    this.base = "/api/vendor/dashboard";
  }

  async getDashboard(period = "mes") {
    const qs = new URLSearchParams();
    if (period) qs.set("period", period);
    const endpoint = qs.toString() ? `${this.base}?${qs.toString()}` : this.base;
    return await this.client.get(endpoint);
  }
}

const vendorDashboardService = new VendorDashboardService(api);
export default vendorDashboardService;
