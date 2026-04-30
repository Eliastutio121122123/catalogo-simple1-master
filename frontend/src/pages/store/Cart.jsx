import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { storeCouponService } from "../../services/odoo/storeCouponService";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconMinus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);
const IconTag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IconShield = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconPackage = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconCart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IconCreditCard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconTruck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);


// ─── Datos mock iniciales del carrito ─────────────────────────────────────────
class CartViewAdapter {
  constructor() {
    this.palette = [
      "from-sky-400 to-blue-500",
      "from-pink-400 to-rose-500",
      "from-amber-400 to-orange-500",
      "from-emerald-400 to-teal-500",
      "from-indigo-400 to-violet-500",
      "from-slate-400 to-gray-600",
    ];
  }

  toViewItems(items) {
    if (!Array.isArray(items)) return [];
    return items.map((item, idx) => this.toViewItem(item, idx));
  }

  toViewItem(item, idx) {
    const color = item.color || this.palette[idx % this.palette.length];
    return {
      ...item,
      color,
      catalog: item.catalog || "Catálogo",
      category: item.category || "General",
      imageUrl: item.imageUrl || "",
    };
  }
}

const cartViewAdapter = new CartViewAdapter();

const COUPON_STORAGE_KEY = "catalogix_store_coupon_code";

const SHIPPING_METHODS = [
  { id: "standard", label: "Envío estándar", time: "3–5 días hábiles", price: 0,   badge: "Gratis" },
  { id: "express",  label: "Envío express",  time: "1–2 días hábiles", price: 350, badge: null },
  { id: "same",     label: "Mismo día",      time: "Hoy antes de las 8pm", price: 650, badge: "Rápido" },
];

