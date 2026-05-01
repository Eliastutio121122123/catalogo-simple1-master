import { api } from "./odooClient";

const EXTRA_PROFILE_KEY = "catalogix_customer_profile_extra_v1";

const statusMap = {
  draft: "processing",
  sent: "processing",
  sale: "shipped",
  done: "delivered",
  cancel: "cancelled",
};

const REF_OVERRIDES = new Set(["processing", "shipped", "delivered", "cancelled"]);

function mapOrderStatus(state, clientRef) {
  // Vendor stores explicit status in client_order_ref — trust it over Odoo state
  const ref = String(clientRef || "").toLowerCase().trim();
  if (REF_OVERRIDES.has(ref)) return ref;
  return statusMap[String(state || "").toLowerCase()] || "processing";
}

function normalizeDate(rawDate) {
  if (!rawDate) return null;
  const str = String(rawDate);
  return str.length >= 10 ? str.slice(0, 10) : str;
}

function extractPartnerId(partnerValue) {
  if (Array.isArray(partnerValue) && partnerValue.length) return Number(partnerValue[0]) || null;
  if (typeof partnerValue === "number") return partnerValue;
  return null;
}

function loadExtraProfile() {
  try {
    const raw = localStorage.getItem(EXTRA_PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveExtraProfile(extra) {
  localStorage.setItem(EXTRA_PROFILE_KEY, JSON.stringify(extra || {}));
}

function notifyProfileUpdate() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("catalogix:profile-updated"));
  } catch {
    // no-op
  }
}

