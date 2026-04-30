const STORAGE_KEY = "catalogix_vendor_customers_v1";

const DEFAULT_CUSTOMERS = [
  {
    id: 1,
    name: "Camila Herrera",
    email: "camila.herrera@gmail.com",
    phone: "+1 809-555-1021",
    city: "Santo Domingo",
    orders: 8,
    totalSpent: 28650,
    lastOrderAt: "2026-03-01T16:30:00Z",
    status: "active",
    segment: "vip",
  },
  {
    id: 2,
    name: "Luis Perez",
    email: "lperez@outlook.com",
    phone: "+1 829-555-8712",
    city: "Santiago",
    orders: 3,
    totalSpent: 6420,
    lastOrderAt: "2026-02-25T12:05:00Z",
    status: "active",
    segment: "regular",
  },
  {
    id: 3,
    name: "Paola Urena",
    email: "paola.u@gmail.com",
    phone: "+1 849-555-3341",
    city: "La Romana",
    orders: 1,
    totalSpent: 1550,
    lastOrderAt: "2026-02-12T09:15:00Z",
    status: "active",
    segment: "new",
  },
  {
    id: 4,
    name: "Andres Mateo",
    email: "andresm@gmail.com",
    phone: "+1 829-555-6658",
    city: "Santo Domingo",
    orders: 2,
    totalSpent: 2100,
    lastOrderAt: "2025-12-04T18:40:00Z",
    status: "blocked",
    segment: "regular",
  },
  {
    id: 5,
    name: "Yolanda Acosta",
    email: "yolanda.acosta@gmail.com",
    phone: "+1 809-555-2244",
    city: "Puerto Plata",
    orders: 14,
    totalSpent: 48990,
    lastOrderAt: "2026-03-02T11:20:00Z",
    status: "active",
    segment: "vip",
  },
  {
    id: 6,
    name: "Brayan Cruz",
    email: "brayanc@icloud.com",
    phone: "+1 849-555-9910",
    city: "San Cristobal",
    orders: 4,
    totalSpent: 7125,
    lastOrderAt: "2026-02-20T15:50:00Z",
    status: "active",
    segment: "regular",
  },
];

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CUSTOMERS));
      return [...DEFAULT_CUSTOMERS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_CUSTOMERS];
  } catch {
    return [...DEFAULT_CUSTOMERS];
  }
}

function writeStore(customers) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

const customerService = {
  list: async () => {
    const customers = readStore();
    return [...customers].sort((a, b) => new Date(b.lastOrderAt) - new Date(a.lastOrderAt));
  },

  getById: async (id) => {
    const customers = await customerService.list();
    return customers.find(c => String(c.id) === String(id)) || null;
  },

  toggleBlocked: async (id) => {
    const customers = readStore().map((c) => {
      if (String(c.id) !== String(id)) return c;
      return { ...c, status: c.status === "blocked" ? "active" : "blocked" };
    });
    writeStore(customers);
    return customers.find(c => String(c.id) === String(id)) || null;
  },

  toggleVip: async (id) => {
    const customers = readStore().map((c) => {
      if (String(c.id) !== String(id)) return c;
      return { ...c, segment: c.segment === "vip" ? "regular" : "vip" };
    });
    writeStore(customers);
    return customers.find(c => String(c.id) === String(id)) || null;
  },
};

export default customerService;
