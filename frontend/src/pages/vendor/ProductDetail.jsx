import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import vendorProductService from "../../services/odoo/vendorProductService";
import useCurrency from "../../hooks/useCurrency";
import { toImageDataUrl } from "../../utils/imageDataUrl";
import { formatMoney } from "../../utils/formatCurrency";

class VendorProductDetailAdapter {
  toView(product) {
    if (!product) return null;
    const imagesBase64 = Array.isArray(product.images_base64) ? product.images_base64 : [];
    const mainBase64 = product.image_1920 || imagesBase64[0] || "";

    const images = [];
    const mainUrl = toImageDataUrl(mainBase64);
    if (mainUrl) images.push(mainUrl);
    imagesBase64.forEach((b64) => {
      const url = toImageDataUrl(b64);
      if (url && !images.includes(url)) images.push(url);
    });
    const catalog = Array.isArray(product.catalog_id) ? product.catalog_id[1] : product.catalog_id || "Sin catalogo";
    const category = Array.isArray(product.categ_id) ? product.categ_id[1] : product.categ_id || "Sin categoria";
    const currency = Array.isArray(product.currency_id) ? product.currency_id[1] : (product.currency_id || "DOP");
    const status = product.active === false ? "inactive" : "active";
    const stock =
      product.catalog_stock_qty != null
        ? Number(product.catalog_stock_qty || 0)
        : Number(product.qty_available || 0);
    return {
      id: product.id,
      name: product.name || "-",
      sku: product.default_code || `PROD-${product.id}`,
      catalog,
      category,
      price: Number(product.list_price || 0),
      cost: Number(product.standard_price || 0),
      currency: String(currency || "DOP").toUpperCase(),
      stock,
      status,
      description: product.description_sale || product.description || "",
      images,
      imageUrl: images[0] || "",
    };
  }
}

const adapter = new VendorProductDetailAdapter();

export default function VendorProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { byCode } = useCurrency();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await vendorProductService.getById(id);
        if (!active) return;
        const mapped = adapter.toView(data);
        setRow(mapped);
        setImgIdx(0);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "No se pudo cargar el producto.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const statusLabel = useMemo(() => {
    if (!row) return "";
    if (row.status === "active") return "Activo";
    if (row.status === "inactive") return "Inactivo";
    return "Borrador";
  }, [row]);

  return (
    <>
      <style>{`
        .vpd{display:flex;flex-direction:column;gap:18px}
        .vpd-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
        .vpd-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .vpd-sub{font-size:13px;color:var(--vs-500)}
        .vpd-card{background:#fff;border:1px solid var(--vs-200);border-radius:18px;padding:18px;display:grid;grid-template-columns:220px 1fr;gap:18px}
        @media(max-width:820px){.vpd-card{grid-template-columns:1fr}}
        .vpd-img{background:var(--vs-50);border-radius:16px;display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;min-height:220px;border:1px solid var(--vs-100);padding:10px}
        .vpd-img-main{width:100%;height:220px;display:flex;align-items:center;justify-content:center}
        .vpd-img-main img{max-width:100%;max-height:100%;object-fit:contain;border-radius:12px}
        .vpd-thumbs{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
        .vpd-thumb{width:44px;height:44px;border-radius:12px;border:2px solid var(--vs-200);background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer}
        .vpd-thumb.act{border-color:var(--vt-600);box-shadow:0 0 0 3px rgba(59,130,246,.15)}
        .vpd-thumb img{width:100%;height:100%;object-fit:cover}
        .vpd-meta{display:flex;flex-direction:column;gap:12px}
        .vpd-name{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--vs-900)}
        .vpd-sku{font-size:12px;color:var(--vs-400);font-family:monospace}
        .vpd-row{display:flex;flex-wrap:wrap;gap:12px}
        .vpd-pill{padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700}
        .vpd-pill.active{background:#ecfdf3;color:#15803d}
        .vpd-pill.inactive{background:#fef2f2;color:#dc2626}
        .vpd-pill.draft{background:#f8fafc;color:#64748b}
        .vpd-kv{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:640px){.vpd-kv{grid-template-columns:1fr}}
        .vpd-k{background:var(--vs-50);border:1px solid var(--vs-100);border-radius:12px;padding:10px}
        .vpd-k span{display:block;font-size:11px;color:var(--vs-400);text-transform:uppercase;font-weight:700}
        .vpd-k strong{display:block;font-size:14px;color:var(--vs-800);margin-top:4px}
        .vpd-desc{background:var(--vs-50);border:1px solid var(--vs-100);border-radius:12px;padding:12px;font-size:13px;color:var(--vs-600);line-height:1.6}
        .vpd-actions{display:flex;gap:8px;flex-wrap:wrap}
        .vpd-btn{padding:8px 12px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;font-size:12.5px;font-weight:700;color:var(--vs-600);cursor:pointer}
        .vpd-btn.pri{background:linear-gradient(135deg,var(--vt-700),var(--vt-500));border-color:transparent;color:#fff}
      `}</style>

      <div className="vpd">
        <div className="vpd-head">
          <div>
            <div className="vpd-title">Detalle de producto</div>
            <div className="vpd-sub">InformaciÃ³n completa del producto</div>
            {error && <div style={{ color: "#dc2626", fontSize: 12, fontWeight: 700, marginTop: 6 }}>{error}</div>}
          </div>
          <div className="vpd-actions">
            <button className="vpd-btn" onClick={() => navigate("/vendor/products")}>Volver</button>
            {row && (
              <button className="vpd-btn pri" onClick={() => navigate(`/vendor/products/${row.id}/edit`)}>Editar</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 24, color: "var(--vs-400)" }}>Cargando producto...</div>
        ) : row ? (
          <div className="vpd-card">
            <div className="vpd-img">
              <div className="vpd-img-main">
                {row.imageUrl ? (
                  <img src={(row.images && row.images[imgIdx]) || row.imageUrl} alt={row.name} />
                ) : (
                  <span>Sin imagen</span>
                )}
              </div>
              {Array.isArray(row.images) && row.images.length > 1 && (
                <div className="vpd-thumbs">
                  {row.images.map((src, i) => (
                    <div
                      key={i}
                      className={`vpd-thumb${imgIdx === i ? " act" : ""}`}
                      onClick={() => setImgIdx(i)}
                      title={`Imagen ${i + 1}`}
                    >
                      <img src={src} alt={`Imagen ${i + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="vpd-meta">
              <div className="vpd-name">{row.name}</div>
              <div className="vpd-sku">{row.sku}</div>
              <div className="vpd-row">
                <span className={`vpd-pill ${row.status}`}>{statusLabel}</span>
                <span className="vpd-pill active">{row.catalog}</span>
                <span className="vpd-pill active">{row.category}</span>
              </div>
              <div className="vpd-kv">
                <div className="vpd-k"><span>Precio</span><strong>{formatMoney(row.price, row.currency, { maximumFractionDigits: 2, byCode })}</strong></div>
                <div className="vpd-k"><span>Stock</span><strong>{row.stock}</strong></div>
                <div className="vpd-k"><span>Costo</span><strong>{formatMoney(row.cost, row.currency, { maximumFractionDigits: 2, byCode })}</strong></div>
                <div className="vpd-k"><span>ID</span><strong>{row.id}</strong></div>
              </div>
              <div className="vpd-desc">{row.description || "Sin descripciÃ³n disponible."}</div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