function fullNameToParts(name) {
  const clean = String(name || "").trim();
  if (!clean) return { firstName: "", lastName: "" };
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function partsToFullName(firstName, lastName) {
  return [String(firstName || "").trim(), String(lastName || "").trim()].filter(Boolean).join(" ").trim();
}

function normalizeAvatarUrl(raw) {
  if (!raw) return "";
  const value = String(raw).trim();
  if (!value || value === "false" || value === "null" || value === "undefined") return "";
  if (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://") || value.startsWith("blob:")) {
    return value;
  }
  return "";
}

function mapOrderRow(raw) {
  const status = mapOrderStatus(raw.state, raw.client_order_ref);
  return {
    id: Number(raw.id),
    code: raw.name || `SO-${raw.id}`,
    date: normalizeDate(raw.date_order),
    status,
    total: Number(raw.amount_total || 0),
    items: Array.isArray(raw.order_line) ? raw.order_line.length : 0,
    payment: "card",
    rawState: raw.state,
    clientRef: raw.client_order_ref || "",
  };
}

function buildTrackingEvents(order) {
  const baseDate = order?.date ? new Date(`${order.date}T08:00:00`) : new Date();
  const mk = (hours, title, detail) => ({
    at: new Date(baseDate.getTime() + hours * 60 * 60 * 1000).toISOString(),
    title,
    detail,
  });

  const events = [
    mk(0, "Pedido confirmado", "Recibimos tu orden y quedo registrada."),
    mk(2, "En preparacion", "El equipo de almacen esta preparando tu pedido."),
  ];

  if (order.status === "shipped" || order.status === "delivered") {
    events.push(mk(8, "Entregado a transportista", "Tu pedido ya fue entregado al courier."));
  }
  if (order.status === "delivered") {
    events.push(mk(24, "Pedido entregado", "El pedido fue entregado exitosamente."));
  }
  if (order.status === "cancelled") {
    events.push(mk(4, "Pedido cancelado", "La orden fue cancelada y no se despachara."));
  }
  return events;
}

const customerPortalService = {
  getProfile: async () => {
    const me = await api.get("/api/users/me");
    const extra = loadExtraProfile();
    const { firstName, lastName } = fullNameToParts(me.name);
    const avatarFromOdoo = me.image_128 ? `data:image/png;base64,${me.image_128}` : "";
    const fallbackAvatar = normalizeAvatarUrl(extra.avatarUrl);
    if (extra.avatarUrl && !fallbackAvatar) {
      const { avatarUrl: _drop, ...rest } = extra;
      saveExtraProfile(rest);
    }

    return {
      uid: Number(me.id),
      firstName,
      lastName,
      fullName: me.name || "",
      email: me.email || me.login || "",
      phone: me.phone || "",
      partnerId: extractPartnerId(me.partner_id),
      role: me.role || "customer",
      avatarUrl: avatarFromOdoo || fallbackAvatar,
      company: extra.company || "",
      documentId: extra.documentId || "",
      birthDate: extra.birthDate || "",
      country: extra.country || "DO",
      city: extra.city || "Santo Domingo",
      address: extra.address || "",
      newsletter: extra.newsletter ?? true,
    };
  },

  updateProfile: async (form) => {
    const payload = {
      name: partsToFullName(form.firstName, form.lastName),
      email: String(form.email || "").trim(),
      phone: String(form.phone || "").trim(),
    };
    await api.put("/api/users/me", payload);

    saveExtraProfile({
      company: form.company || "",
      documentId: form.documentId || "",
      birthDate: form.birthDate || "",
      country: form.country || "DO",
      city: form.city || "",
      address: form.address || "",
      newsletter: !!form.newsletter,
    });

    notifyProfileUpdate();
    return customerPortalService.getProfile();
  },

  updateAvatar: async (avatarUrl) => {
    await api.put("/api/users/me", { avatar: avatarUrl || "" });
    notifyProfileUpdate();
    return customerPortalService.getProfile();
  },

  listOrders: async (partnerId = null) => {
    let pid = partnerId;
    if (!pid) {
      const profile = await customerPortalService.getProfile();
      pid = profile.partnerId;
    }
    if (!pid) return [];
    const rows = await api.get(`/api/orders/partner/${pid}`);
    return (Array.isArray(rows) ? rows : []).map(mapOrderRow).sort((a, b) => b.id - a.id);
  },

  getOrder: async (orderId) => {
    const raw = await api.get(`/api/orders/${orderId}`);
    const base = mapOrderRow(raw);
    const lines = Array.isArray(raw.lines) ? raw.lines : [];
    const items = lines.map((line) => {
      const product = Array.isArray(line.product_id) ? line.product_id : [line.product_id, `Producto ${line.product_id}`];
      return {
        id: Number(line.id),
        sku: `PRD-${String(product[0] || "0").padStart(3, "0")}`,
        productId: Number(product[0] || 0),
        name: product[1] || "Producto",
        qty: Number(line.product_uom_qty || 0),
        price: Number(line.price_unit || 0),
        subtotal: Number(line.price_subtotal || 0),
        imageUrl: line.image_url || "",
      };
    });

    const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);

    return {
      ...base,
      shipping: 0,
      taxes: Math.max(0, Number(base.total) - subtotal),
      subtotal,
      payment: "card",
      shippingAddress: "Direccion del cliente",
      items,
      tracking: {
        carrier: base.status === "processing" ? "Pendiente" : "Catalogix Express",
        trackingCode: `TRK-${base.id}`,
        eta: base.date,
        events: buildTrackingEvents(base),
      },
    };
  },

  listInvoices: async () => {
    const orders = await customerPortalService.listOrders();
    return orders.map((o) => {
      const due = o.date ? new Date(`${o.date}T00:00:00`) : new Date();
      due.setDate(due.getDate() + 7);
      let status = "pending";
      if (o.status === "delivered") status = "paid";
      if (o.status === "cancelled") status = "overdue";
      return {
        id: `INV-${String(o.id).padStart(6, "0")}`,
        orderId: o.id,
        orderRef: o.code,
        date: o.date,
        dueDate: due.toISOString().slice(0, 10),
        total: o.total,
        status,
      };
    });
  },

  listNotifications: async (partnerId = null) => {
    const orders = await customerPortalService.listOrders(partnerId);
    const notifications = [];
    for (const o of orders.slice(0, 30)) {
      notifications.push({
        id: `order-${o.id}`,
        title: `Actualizacion de ${o.code}`,
        body:
          o.status === "delivered"
            ? "Tu pedido fue entregado correctamente."
            : o.status === "shipped"
              ? "Tu pedido esta en camino."
              : o.status === "cancelled"
                ? "Tu pedido fue cancelado."
                : "Tu pedido esta en preparacion.",
        type: "order",
        read: o.status === "delivered",
        createdAt: `${o.date || new Date().toISOString().slice(0, 10)}T09:00:00Z`,
      });
    }
    return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const me = await api.get("/api/users/me");
    const email = me.email || me.login;
    if (!email) throw new Error("No se pudo identificar el usuario actual.");
    await api.post("/api/auth/login", { email, password: currentPassword });
    await api.put("/api/users/me", { password: newPassword });
    return true;
  },
};

export default customerPortalService;
