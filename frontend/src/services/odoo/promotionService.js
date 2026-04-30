import { api } from "./odooClient";

class PromotionService {
  constructor(client) {
    this.client = client;
    this.base = "/api/vendor/promotions";
  }

  normalize(payload = {}) {
    const type = payload.type || "percent";
    return {
      name: String(payload.name || "").trim(),
      code: String(payload.code || "").trim().toUpperCase(),
      type: ["percent", "fixed", "shipping"].includes(type) ? type : "percent",
      value: type === "shipping" ? 0 : Number(payload.value) || 0,
      minOrder: payload.minOrder === "" || payload.minOrder == null ? null : Number(payload.minOrder),
      maxDiscount: payload.maxDiscount === "" || payload.maxDiscount == null ? null : Number(payload.maxDiscount),
      appliesTo: payload.appliesTo || "all",
      startDate: payload.startDate || null,
      endDate: payload.endDate || null,
      usageLimit: payload.usageLimit === "" || payload.usageLimit == null ? null : Number(payload.usageLimit),
      status: payload.status === "inactive" ? "inactive" : "active",
      description: String(payload.description || "").trim(),
    };
  }

  async list() {
    return await this.client.get(this.base);
  }

  async getById(id) {
    return await this.client.get(`${this.base}/${id}`);
  }

  async save(payload) {
    const body = this.normalize(payload);
    if (payload?.id) {
      return await this.client.put(`${this.base}/${payload.id}`, body);
    }
    return await this.client.post(this.base, body);
  }

  async delete(id) {
    await this.client.delete(`${this.base}/${id}`);
    return true;
  }

  async toggleStatus(id) {
    return await this.client.patch(`${this.base}/${id}/status`, {});
  }
}

const promotionService = new PromotionService(api);
export default promotionService;