// ─── CartItem ─────────────────────────────────────────────────────────────────
function CartItem({ item, onQtyChange, onRemove }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(item.id), 300);
  };

  return (
    <div className={`cart-item${removing ? " removing" : ""}`}>
      <div className={`ci-thumb bg-gradient-to-br ${item.color}`}>
        {item.imageUrl ? (
          <img className="ci-img" src={item.imageUrl} alt={item.name} loading="lazy" />
        ) : (
          <span style={{ fontSize: 20, opacity: 0.4 }}>👗</span>
        )}
      </div>
      <div className="ci-info">
        <div className="ci-catalog">{item.catalog}</div>
        <h4 className="ci-name">{item.name}</h4>
        <div className="ci-cat-tag">{item.category}</div>
        <div className="ci-price-row">
          <span className="ci-price">RD${(item.price * item.qty).toLocaleString()}</span>
          <span className="ci-unit">RD${item.price.toLocaleString()} c/u</span>
        </div>
      </div>
      <div className="ci-right">
        <button className="ci-remove" onClick={handleRemove}><IconTrash /></button>
        <div className="ci-qty-ctrl">
          <button className="ci-qty-btn" onClick={() => onQtyChange(item.id, item.qty - 1)} disabled={item.qty <= 1}><IconMinus /></button>
          <span className="ci-qty-num">{item.qty}</span>
          <button className="ci-qty-btn" onClick={() => onQtyChange(item.id, item.qty + 1)}><IconPlus /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function Cart() {
  const { cartItems, updateQty, removeFromCart } = useContext(CartContext) || {};
  const navigate = useNavigate();
  const items = useMemo(() => cartViewAdapter.toViewItems(cartItems || []), [cartItems]);
  const [coupon, setCoupon]           = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponData, setCouponData]   = useState(null);
  const [shipping, setShipping]       = useState("standard");


  const subtotal   = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount   = couponData ? Math.min(Number(couponData.discountAmount || 0), subtotal) : 0;
  const shipPrice  = SHIPPING_METHODS.find(s => s.id === shipping)?.price ?? 0;
  const total      = subtotal - discount + shipPrice;
  const totalItems = items.reduce((s, i) => s + i.qty, 0);

  const handleQty = (id, qty) => {
    if (!updateQty || qty < 1) return;
    updateQty(id, qty);
  };
  const handleRemove = (id) => removeFromCart && removeFromCart(id);

  const couponLabel = useMemo(() => {
    if (!couponData) return "";
    const desc = String(couponData.description || "").trim();
    if (desc) return desc;
    if (couponData.type === "fixed") return `RD$${Number(couponData.value || 0).toLocaleString("es-DO")} de descuento`;
    return `${Number(couponData.value || 0)}% de descuento`;
  }, [couponData]);

  const buildLines = (srcItems) =>
    (srcItems || [])
      .map((item) => ({
        product_id: Number(item.productId || item.id || 0),
        qty: Number(item.qty || 0),
        price: Number(item.price || 0),
      }))
      .filter((line) => line.product_id > 0 && line.qty > 0);

  const applyCoupon = async (forcedCode) => {
    const code = String(forcedCode ?? couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError("Ingresa un código");
      return;
    }
    if (!items.length) {
      setCouponError("Tu carrito está vacío");
      return;
    }
    try {
      const data = await storeCouponService.validate({ code, lines: buildLines(items) });
      setCouponData(data);
      setCoupon(data.code || code);
      setCouponError("");
      localStorage.setItem(COUPON_STORAGE_KEY, data.code || code);
    } catch (err) {
      setCouponError(err?.message || "Código inválido o expirado");
      setCouponData(null);
      setCoupon("");
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  };

  const removeCoupon = () => {
    setCoupon(""); setCouponInput(""); setCouponData(null); setCouponError("");
    localStorage.removeItem(COUPON_STORAGE_KEY);
  };

  useEffect(() => {
    const stored = localStorage.getItem(COUPON_STORAGE_KEY);
    if (stored) {
      setCouponInput(stored);
      applyCoupon(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!couponData || !coupon) return;
    applyCoupon(coupon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <>
<div>


        <div className="cart-layout">

          {/* ── PANEL IZQUIERDO ── */}
          <div className="cart-left">

            {items.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-ico"><IconPackage /></div>
                <h2 className="empty-title">Tu carrito está vacío</h2>
                <p className="empty-sub">
                  Explora nuestros catálogos y agrega los productos que más te gusten.
                </p>
                <button className="empty-btn" onClick={() => navigate("/catalogs")}>
                  <IconCart />
                  Ver catálogos
                </button>
              </div>
            ) : (
              <>
                <h2 className="section-title">
                  Productos <span className="section-count">{totalItems} artículo{totalItems !== 1 ? "s" : ""}</span>
                </h2>

                {items.map(item => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onQtyChange={handleQty}
                    onRemove={handleRemove}
                  />
                ))}

                {/* Envío */}
                <div className="shipping-section">
                  <h3 className="shipping-title">
                    <IconTruck /> Método de envío
                  </h3>
                  {SHIPPING_METHODS.map(m => (
                    <div
                      key={m.id}
                      className={`ship-option${shipping === m.id ? " selected" : ""}`}
                      onClick={() => setShipping(m.id)}
                    >
                      <div className="ship-radio">
                        {shipping === m.id && <div className="ship-radio-dot" />}
                      </div>
                      <div className="ship-info">
                        <div className="ship-label">
                          {m.label}
                          {m.badge && (
                            <span className={`ship-badge${m.badge === "Rápido" ? " fast" : ""}`} style={{ marginLeft: 8 }}>{m.badge}</span>
                          )}
                        </div>
                        <div className="ship-time">{m.time}</div>
                      </div>
                      <div className="ship-price">
                        {m.price === 0 ? <span style={{ color: "#22c55e", fontWeight: 800 }}>Gratis</span> : `RD$${m.price}`}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── PANEL DERECHO: RESUMEN ── */}
          <div className="cart-right">
            <div className="summary-card">
              <div className="summary-header">Resumen del pedido</div>
              <div className="summary-body">

                {/* Cupón */}
                <div className="coupon-wrap">
                  <div className="coupon-label"><IconTag />Cupón de descuento</div>
                  {couponData ? (
                    <div className="coupon-success">
                      <span className="coupon-success-txt">
                        <IconCheck />{coupon}{couponLabel ? ` — ${couponLabel}` : ""}
                      </span>
                      <button className="coupon-remove" onClick={removeCoupon}><IconX /></button>
                    </div>
                  ) : (
                    <>
                      <div className="coupon-row">
                        <input
                          type="text"
                          className="coupon-input"
                          placeholder="Ej: NOVA10"
                          value={couponInput}
                          onChange={e => { setCouponInput(e.target.value); setCouponError(""); }}
                          onKeyDown={e => e.key === "Enter" && applyCoupon()}
                        />
                        <button className="coupon-btn" onClick={applyCoupon}>Aplicar</button>
                      </div>
                      {couponError && <p className="coupon-error">{couponError}</p>}
                    </>
                  )}
                </div>

                <div className="summary-divider" />

                {/* Líneas */}
                <div className="summary-line">
                  <span className="summary-line-label">Subtotal ({totalItems} artículos)</span>
                  <span className="summary-line-val">RD${subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="summary-line discount">
                    <span className="summary-line-label">
                      Descuento{couponData?.type === "percent" ? ` (${Number(couponData?.value || 0)}%)` : ""}
                    </span>
                    <span className="summary-line-val">−RD${discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="summary-line shipping">
                  <span className="summary-line-label">Envío</span>
                  <span className="summary-line-val">
                    {shipPrice === 0 ? "Gratis" : `RD$${shipPrice}`}
                  </span>
                </div>

                <div className="summary-total">
                  <span className="summary-total-label">Total</span>
                  <span className="summary-total-val">RD${total.toLocaleString()}</span>
                </div>
                <p className="itbis-note">ITBIS (18%) incluido</p>

                <button
                  className="checkout-btn"
                  disabled={items.length === 0}
                  onClick={() => navigate("/checkout")}
                >
                  <IconCreditCard />
                  Proceder al pago
                </button>
              </div>

              {/* Trust */}
              <div className="trust-row">
                {[
                  { ico: <IconShield />, txt: "Pago 100% seguro con cifrado SSL" },
                  { ico: <IconTruck />, txt: "Envío a todo el territorio nacional" },
                  { ico: <IconCheck />, txt: "Garantía de satisfacción" },
                ].map(t => (
                  <div className="trust-item" key={t.txt}>{t.ico}{t.txt}</div>
                ))}
              </div>

              {/* Logos de pago */}
              <div className="payment-logos">
                <span className="payment-logos-label">Acepta:</span>
                {["VISA", "MC", "Stripe", "PayPal", "AMEX"].map(p => (
                  <div key={p} className="pay-logo">{p}</div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    
      <style>{`
:root {
          --blue-700: #1d4ed8; --blue-600: #2563eb; --blue-500: #3b82f6;
          --blue-400: #60a5fa; --blue-50: #eff6ff; --blue-100: #dbeafe;
          --teal-500: #06b6d4; --teal-400: #22d3ee;
          --slate-900: #0f172a; --slate-700: #334155; --slate-500: #64748b;
          --slate-400: #94a3b8; --slate-300: #cbd5e1;
          --slate-200: #e2e8f0; --slate-100: #f1f5f9; --slate-50: #f8fafc;
          --white: #ffffff;
          --green: #22c55e; --green-bg: rgba(34,197,94,0.08); --green-bdr: rgba(34,197,94,0.2);
          --red: #ef4444; --red-bg: rgba(239,68,68,0.07); --red-bdr: rgba(239,68,68,0.2);
        }


                /* ─── LAYOUT ─── */
        .cart-layout {
          max-width: 1100px; margin: 0 auto; padding: 36px 28px 80px;
          display: grid; grid-template-columns: 1fr 380px; gap: 28px; align-items: start;
        }
        @media (max-width: 860px) { .cart-layout { grid-template-columns: 1fr; } }

        /* ─── PANEL IZQUIERDO (items) ─── */
        .cart-left {}
        .section-title {
          font-family: 'Lexend', sans-serif; font-size: 18px; font-weight: 800;
          color: var(--slate-900); letter-spacing: -0.3px; margin-bottom: 18px;
          display: flex; align-items: center; gap: 10px;
        }
        .section-count {
          background: var(--slate-100); color: var(--slate-500);
          padding: 2px 10px; border-radius: 100px; font-size: 12px; font-weight: 700;
          font-family: 'Nunito', sans-serif;
        }

        /* CartItem */
        .cart-item {
          background: var(--white); border-radius: 16px; border: 1px solid var(--slate-200);
          padding: 16px; display: flex; gap: 14px; align-items: flex-start;
          margin-bottom: 12px; transition: all 0.3s ease;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          animation: itemIn 0.35s ease both;
        }
        @keyframes itemIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .cart-item.removing { opacity: 0; transform: translateX(-12px) scale(0.97); }
        .cart-item:hover { border-color: var(--slate-300); box-shadow: 0 4px 16px rgba(0,0,0,0.07); }

        .ci-thumb {
          width: 70px; height: 70px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .ci-img { width: 100%; height: 100%; object-fit: contain; border-radius: 10px; padding: 6px; }
        .ci-info { flex: 1; min-width: 0; }
        .ci-catalog { font-size: 10.5px; font-weight: 700; color: var(--blue-600); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
        .ci-name { font-family: 'Lexend', sans-serif; font-size: 14px; font-weight: 700; color: var(--slate-900); margin-bottom: 5px; line-height: 1.2; }
        .ci-cat-tag {
          display: inline-block; padding: 2px 8px; border-radius: 100px;
          background: var(--slate-100); font-size: 10.5px; font-weight: 600; color: var(--slate-500);
          margin-bottom: 8px;
        }
        .ci-price-row { display: flex; align-items: baseline; gap: 8px; }
        .ci-price { font-family: 'Lexend', sans-serif; font-size: 16px; font-weight: 800; color: var(--slate-900); }
        .ci-unit { font-size: 11.5px; color: var(--slate-400); }

        .ci-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; flex-shrink: 0; }
        .ci-remove {
          background: none; border: none; cursor: pointer;
          color: var(--slate-300); padding: 4px; border-radius: 6px;
          display: flex; transition: all 0.15s;
        }
        .ci-remove:hover { color: var(--red); background: var(--red-bg); }

        .ci-qty-ctrl {
          display: flex; align-items: center;
          border: 1.5px solid var(--slate-200); border-radius: 10px; overflow: hidden;
        }
        .ci-qty-btn {
          width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; color: var(--slate-600);
          transition: all 0.15s;
        }
        .ci-qty-btn:hover:not(:disabled) { background: var(--slate-100); color: var(--blue-600); }
        .ci-qty-btn:disabled { color: var(--slate-300); cursor: not-allowed; }
        .ci-qty-num { padding: 0 10px; font-size: 13.5px; font-weight: 800; color: var(--slate-900); min-width: 28px; text-align: center; }

        /* Envío */
        .shipping-section {
          background: var(--white); border-radius: 16px; border: 1px solid var(--slate-200);
          padding: 20px; margin-top: 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .shipping-title {
          font-family: 'Lexend', sans-serif; font-size: 15px; font-weight: 700;
          color: var(--slate-900); margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .ship-option {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 12px;
          border: 1.5px solid var(--slate-200); margin-bottom: 8px;
          cursor: pointer; transition: all 0.18s;
        }
        .ship-option:hover { border-color: var(--blue-300); background: var(--blue-50); }
        .ship-option.selected { border-color: var(--blue-600); background: var(--blue-50); }
        .ship-radio {
          width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
          border: 2px solid var(--slate-300);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.18s;
        }
        .ship-option.selected .ship-radio { border-color: var(--blue-600); background: var(--blue-600); }
        .ship-radio-dot { width: 7px; height: 7px; border-radius: 50%; background: white; }
        .ship-info { flex: 1; }
        .ship-label { font-size: 13.5px; font-weight: 700; color: var(--slate-900); }
        .ship-time { font-size: 12px; color: var(--slate-500); margin-top: 2px; }
        .ship-price { font-size: 13.5px; font-weight: 800; color: var(--slate-900); flex-shrink: 0; }
        .ship-badge {
          padding: 2px 8px; border-radius: 100px; font-size: 10px; font-weight: 800;
          background: var(--green-bg); color: var(--green); border: 1px solid var(--green-bdr);
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .ship-badge.fast { background: rgba(37,99,235,0.08); color: var(--blue-600); border-color: var(--blue-100); }

        /* ─── PANEL DERECHO (resumen) ─── */
        .cart-right { position: sticky; top: 88px; }

        .summary-card {
          background: var(--white); border-radius: 18px; border: 1px solid var(--slate-200);
          overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .summary-header {
          padding: 20px 22px 0;
          font-family: 'Lexend', sans-serif; font-size: 16px; font-weight: 800;
          color: var(--slate-900);
        }
        .summary-body { padding: 18px 22px; }

        /* Cupón */
        .coupon-wrap { margin-bottom: 18px; }
        .coupon-label {
          font-size: 11px; font-weight: 700; color: var(--slate-500);
          text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;
          display: flex; align-items: center; gap: 5px;
        }
        .coupon-row { display: flex; gap: 8px; }
        .coupon-input {
          flex: 1; padding: 10px 14px; border-radius: 11px;
          border: 1.5px solid var(--slate-200); background: var(--slate-50);
          font-size: 13.5px; font-weight: 700; color: var(--slate-900);
          font-family: 'Nunito', sans-serif; outline: none; transition: all 0.2s;
          text-transform: uppercase; letter-spacing: 1px;
        }
        .coupon-input:focus { border-color: var(--blue-500); background: var(--white); box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .coupon-input::placeholder { text-transform: none; letter-spacing: 0; color: var(--slate-300); font-weight: 400; }
        .coupon-btn {
          padding: 10px 16px; border-radius: 11px; border: none;
          background: var(--slate-900); color: white;
          font-size: 13px; font-weight: 700; font-family: 'Nunito', sans-serif;
          cursor: pointer; transition: all 0.18s; white-space: nowrap;
        }
        .coupon-btn:hover { background: var(--blue-700); }
        .coupon-error { font-size: 12px; color: var(--red); font-weight: 600; margin-top: 6px; }
        .coupon-success {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; border-radius: 11px;
          background: var(--green-bg); border: 1px solid var(--green-bdr);
          margin-bottom: 0;
        }
        .coupon-success-txt { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; color: var(--green); }
        .coupon-remove { background: none; border: none; cursor: pointer; color: var(--slate-400); display: flex; padding: 2px; transition: color 0.15s; }
        .coupon-remove:hover { color: var(--red); }

        /* Líneas de resumen */
        .summary-divider { height: 1px; background: var(--slate-100); margin: 14px 0; }
        .summary-line {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 10px; font-size: 13.5px;
        }
        .summary-line-label { color: var(--slate-500); font-weight: 500; }
        .summary-line-val { font-weight: 700; color: var(--slate-900); }
        .summary-line.discount .summary-line-val { color: var(--green); }
        .summary-line.shipping .summary-line-val { color: var(--green); }
        .summary-total {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 0 4px; border-top: 2px solid var(--slate-900);
        }
        .summary-total-label { font-family: 'Lexend', sans-serif; font-size: 15px; font-weight: 800; color: var(--slate-900); }
        .summary-total-val { font-family: 'Lexend', sans-serif; font-size: 22px; font-weight: 800; color: var(--slate-900); }
        .itbis-note { font-size: 11px; color: var(--slate-400); text-align: right; margin-top: 4px; margin-bottom: 18px; }

        /* Botón checkout */
        .checkout-btn {
          width: 100%; padding: 16px;
          background: linear-gradient(135deg, var(--blue-700), var(--blue-600), #0284c7);
          border: none; border-radius: 13px; color: white;
          font-size: 15px; font-weight: 800; font-family: 'Nunito', sans-serif;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: all 0.25s; box-shadow: 0 4px 18px rgba(29,78,216,0.35);
          position: relative; overflow: hidden;
        }
        .checkout-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .checkout-btn:hover::after { opacity: 1; }
        .checkout-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(29,78,216,0.42); }
        .checkout-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Trust row */
        .trust-row {
          padding: 14px 22px;
          background: var(--slate-50); border-top: 1px solid var(--slate-100);
          display: flex; flex-direction: column; gap: 8px;
        }
        .trust-item {
          display: flex; align-items: center; gap: 7px;
          font-size: 12px; font-weight: 600; color: var(--slate-500);
        }
        .trust-item svg { color: var(--blue-500); flex-shrink: 0; }

        /* Métodos de pago */
        .payment-logos {
          display: flex; gap: 6px; padding: 14px 22px; border-top: 1px solid var(--slate-100);
          flex-wrap: wrap; align-items: center;
        }
        .pay-logo {
          padding: 4px 10px; border-radius: 7px;
          border: 1px solid var(--slate-200); background: white;
          font-size: 11px; font-weight: 800; color: var(--slate-600); letter-spacing: 0.5px;
        }
        .payment-logos-label { font-size: 11px; color: var(--slate-400); font-weight: 500; margin-right: 4px; }

        /* ─── EMPTY ─── */
        .empty-cart {
          background: var(--white); border-radius: 18px; border: 1px solid var(--slate-200);
          padding: 72px 40px; display: flex; flex-direction: column; align-items: center; gap: 18px;
          text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .empty-ico { color: var(--slate-300); }
        .empty-title { font-family: 'Lexend', sans-serif; font-size: 22px; font-weight: 800; color: var(--slate-700); }
        .empty-sub { font-size: 14.5px; color: var(--slate-400); line-height: 1.6; max-width: 320px; }
        .empty-btn {
          padding: 13px 32px; background: var(--blue-600); color: white;
          border: none; border-radius: 13px; font-size: 14.5px; font-weight: 700;
          font-family: 'Nunito', sans-serif; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(37,99,235,0.3); display: flex; align-items: center; gap: 8px;
        }
        .empty-btn:hover { background: var(--blue-700); transform: translateY(-2px); }

      `}</style>
</>
  );
}
