import { api } from "./odooClient";

class VendorOrderService {
  buildQuery(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      qs.append(key, String(value));
    });
    const query = qs.toString();
    return query ? `?${query}` : "";
  }

  list(params) {
    return api.get(`/api/vendor/orders${this.buildQuery(params)}`);
  }

  get(orderId) {
    return api.get(`/api/vendor/orders/${orderId}`);
  }

  update(orderId, payload) {
    return api.put(`/api/vendor/orders/${orderId}`, payload);
  }

  notify(orderId, payload = {}) {
    return api.post(`/api/vendor/orders/${orderId}/notify`, payload);
  }
}

export const vendorOrderService = new VendorOrderService();

