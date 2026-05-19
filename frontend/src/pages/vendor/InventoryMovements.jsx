import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import inventoryService from "../../services/odoo/inventoryService";
import { downloadBrandedExcel } from "../../utils/brandedExcel";
import { printTablePdf } from "../../utils/tablePdf";

const fmtDate = (iso) => new Date(iso).toLocaleString("es-DO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function InventoryMovements() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(false);

  const exportColumns = useMemo(() => {
    const typeLabel = (t) => (t === "in" ? "Entrada" : t === "out" ? "Salida" : "Ajuste");
    const fmtSafe = (iso) => {
      if (!iso) return "";
      const d = new Date(String(iso).replace(" ", "T"));
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toLocaleString("es-DO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    };
    return [
      { key: "id", label: "ID", className: "td num" },
      { key: "productName", label: "Producto" },
      { key: "sku", label: "SKU" },
      { key: "type", label: "Tipo", format: (_, row) => typeLabel(row.type) },
      { key: "quantity", label: "Cantidad", className: "td num" },
      { key: "beforeStock", label: "Antes", className: "td num" },
      { key: "afterStock", label: "Despues", className: "td num" },
      { key: "user", label: "Usuario" },
      { key: "reference", label: "Referencia" },
      { key: "note", label: "Nota" },
      { key: "createdAt", label: "Fecha", format: (_, row) => fmtSafe(row.createdAt) },
    ];
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await inventoryService.listMovements();
      setRows(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.trim().toLowerCase();
      if (q && !r.productName.toLowerCase().includes(q) && !r.sku.toLowerCase().includes(q) && !String(r.reference || "").toLowerCase().includes(q)) return false;
      if (type !== "all" && r.type !== type) return false;
      return true;
    });
  }, [rows, query, type]);

  const exportExcel = () => {
    if (!filtered.length) return;
    const date = new Date().toISOString().slice(0, 10);
    downloadBrandedExcel({
      filename: `movimientos_inventario_${date}.xls`,
      sheetName: "Movimientos",
      reportTitle: "Reporte de Movimientos de Inventario",
      columns: exportColumns,
      rows: filtered,
    });
  };

  const exportPdf = async () => {
    if (!filtered.length) return;
    const date = new Date().toISOString().slice(0, 10);
    await printTablePdf({
      filename: `movimientos_inventario_${date}.pdf`,
      title: "Movimientos de inventario",
      subtitle: `${filtered.length} movimientos · ${date}`,
      columns: exportColumns,
      rows: filtered,
      brandName: "Catalogix",
      kpis: [
        { label: "Movimientos",       value: String(stats.total)  },
        { label: "Unidades entrada",  value: String(stats.input)  },
        { label: "Unidades salida",   value: String(stats.output) },
        { label: "Ajustes",           value: String(stats.adjust) },
      ],
    });
  };

  const stats = useMemo(() => {
    const input = rows.filter(r => r.type === "in").reduce((acc, r) => acc + Math.abs(Number(r.quantity) || 0), 0);
    const output = rows.filter(r => r.type === "out").reduce((acc, r) => acc + Math.abs(Number(r.quantity) || 0), 0);
    const adjust = rows.filter(r => r.type === "adjust").length;
    return { total: rows.length, input, output, adjust };
  }, [rows]);

  const badge = (t) => {
    if (t === "in") return <span className="im-b in">Entrada</span>;
    if (t === "out") return <span className="im-b out">Salida</span>;
    return <span className="im-b adj">Ajuste</span>;
  };

  return (
    <>
      <style>{`
        .im{display:flex;flex-direction:column;gap:14px}
        .im-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .im-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .im-sub{font-size:12.5px;color:var(--vs-500)}
        .im-btn{padding:9px 14px;border-radius:10px;border:1.5px solid var(--vs-200);background:var(--vw);cursor:pointer;font-size:13px;font-weight:700;color:var(--vs-700)}
        .im-btn:disabled{opacity:.55;cursor:not-allowed}
        .im-k{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        @media(max-width:900px){.im-k{grid-template-columns:repeat(2,1fr)}}
        .im-c{background:var(--vw);border:1px solid var(--vs-200);border-radius:13px;padding:12px}
        .im-n{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--vs-900)}
        .im-l{font-size:12px;color:var(--vs-500)}
        .im-f{display:flex;gap:8px;flex-wrap:wrap}
        .im-in{padding:9px 12px;border-radius:10px;border:1.5px solid var(--vs-200);background:var(--vw);font-size:13px}
        .im-t{background:var(--vw);border:1px solid var(--vs-200);border-radius:16px;overflow:hidden}
        .im-th,.im-r{display:grid;grid-template-columns:1.2fr .6fr .7fr .8fr .8fr .8fr 1fr;gap:10px;align-items:center;padding:11px 14px}
        .im-th{background:var(--vs-50);font-size:11px;font-weight:800;color:var(--vs-500);text-transform:uppercase;letter-spacing:.5px}
        .im-r{border-top:1px solid var(--vs-100);font-size:13px;color:var(--vs-700)}
        .im-pn{font-weight:700;color:var(--vs-900)}
        .im-sku{font-family:monospace;font-size:11px;color:var(--vs-400)}
        .im-b{display:inline-flex;padding:4px 8px;border-radius:100px;font-size:11px;font-weight:700}
        .im-b.in{background:#f0fdf4;color:#16a34a}
        .im-b.out{background:#fef2f2;color:#ef4444}
        .im-b.adj{background:#eff6ff;color:#2563eb}
        .im-q{font-weight:800}
        .im-q.pos{color:#16a34a}.im-q.neg{color:#ef4444}.im-q.adj{color:#2563eb}
        .im-empty{padding:22px;text-align:center;color:var(--vs-400)}
      `}</style>

      <div className="im">
        <div className="im-h">
          <div>
            <h1 className="im-title">Movimientos de inventario</h1>
            <p className="im-sub">Historial de entradas, salidas y ajustes.</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="im-btn" onClick={exportPdf} disabled={!filtered.length}>Exportar PDF</button>
            <button className="im-btn" onClick={exportExcel} disabled={!filtered.length}>Exportar Excel</button>
            <button className="im-btn" onClick={() => navigate("/vendor/inventory")}>Volver a inventario</button>
          </div>
        </div>

        <div className="im-k">
          <div className="im-c"><div className="im-n">{stats.total}</div><div className="im-l">Movimientos</div></div>
          <div className="im-c"><div className="im-n">{stats.input}</div><div className="im-l">Unidades entrada</div></div>
          <div className="im-c"><div className="im-n">{stats.output}</div><div className="im-l">Unidades salida</div></div>
          <div className="im-c"><div className="im-n">{stats.adjust}</div><div className="im-l">Ajustes</div></div>
        </div>

        <div className="im-f">
          <input className="im-in" style={{ minWidth: 260 }} placeholder="Buscar producto, SKU o referencia..." value={query} onChange={e => setQuery(e.target.value)} />
          <select className="im-in" value={type} onChange={e => setType(e.target.value)}>
            <option value="all">Tipo: Todos</option>
            <option value="in">Entrada</option>
            <option value="out">Salida</option>
            <option value="adjust">Ajuste</option>
          </select>
        </div>

        <div className="im-t">
          <div className="im-th">
            <span>Producto</span><span>Tipo</span><span>Cantidad</span><span>Antes</span><span>Despues</span><span>Usuario</span><span>Fecha</span>
          </div>
          {loading && <div className="im-empty">Cargando movimientos...</div>}
          {!loading && filtered.length === 0 && <div className="im-empty">No hay movimientos con ese filtro.</div>}
          {!loading && filtered.map(r => {
            const delta = Number(r.afterStock) - Number(r.beforeStock);
            const deltaClass = r.type === "adjust" ? "adj" : delta >= 0 ? "pos" : "neg";
            return (
              <div className="im-r" key={r.id}>
                <div>
                  <div className="im-pn">{r.productName}</div>
                  <div className="im-sku">{r.sku}{r.reference ? ` · ${r.reference}` : ""}</div>
                  {r.note && <div className="im-sku">{r.note}</div>}
                </div>
                <span>{badge(r.type)}</span>
                <span className={`im-q ${deltaClass}`}>{delta >= 0 ? `+${Math.abs(delta)}` : `-${Math.abs(delta)}`}</span>
                <span>{r.beforeStock}</span>
                <span style={{ fontWeight: 800 }}>{r.afterStock}</span>
                <span>{r.user || "Sistema"}</span>
                <span>{fmtDate(r.createdAt)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
