import { api } from "./odooClient";

function extractPartnerId(partnerValue) {
  if (Array.isArray(partnerValue) && partnerValue.length) return Number(partnerValue[0]) || null;
  if (typeof partnerValue === "number") return partnerValue;
  return null;
}

function planFromStatus(status) {
  const key = String(status || "").toLowerCase();
  if (key === "active") return "Plan Pro";
  if (key === "pending") return "Pendiente";
  if (key === "suspended") return "Suspendido";
  return "Vendedor";
}

const vendorProfileService = {
  getProfile: async () => {
    const data = await api.get("/api/vendor/profile");
    const user = data?.user || {};
    const vendor = data?.vendor || {};
    const avatarUrl = user?.image_128 ? `data:image/png;base64,${user.image_128}` : "";

    const storeName = vendor.store_name || user.name || "Vendedor";
    const email = vendor.email || user.email || user.login || "";
    const phone = vendor.phone || user.phone || "";
    const status = vendor.status || "active";

    return {
      uid: Number(user.id || 0),
      vendorId: vendor.id ? Number(vendor.id) : null,
      partnerId: extractPartnerId(vendor.partner_id || user.partner_id),
      name: user.name || storeName,
      storeName,
      email,
      phone,
      status,
      role: user.role || "vendor",
      plan: planFromStatus(status),
      avatarUrl,
    };
  },

  updateProfile: async (payload) => {
    const data = await api.patch("/api/vendor/profile", payload);
    const user = data?.user || {};
    const vendor = data?.vendor || {};
    const storeName = vendor.store_name || user.name || "Vendedor";
    const email = vendor.email || user.email || user.login || "";
    const phone = vendor.phone || user.phone || "";
    const status = vendor.status || "active";
    const avatarUrl = user?.image_128 ? `data:image/png;base64,${user.image_128}` : "";

    return {
      uid: Number(user.id || 0),
      vendorId: vendor.id ? Number(vendor.id) : null,
      partnerId: extractPartnerId(vendor.partner_id || user.partner_id),
      name: user.name || storeName,
      storeName,
      email,
      phone,
      status,
      role: user.role || "vendor",
      plan: planFromStatus(status),
      avatarUrl,
    };
  },
};

export default vendorProfileService;
