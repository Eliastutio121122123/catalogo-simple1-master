import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import inventoryService from "../../services/odoo/inventoryService";
import { downloadBrandedExcel } from "../../utils/brandedExcel";
import { printTablePdf } from "../../utils/tablePdf";

const fmtDT = (iso) => new Date(iso).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Inventory() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("all");
  const [catalog, setCatalog] = useState("all");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // {id,name,mode}
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [ref, setRef] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const data = await inventoryService.listProducts();
    setRows(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const catalogs = useMemo(
    () => ["all", ...Array.from(new Set(rows.map(r => r.catalog))).sort()],
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.trim().toLowerCase();
      if (q && !r.name.toLowerCase().includes(q) && !r.sku.toLowerCase().includes(q)) return false;
      if (risk !== "all" && r.risk !== risk) return false;
      if (catalog !== "all" && r.catalog !== catalog) return false;
      return true;
    });
  }, [rows, query, risk, catalog]);

  const stats = useMemo(() => {
    const totalUnits = rows.reduce((acc, r) => acc + (Number(r.stock) || 0), 0);
    return {
      products: rows.length,
      low: rows.filter(r => r.risk === "low").length,
      out: rows.filter(r => r.risk === "out").length,
      units: totalUnits,
    };
  }, [rows]);

  const exportColumns = useMemo(() => {
    const riskLabel = (r) => (r === "ok" ? "En stock" : r === "low" ? "Bajo" : r === "out" ? "Agotado" : r || "-");
    const fmtSafe = (iso) => {
      if (!iso) return "";
      const d = new Date(String(iso).replace(" ", "T"));
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    };
    return [
      { key: "id", label: "ID", className: "td num" },
      { key: "name", label: "Producto" },
      { key: "sku", label: "SKU" },
      { key: "catalog", label: "Catalogo" },
      { key: "category", label: "Categoria" },
      { key: "stock", label: "Stock", className: "td num" },
      { key: "minStock", label: "Minimo", className: "td num" },
      { key: "risk", label: "Riesgo", format: (_, row) => riskLabel(row.risk) },
      { key: "updatedAt", label: "Actualizado", format: (_, row) => fmtSafe(row.updatedAt) },
    ];
  }, []);

  const exportExcel = () => {
    const toExport = filtered;
    if (!toExport.length) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadBrandedExcel({
      filename: `inventario_${date}.xls`,
      sheetName: "Inventario",
      reportTitle: "Reporte de Inventario",
      columns: exportColumns,
      rows: toExport,
    });
  };

  const exportPdf = () => {
    const toExport = filtered;
    if (!toExport.length) return;
    const date = new Date().toISOString().slice(0, 10);
    printTablePdf({
      filename: `inventario_${date}.pdf`,
      title: "Inventario",
      subtitle: `${toExport.length} productos`,
      columns: exportColumns,
      rows: toExport,
    });
  };

  const openModal = (row, mode) => {
    setModal({ id: row.id, name: row.name, mode });
    setQty("");
    setNote("");
    setRef("");
    setError("");
  };

  const closeModal = () => {
    setModal(null);
    setError("");
  };

  const submitMovement = async () => {
    if (!modal) return;
    const quantity = Number(qty);
    if ((modal.mode === "in" || modal.mode === "out") && quantity <= 0) {
      setError("La cantidad debe ser mayor que 0.");
      return;
    }
    if (modal.mode === "adjust" && Number.isNaN(quantity)) {
      setError("Ingresa un numero valido para el ajuste.");
      return;
    }

    try {
      await inventoryService.adjustStock({
        productId: modal.id,
        type: modal.mode,
        quantity,
        note,
        reference: ref,
      });
      closeModal();
      await load();
    } catch (e) {
      setError(e.message || "No se pudo registrar el movimiento.");
    }
  };

  return (
    <>
      <style>{`
        .inv{display:flex;flex-direction:column;gap:14px}
        .inv-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .inv-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .inv-sub{font-size:12.5px;color:var(--vs-500)}
        .inv-btn{padding:9px 14px;border-radius:10px;border:1.5px solid var(--vs-200);background:var(--vw);cursor:pointer;font-size:13px;font-weight:700;color:var(--vs-700)}
        .inv-btn:disabled{opacity:.55;cursor:not-allowed}
        .inv-btn.pri{background:linear-gradient(135deg,var(--vt-700),var(--vt-500));border:none;color:#fff}
        .inv-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        @media(max-width:900px){.inv-kpis{grid-template-columns:repeat(2,1fr)}}
        .inv-k{background:var(--vw);border:1px solid var(--vs-200);border-radius:13px;padding:12px}
        .inv-k-n{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--vs-900)}
        .inv-k-l{font-size:12px;color:var(--vs-500)}
        .inv-bar{display:flex;gap:8px;flex-wrap:wrap}
        .inv-in{padding:9px 12px;border-radius:10px;border:1.5px solid var(--vs-200);background:var(--vw);font-size:13px}
        .inv-table{background:var(--vw);border:1px solid var(--vs-200);border-radius:16px;overflow:hidden}
        .inv-th,.inv-tr{display:grid;grid-template-columns:1.4fr .7fr .7fr .7fr .8fr 1fr;gap:10px;align-items:center;padding:11px 14px}
        .inv-th{background:var(--vs-50);font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase;letter-spacing:.5px}
        .inv-tr{border-top:1px solid var(--vs-100);font-size:13px;color:var(--vs-700)}
        .inv-name{font-weight:700;color:var(--vs-900)}
        .inv-sku{font-family:monospace;font-size:11px;color:var(--vs-400)}
        .inv-risk{display:inline-flex;padding:4px 8px;border-radius:100px;font-size:11px;font-weight:700}
        .ok{background:#f0fdf4;color:#16a34a}.low{background:#fffbeb;color:#d97706}.out{background:#fef2f2;color:#ef4444}
        .inv-actions{display:flex;gap:6px;flex-wrap:wrap}
        .inv-a{padding:5px 8px;border:1px solid var(--vs-200);border-radius:8px;background:#fff;font-size:11px;cursor:pointer}
        .inv-empty{padding:22px;text-align:center;color:var(--vs-400)}
        .iv-ov{position:fixed;inset:0;background:rgba(15,23,42,.48);z-index:260;display:flex;align-items:center;justify-content:center;padding:16px}
        .iv-md{width:100%;max-width:420px;background:#fff;border-radius:16px;padding:16px;border:1px solid var(--vs-200)}
        .iv-mt{font-family:'Lexend',sans-serif;font-size:16px;font-weight:800;color:var(--vs-900);margin-bottom:5px}
        .iv-ms{font-size:12px;color:var(--vs-500);margin-bottom:10px}
        .iv-f{display:flex;flex-direction:column;gap:5px;margin-bottom:9px}
        .iv-l{font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase}
        .iv-i{padding:10px 12px;border:1.5px solid var(--vs-200);border-radius:10px;font-size:13px}
        .iv-e{font-size:12px;color:#ef4444;font-weight:700}
        .iv-b{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
      `}</style>

      <div className="inv">
        <div className="inv-h">
          <div>
            <h1 className="inv-title">Inventario</h1>
            <p className="inv-sub">Control de stock y ajustes manuales.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="inv-btn" onClick={exportPdf} disabled={!filtered.length}>Exportar PDF</button>
            <button className="inv-btn" onClick={exportExcel} disabled={!filtered.length}>Exportar Excel</button>
            <button className="inv-btn" onClick={() => navigate("/vendor/inventory-movements")}>Ver movimientos</button>
            <button className="inv-btn pri" onClick={load}>Actualizar</button>
          </div>
        </div>

        <div className="inv-kpis">
          <div className="inv-k"><div className="inv-k-n">{stats.products}</div><div className="inv-k-l">Productos</div></div>
          <div className="inv-k"><div className="inv-k-n">{stats.low}</div><div className="inv-k-l">Stock bajo</div></div>
          <div className="inv-k"><div className="inv-k-n">{stats.out}</div><div className="inv-k-l">Agotados</div></div>
          <div className="inv-k"><div className="inv-k-n">{stats.units}</div><div className="inv-k-l">Unidades totales</div></div>
        </div>

        <div className="inv-bar">
          <input className="inv-in" style={{ minWidth: 240 }} placeholder="Buscar por nombre o SKU..." value={query} onChange={e => setQuery(e.target.value)} />
          <select className="inv-in" value={risk} onChange={e => setRisk(e.target.value)}>
            <option value="all">Riesgo: Todos</option>
            <option value="ok">En stock</option>
            <option value="low">Stock bajo</option>
            <option value="out">Agotado</option>
          </select>
          <select className="inv-in" value={catalog} onChange={e => setCatalog(e.target.value)}>
            <option value="all">Catalogo: Todos</option>
            {catalogs.filter(c => c !== "all").map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="inv-table">
          <div className="inv-th">
            <span>Producto</span><span>Catalogo</span><span>Stock</span><span>Minimo</span><span>Riesgo</span><span>Acciones</span>
          </div>
          {loading && <div className="inv-empty">Cargando inventario...</div>}
          {!loading && filtered.length === 0 && <div className="inv-empty">No hay productos con ese filtro.</div>}
          {!loading && filtered.map(r => (
            <div key={r.id} className="inv-tr">
              <div>
                <div className="inv-name">{r.name}</div>
                <div className="inv-sku">{r.sku}</div>
                {r.updatedAt && <div className="inv-sku">Actualizado: {fmtDT(r.updatedAt)}</div>}
              </div>
              <span>{r.catalog}</span>
              <span style={{ fontWeight: 800 }}>{r.stock}</span>
              <span>{r.minStock}</span>
              <span><span className={`inv-risk ${r.risk}`}>{r.risk === "ok" ? "En stock" : r.risk === "low" ? "Bajo" : "Agotado"}</span></span>
              <div className="inv-actions">
                <button className="inv-a" onClick={() => openModal(r, "in")}>Entrada</button>
                <button className="inv-a" onClick={() => openModal(r, "out")}>Salida</button>
                <button className="inv-a" onClick={() => openModal(r, "adjust")}>Ajuste</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <div className="iv-ov" onClick={closeModal}>
          <div className="iv-md" onClick={e => e.stopPropagation()}>
            <div className="iv-mt">
              {modal.mode === "in" ? "Registrar entrada" : modal.mode === "out" ? "Registrar salida" : "Ajustar stock"}
            </div>
            <div className="iv-ms">{modal.name}</div>

            <div className="iv-f">
              <label className="iv-l">Cantidad {modal.mode === "adjust" ? "(puede ser negativa)" : ""}</label>
              <input className="iv-i" type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder={modal.mode === "adjust" ? "Ej: -3 o 5" : "Ej: 5"} />
            </div>
            <div className="iv-f">
              <label className="iv-l">Referencia (opcional)</label>
              <input className="iv-i" value={ref} onChange={e => setRef(e.target.value)} placeholder="ORD-1042 / AJUSTE-01" />
            </div>
            <div className="iv-f">
              <label className="iv-l">Nota (opcional)</label>
              <textarea className="iv-i" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Motivo del movimiento..." />
            </div>
            {error && <div className="iv-e">{error}</div>}
            <div className="iv-b">
              <button className="inv-btn" onClick={closeModal}>Cancelar</button>
              <button className="inv-btn pri" onClick={submitMovement}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
