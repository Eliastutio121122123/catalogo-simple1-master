import { api } from "./odooClient";

class NotificationService {
  constructor(client) {
    this.client = client;
    this.base = "/api/vendor/notifications";
  }

  async list() {
    const rows = await this.client.get(this.base);
    return Array.isArray(rows) ? rows : [];
  }

  async markRead(id) {
    if (!id && id !== 0) return null;
    return await this.client.patch(`${this.base}/${id}/read`);
  }

  async markAllRead() {
    await this.client.patch(`${this.base}/read-all`);
    return true;
  }

  async delete(id) {
    if (!id && id !== 0) return false;
    await this.client.delete(`${this.base}/${id}`);
    return true;
  }
}

const notificationService = new NotificationService(api);
export default notificationService;
