import { api } from "./odooClient";

class PaymentLineAdapter {
  toLines(items) {
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => ({
        product_id: Number(item.productId || item.id || 0),
        qty: Number(item.qty || 0),
        price: Number(item.price || 0),
      }))
      .filter((line) => line.product_id > 0 && line.qty > 0);
  }
}

class PaymentPayloadBuilder {
  constructor(lineAdapter) {
    this.lineAdapter = lineAdapter;
  }

  build({ items, method, delivery, card, cartId, couponCode }) {
    return {
      method: method || "stripe",
      lines: this.lineAdapter.toLines(items),
      delivery: delivery || {},
      cart_id: cartId || null,
      card_last4: this._last4(card),
      coupon_code: couponCode ? String(couponCode).trim().toUpperCase() : null,
    };
  }

  _last4(card) {
    if (!card || !card.number) return "";
    const digits = String(card.number).replace(/\D/g, "");
    return digits.slice(-4);
  }
}

class PaymentService {
  constructor(client, builder) {
    this.client = client;
    this.builder = builder;
  }

  async checkout(payload) {
    return await this.client.post("/api/payments/checkout", payload);
  }
}

const lineAdapter = new PaymentLineAdapter();
const payloadBuilder = new PaymentPayloadBuilder(lineAdapter);
export const paymentService = new PaymentService(api, payloadBuilder);
export { payloadBuilder as paymentPayloadBuilder };
