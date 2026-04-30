import { api } from "./odooClient";

class CouponService {
  constructor(client) {
    this.client = client;
    this.base = "/api/vendor/coupons";
  }

  async list() {
    const rows = await this.client.get(this.base);
    return Array.isArray(rows) ? rows : [];
  }

  async getById(id) {
    if (!id && id !== 0) return null;
    return await this.client.get(`${this.base}/${id}`);
  }

  async save(payload) {
    if (payload?.id) {
      return await this.client.put(`${this.base}/${payload.id}`, payload);
    }
    return await this.client.post(this.base, payload);
  }

  async delete(id) {
    if (!id && id !== 0) return false;
    await this.client.delete(`${this.base}/${id}`);
    return true;
  }

  async toggleStatus(id) {
    if (!id && id !== 0) return null;
    return await this.client.patch(`${this.base}/${id}/status`);
  }

  async duplicate(id) {
    if (!id && id !== 0) return null;
    return await this.client.post(`${this.base}/${id}/duplicate`);
  }
}

const couponService = new CouponService(api);
export default couponService;
