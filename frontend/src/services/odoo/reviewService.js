import { api } from "./odooClient";

class ReviewService {
  async list(productId) {
    return await api.get(`/store/products/${productId}/reviews`);
  }

  async create(productId, payload) {
    return await api.post(`/store/products/${productId}/reviews`, payload);
  }
}

export const reviewService = new ReviewService();
