import { useEffect, useMemo, useState } from "react";
import vendorCustomerService from "../../services/odoo/vendorCustomerService";
import { downloadBrandedExcel } from "../../utils/brandedExcel";
import { printTablePdf } from "../../utils/tablePdf";

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
};

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [segment, setSegment] = useState("all");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await vendorCustomerService.list();
      setRows(data);
    } catch (err) {
      setRows([]);
      setError(err?.message || "No se pudieron cargar los clientes.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((c) => {
      const q = query.trim().toLowerCase();
      if (q) {
        const match =
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (status !== "all" && c.status !== status) return false;
      if (segment !== "all" && c.segment !== segment) return false;
      return true;
    });
  }, [rows, query, status, segment]);

  const exportColumns = useMemo(() => {
    const statusLabel = (s) => (s === "active" ? "Activo" : s === "blocked" ? "Bloqueado" : s || "-");
    const segmentLabel = (s) => (s === "vip" ? "VIP" : s === "regular" ? "Regular" : s === "new" ? "Nuevo" : s || "-");
    return [
      { key: "id", label: "ID", className: "td num" },
      { key: "name", label: "Cliente" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Telefono" },
      { key: "city", label: "Ciudad" },
      { key: "orders", label: "Pedidos", className: "td num" },
      { key: "totalSpent", label: "Total", className: "td num", format: (_, row) => fmtMoney(row.totalSpent) },
      { key: "lastOrderAt", label: "Ultima compra", format: (_, row) => fmtDate(row.lastOrderAt) },
      { key: "status", label: "Estado", format: (_, row) => statusLabel(row.status) },
      { key: "segment", label: "Segmento", format: (_, row) => segmentLabel(row.segment) },
    ];
  }, []);

  const exportExcel = () => {
    if (!filtered.length) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadBrandedExcel({
      filename: `clientes_${date}.xls`,
      sheetName: "Clientes",
      reportTitle: "Reporte de Clientes",
      columns: exportColumns,
      rows: filtered,
    });
  };

  const exportPdf = async () => {
    if (!filtered.length) return;
    const date = new Date().toISOString().slice(0, 10);
    await printTablePdf({
      filename: `clientes_${date}.pdf`,
      title: "Clientes",
      subtitle: `${filtered.length} clientes · ${date}`,
      columns: exportColumns,
      rows: filtered,
      brandName: "Catalogix",
      kpis: [
        { label: "Total clientes",   value: String(rows.length)            },
        { label: "Activos",          value: String(stats.active)           },
        { label: "VIP",              value: String(stats.vip)              },
        { label: "Venta acumulada",  value: fmtMoney(stats.total)         },
      ],
    });
  };

  const stats = useMemo(() => {
    const active = rows.filter(r => r.status === "active").length;
    const blocked = rows.filter(r => r.status === "blocked").length;
    const vip = rows.filter(r => r.segment === "vip").length;
    const total = rows.reduce((acc, c) => acc + (Number(c.totalSpent) || 0), 0);
    return { active, blocked, vip, total };
  }, [rows]);

  const handleToggleBlocked = async (id) => {
    try {
      await vendorCustomerService.toggleBlocked(id);
      await load();
      if (selected && String(selected.id) === String(id)) {
        const updated = await vendorCustomerService.getById(id);
        setSelected(updated);
      }
    } catch (err) {
      setError(err?.message || "No se pudo actualizar el estado.");
    }
  };

  const handleToggleVip = async (id) => {
    try {
      await vendorCustomerService.toggleVip(id);
      await load();
      if (selected && String(selected.id) === String(id)) {
        const updated = await vendorCustomerService.getById(id);
        setSelected(updated);
      }
    } catch (err) {
      setError(err?.message || "No se pudo actualizar el segmento.");
    }
  };

  return (
    <>
      <style>{`
        .cu{display:flex;flex-direction:column;gap:14px}
        .cu-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .cu-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .cu-sub{font-size:12.5px;color:var(--vs-500)}
        .cu-btn{padding:9px 14px;border-radius:10px;border:1.5px solid var(--vs-200);background:var(--vw);cursor:pointer;font-size:13px;font-weight:700;color:var(--vs-700)}
        .cu-btn:disabled{opacity:.55;cursor:not-allowed}
        .cu-btn.pri{background:linear-gradient(135deg,var(--vt-700),var(--vt-500));border:none;color:#fff}
        .cu-k{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        @media(max-width:900px){.cu-k{grid-template-columns:repeat(2,1fr)}}
        .cu-ki{background:#fff;border:1px solid var(--vs-200);border-radius:13px;padding:12px}
        .cu-kn{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--vs-900)}
        .cu-kl{font-size:12px;color:var(--vs-500)}
        .cu-bar{display:flex;gap:8px;flex-wrap:wrap}
        .cu-in{padding:9px 12px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;font-size:13px}
        .cu-card{background:#fff;border:1px solid var(--vs-200);border-radius:16px;overflow:hidden}
        .cu-th,.cu-tr{display:grid;grid-template-columns:1.2fr 1fr .5fr .8fr .9fr 1fr;gap:10px;align-items:center;padding:11px 14px}
        .cu-th{background:var(--vs-50);font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase;letter-spacing:.5px}
        .cu-tr{border-top:1px solid var(--vs-100);font-size:13px;color:var(--vs-700)}
        .cu-name{font-weight:700;color:var(--vs-900)}
        .cu-mail{font-size:11px;color:var(--vs-400)}
        .cu-pill{display:inline-flex;padding:4px 8px;border-radius:100px;font-size:11px;font-weight:700}
        .active{background:#f0fdf4;color:#16a34a}.blocked{background:#fef2f2;color:#dc2626}
        .vip{background:#eff6ff;color:#2563eb}.regular{background:#f1f5f9;color:#475569}.new{background:#ecfeff;color:#0891b2}
        .cu-act{display:flex;gap:6px;flex-wrap:wrap}
        .cu-a{padding:5px 8px;border:1px solid var(--vs-200);border-radius:8px;background:#fff;font-size:11px;cursor:pointer}
        .cu-empty{padding:24px;text-align:center;color:var(--vs-400)}
        .cu-ov{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:260;display:flex;align-items:center;justify-content:center;padding:16px}
        .cu-md{width:100%;max-width:460px;background:#fff;border:1px solid var(--vs-200);border-radius:16px;padding:16px}
        .cu-mt{font-family:'Lexend',sans-serif;font-size:16px;font-weight:800;color:var(--vs-900)}
        .cu-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
        .cu-box{padding:10px;border:1px solid var(--vs-200);border-radius:10px;background:var(--vs-50)}
        .cu-bk{font-size:11px;color:var(--vs-500);text-transform:uppercase;font-weight:800}
        .cu-bv{font-size:13px;color:var(--vs-800);font-weight:700;margin-top:3px;word-break:break-word}
      `}</style>

      <div className="cu">
        <div className="cu-h">
          <div>
            <h1 className="cu-title">Clientes</h1>
            <p className="cu-sub">Gestion de base de clientes del vendedor.</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="cu-btn" onClick={exportPdf} disabled={!filtered.length}>Exportar PDF</button>
            <button className="cu-btn" onClick={exportExcel} disabled={!filtered.length}>Exportar Excel</button>
            <button className="cu-btn pri" onClick={load}>Actualizar</button>
          </div>
        </div>

        <div className="cu-k">
          <div className="cu-ki"><div className="cu-kn">{rows.length}</div><div className="cu-kl">Total clientes</div></div>
          <div className="cu-ki"><div className="cu-kn">{stats.active}</div><div className="cu-kl">Activos</div></div>
          <div className="cu-ki"><div className="cu-kn">{stats.vip}</div><div className="cu-kl">VIP</div></div>
          <div className="cu-ki"><div className="cu-kn">{fmtMoney(stats.total)}</div><div className="cu-kl">Venta acumulada</div></div>
        </div>

        <div className="cu-bar">
          <input className="cu-in" style={{ minWidth: 240 }} placeholder="Buscar por nombre, email o telefono..." value={query} onChange={e => setQuery(e.target.value)} />
          <select className="cu-in" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">Estado: Todos</option>
            <option value="active">Activos</option>
            <option value="blocked">Bloqueados</option>
          </select>
          <select className="cu-in" value={segment} onChange={e => setSegment(e.target.value)}>
            <option value="all">Segmento: Todos</option>
            <option value="vip">VIP</option>
            <option value="regular">Regular</option>
            <option value="new">Nuevo</option>
          </select>
        </div>

        {error && <div className="cu-empty" style={{ color: "#dc2626" }}>{error}</div>}

        <div className="cu-card">
          <div className="cu-th">
            <span>Cliente</span><span>Contacto</span><span>Pedidos</span><span>Total</span><span>Estado</span><span>Acciones</span>
          </div>

          {loading && <div className="cu-empty">Cargando clientes...</div>}
          {!loading && filtered.length === 0 && <div className="cu-empty">No hay clientes con ese filtro.</div>}

          {!loading && filtered.map(c => (
            <div key={c.id} className="cu-tr">
              <div>
                <div className="cu-name">{c.name}</div>
                <div className="cu-mail">Ultima compra: {fmtDate(c.lastOrderAt)}</div>
              </div>
              <div>
                <div>{c.email}</div>
                <div className="cu-mail">{c.phone || "-"}</div>
              </div>
              <span style={{ fontWeight: 800 }}>{c.orders}</span>
              <span style={{ fontWeight: 800 }}>{fmtMoney(c.totalSpent)}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className={`cu-pill ${c.status}`}>{c.status === "active" ? "Activo" : "Bloqueado"}</span>
                <span className={`cu-pill ${c.segment}`}>{c.segment === "vip" ? "VIP" : c.segment === "regular" ? "Regular" : "Nuevo"}</span>
              </div>
              <div className="cu-act">
                <button className="cu-a" onClick={() => setSelected(c)}>Ver</button>
                <button className="cu-a" onClick={() => handleToggleVip(c.id)}>{c.segment === "vip" ? "Quitar VIP" : "Hacer VIP"}</button>
                <button className="cu-a" onClick={() => handleToggleBlocked(c.id)}>{c.status === "blocked" ? "Desbloquear" : "Bloquear"}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="cu-ov" onClick={() => setSelected(null)}>
          <div className="cu-md" onClick={(e) => e.stopPropagation()}>
            <div className="cu-mt">Detalle de cliente</div>
            <div className="cu-grid">
              <div className="cu-box"><div className="cu-bk">Nombre</div><div className="cu-bv">{selected.name}</div></div>
              <div className="cu-box"><div className="cu-bk">Ciudad</div><div className="cu-bv">{selected.city || "-"}</div></div>
              <div className="cu-box"><div className="cu-bk">Email</div><div className="cu-bv">{selected.email}</div></div>
              <div className="cu-box"><div className="cu-bk">Telefono</div><div className="cu-bv">{selected.phone || "-"}</div></div>
              <div className="cu-box"><div className="cu-bk">Pedidos</div><div className="cu-bv">{selected.orders}</div></div>
              <div className="cu-box"><div className="cu-bk">Total gastado</div><div className="cu-bv">{fmtMoney(selected.totalSpent)}</div></div>
              <div className="cu-box"><div className="cu-bk">Ultima compra</div><div className="cu-bv">{fmtDate(selected.lastOrderAt)}</div></div>
              <div className="cu-box"><div className="cu-bk">Estado</div><div className="cu-bv">{selected.status === "active" ? "Activo" : "Bloqueado"}</div></div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button className="cu-btn" onClick={() => setSelected(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
