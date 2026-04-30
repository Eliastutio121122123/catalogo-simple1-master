import { api } from "./odooClient";

class VendorReportService {
  constructor(client) {
    this.client = client;
  }

  async getReport(range = "7d") {
    const qs = new URLSearchParams();
    if (range) qs.set("range", range);
    return await this.client.get(`/api/vendor/reports?${qs.toString()}`);
  }
}

export const vendorReportService = new VendorReportService(api);
