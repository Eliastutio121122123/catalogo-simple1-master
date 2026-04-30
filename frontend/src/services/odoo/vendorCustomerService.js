import { api } from "./odooClient";

const VIP_MIN_TOTAL = 20000;
const VIP_MIN_ORDERS = 5;

function deriveSegment({ order_count = 0, total_spent = 0 } = {}) {
  if (order_count <= 1) return "new";
  if (order_count >= VIP_MIN_ORDERS || total_spent >= VIP_MIN_TOTAL) return "vip";
  return "regular";
}

function normalize(customer) {
  if (!customer) return null;
  const orders = Number(customer.order_count || customer.orders || 0);
  const totalSpent = Number(customer.total_spent || customer.totalSpent || 0);
  const lastOrderAt = customer.last_order_date || customer.lastOrderAt || null;
  const status = customer.status || "active";
  const segment = customer.segment || deriveSegment({ order_count: orders, total_spent: totalSpent });

  return {
    id: customer.id,
    name: customer.name || "-",
    email: customer.email || "",
    phone: customer.phone || "",
    city: customer.city || customer.company_name || "",
    orders,
    totalSpent,
    lastOrderAt,
    status,
    segment,
  };
}

const vendorCustomerService = {
  list: async (params = {}) => {
    const { limit = 50, offset = 0, q = "" } = params;
    const qs = new URLSearchParams();
    qs.set("limit", limit);
    qs.set("offset", offset);
    if (q) qs.set("q", q);
    const rows = await api.get(`/api/vendor/customers?${qs.toString()}`);
    return Array.isArray(rows) ? rows.map(normalize) : [];
  },

  getById: async (id) => {
    const row = await api.get(`/api/vendor/customers/${id}`);
    return normalize(row);
  },

  // Placeholder actions: backend doesn't support these yet.
  toggleBlocked: async () => {
    throw new Error("Acción no disponible aún.");
  },

  toggleVip: async () => {
    throw new Error("Acción no disponible aún.");
  },
};

export default vendorCustomerService;
