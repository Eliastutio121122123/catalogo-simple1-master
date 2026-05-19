import { api } from "./odooClient";

const BASE = "/api/vendor/categories";

const categoryService = {
  /** GET /api/vendor/categories → [{ id, name, fullName, parentId, parentName }] */
  list: () => api.get(BASE),

  /** POST /api/vendor/categories */
  create: (name, parentId = null) =>
    api.post(BASE, { name, parentId }),

  /** PUT /api/vendor/categories/:id */
  update: (id, name, parentId = null) =>
    api.put(`${BASE}/${id}`, { name, parentId }),

  /** DELETE /api/vendor/categories/:id */
  remove: (id) => api.delete(`${BASE}/${id}`),
};

export default categoryService;
