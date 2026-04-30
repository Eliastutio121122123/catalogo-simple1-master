import { api } from "./odooClient";

const pricingService = {
  getSettings: async () => {
    return api.get("/api/vendor/pricing/settings");
  },

  saveSettings: async (payload) => {
    return api.patch("/api/vendor/pricing/settings", payload);
  },

  listRules: async () => {
    return api.get("/api/vendor/pricing/rules");
  },

  saveRule: async (rule) => {
    if (rule?.id) {
      return api.put(`/api/vendor/pricing/rules/${rule.id}`, rule);
    }
    return api.post("/api/vendor/pricing/rules", rule);
  },

  deleteRule: async (id) => {
    return api.delete(`/api/vendor/pricing/rules/${id}`);
  },

  toggleRuleStatus: async (id) => {
    return api.patch(`/api/vendor/pricing/rules/${id}/status`);
  },
};

export default pricingService;
