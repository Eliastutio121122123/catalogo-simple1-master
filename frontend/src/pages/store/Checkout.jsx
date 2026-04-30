import { useEffect, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../../context/CartContext";
import { cartService } from "../../services/odoo/cartService";
import authService from "../../services/odoo/authService";
import { checkoutService } from "../../services/odoo/checkoutService";
import { paymentService, paymentPayloadBuilder } from "../../services/odoo/paymentService";
import { storeCouponService } from "../../services/odoo/storeCouponService";
import { storePromotionService } from "../../services/odoo/storePromotionService";

// ─── Iconos ───────────────────────────────────────────────────────────────────
const Ico = {
  ArrowLeft:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ArrowRight:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Check:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  User:        () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Map:         () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Phone:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.87 2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6.06 6.06l.81-.81a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17.5"/></svg>,
  CreditCard:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Lock:        () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Shield:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Package:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  Eye:         () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Alert:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Edit:        () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
};

const LogoCatalogix = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <defs><linearGradient id="chk-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1e40af"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient></defs>
    <path d="M18 26 L30 26 L44 76 L88 76 L98 42 L34 42" stroke="url(#chk-g)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="50" cy="88" r="6" fill="url(#chk-g)"/><circle cx="80" cy="88" r="6" fill="url(#chk-g)"/>
    <rect x="50" y="24" width="16" height="22" rx="2.5" fill="#1d4ed8" opacity="0.95"/>
    <rect x="58" y="20" width="16" height="22" rx="2.5" fill="#0891b2" opacity="0.9"/>
    <rect x="66" y="16" width="16" height="22" rx="2.5" fill="#06b6d4" opacity="0.85"/>
  </svg>
);

class CheckoutItemAdapter {
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

  toItems(items) {
    if (!Array.isArray(items)) return [];
    return items.map((item, idx) => this.toItem(item, idx));
  }

  toItem(item, idx) {
    const color = item.color || this.palette[idx % this.palette.length];
    return {
      ...item,
      color,
      catalog: item.catalog || "Cat?logo",
      imageUrl: item.imageUrl || "",
    };
  }
}

const checkoutItemAdapter = new CheckoutItemAdapter();

class PaymentStatusResolver {
  statusFromResponse(res) {
    const method = String(res?.payment?.method || "").toLowerCase();
    if (method === "cash") return "cod";
    const status = res?.payment?.status;
    if (status) return status;
    const paymentState = String(res?.invoice?.payment_state || "").toLowerCase();
    if (paymentState === "paid" || paymentState === "in_payment") return "success";
    return "pending";
  }

  orderRef(res) {
    return (
      res?.order?.name ||
      res?.order?.id ||
      res?.invoice?.number ||
      res?.invoice?.id ||
      "ORD-0001"
    );
  }
}

const paymentStatusResolver = new PaymentStatusResolver();

const STEPS = [
  { id: 1, label: "Entrega",  icon: "📍" },
  { id: 2, label: "Pago",     icon: "💳" },
  { id: 3, label: "Revisión", icon: "👁" },
];

const PAYMENT_METHODS = [
  { id: "stripe", label: "Tarjeta y wallets (Stripe)", sub: "Visa, MC, Apple Pay, Google Pay", icon: "💳" },
  { id: "cash",   label: "Pago contra entrega",        sub: "Monto exacto al recibir",         icon: "💵" },
];

const PROVINCES = ["Distrito Nacional","Santiago","La Romana","San Pedro de Macorís","Santo Domingo","La Vega","Duarte","Espaillat","Puerto Plata","Barahona","San Cristóbal","San Juan","Azua","Bahoruco","Dajabón","El Seibo","Elías Piña","Hato Mayor","Independencia","La Altagracia","María Trinidad Sánchez","Monseñor Nouel","Monte Cristi","Monte Plata","Pedernales","Peravia","Samaná","Sánchez Ramírez","Valverde"];

// ─── CardForm ────────────────────────────────────────────────────────────────
function CardForm({ card, onChange, errors }) {
  const [showCvv, setShowCvv] = useState(false);
  const fmtNum  = v => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtExp  = v => { const d = v.replace(/\D/g,"").slice(0,4); return d.length >= 3 ? d.slice(0,2)+"/"+d.slice(2) : d; };
  return (
    <div style={{ marginTop: 20 }}>
      <div className="cf-preview">
        <div className="cf-chip" />
        <div className="cf-number">{card.number || "•••• •••• •••• ••••"}</div>
        <div className="cf-row">
          <div><div className="cf-lbl">Titular</div><div className="cf-val">{card.name || "TU NOMBRE"}</div></div>
          <div style={{ textAlign:"right" }}><div className="cf-lbl">Vence</div><div className="cf-val">{card.expiry || "MM/AA"}</div></div>
        </div>
      </div>
      <div className="f-group">
        <label className="f-label">Número de tarjeta</label>
        <div className="f-wrap">
          <span className="f-icon"><Ico.CreditCard /></span>
          <input className={`f-input${errors?.cardNumber?" err":""}`} type="text" placeholder="0000 0000 0000 0000" value={card.number} onChange={e=>onChange("number",fmtNum(e.target.value))} maxLength={19} />
        </div>
        {errors?.cardNumber && <p className="f-err">{errors.cardNumber}</p>}
      </div>
      <div className="f-row-2">
        <div className="f-group">
          <label className="f-label">Vencimiento</label>
          <input className={`f-input no-icon${errors?.expiry?" err":""}`} type="text" placeholder="MM/AA" value={card.expiry} onChange={e=>onChange("expiry",fmtExp(e.target.value))} maxLength={5} />
          {errors?.expiry && <p className="f-err">{errors.expiry}</p>}
        </div>
        <div className="f-group">
          <label className="f-label">CVV</label>
          <div className="f-wrap">
            <input className={`f-input no-icon${errors?.cvv?" err":""}`} type={showCvv?"text":"password"} placeholder="•••" value={card.cvv} onChange={e=>onChange("cvv",e.target.value.replace(/\D/g,"").slice(0,4))} maxLength={4} />
            <button type="button" className="f-eye" onClick={()=>setShowCvv(v=>!v)}>{showCvv?<Ico.EyeOff/>:<Ico.Eye/>}</button>
          </div>
          {errors?.cvv && <p className="f-err">{errors.cvv}</p>}
        </div>
      </div>
      <div className="f-group">
        <label className="f-label">Nombre en la tarjeta</label>
        <div className="f-wrap">
          <span className="f-icon"><Ico.User /></span>
          <input className={`f-input${errors?.cardName?" err":""}`} type="text" placeholder="Como aparece en la tarjeta" value={card.name} onChange={e=>onChange("name",e.target.value.toUpperCase())} />
        </div>
        {errors?.cardName && <p className="f-err">{errors.cardName}</p>}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Checkout({ orderItems }) {
  const navigate = useNavigate();
  const { cartItems, cartId, clearCart } = useContext(CartContext) || {};
  const isAuthed = authService.isAuthenticated();
  const baseItems = useMemo(
    () => checkoutItemAdapter.toItems(orderItems || cartItems || []),
    [orderItems, cartItems]
  );
  const [items, setItems] = useState(baseItems);
  const [refreshing, setRefreshing] = useState(false);

  const [step, setStep]       = useState(1);
  const [ready, setReady]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [submitError, setSubmitError] = useState("");

  const [delivery, setDelivery] = useState({ firstName:"", lastName:"", email:"", phone:"", province:"", city:"", address:"", reference:"" });
  const [payMethod, setPayMethod] = useState("stripe");
  const [card, _setCard]          = useState({ number:"", expiry:"", cvv:"", name:"" });
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState(null);
  const [promoQuote, setPromoQuote] = useState(null);

  const applyPromotionQuote = async (itemsToQuote, { silent = true } = {}) => {
    const list = Array.isArray(itemsToQuote) ? itemsToQuote : [];
    if (!isAuthed || !list.length) {
      setPromoQuote(null);
      return list;
    }

    const lines = list
      .map((item) => ({
        product_id: Number(item.productId || item.id || 0),
        qty: Number(item.qty || 0),
        price: Number(item.price || 0),
      }))
      .filter((line) => line.product_id > 0 && line.qty > 0);

    if (!lines.length) {
      setPromoQuote(null);
      return list;
    }

    try {
      const quote = await storePromotionService.quote({ lines, cartId });
      setPromoQuote(quote || null);

      const qLines = Array.isArray(quote?.lines) ? quote.lines : [];
      const map = new Map(qLines.map((l) => [Number(l.product_id || 0), l]));

      const merged = list.map((item) => {
        const pid = Number(item.productId || item.id || 0);
        const ql = map.get(pid);
        if (!ql) return item;
        const base = Number(ql.base_price ?? item.promoBasePrice ?? item.price ?? 0);
        const price = Number(ql.price ?? item.price ?? 0);
        return {
          ...item,
          promoBasePrice: base,
          price,
          promotion: ql.promotion || null,
        };
      });

      return merged;
    } catch (err) {
      if (!silent) throw err;
      setPromoQuote(null);
      return list;
    }
  };

  useEffect(() => {
    if (!isAuthed) {
      navigate("/login", { replace: true });
      return;
    }
    setTimeout(() => setReady(true), 60);
  }, [navigate, isAuthed]);

  useEffect(() => {
    const stored = localStorage.getItem("catalogix_store_coupon_code");
    if (stored) setCouponCode(String(stored).trim().toUpperCase());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const next = await applyPromotionQuote(baseItems);
      if (active) setItems(next);
    })();
    return () => {
      active = false;
    };
  }, [baseItems, isAuthed]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!couponCode || !items.length) {
        if (active) setCouponData(null);
        return;
      }
      try {
        const lines = items
          .map((item) => ({
            product_id: Number(item.productId || item.id || 0),
            qty: Number(item.qty || 0),
            price: Number(item.price || 0),
          }))
          .filter((line) => line.product_id > 0 && line.qty > 0);
        const data = await storeCouponService.validate({ code: couponCode, lines, cartId });
        if (active) setCouponData(data);
      } catch {
        if (active) setCouponData(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [couponCode, items, cartId]);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) return;
    const full = String(user.name || "").trim();
    const parts = full.split(/\\s+/).filter(Boolean);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";
    setDelivery((d) => ({
      ...d,
      firstName: d.firstName || firstName,
      lastName: d.lastName || lastName,
      email: d.email || String(user.email || ""),
      phone: d.phone || String(user.phone || ""),
    }));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isAuthed) return;
      if (!baseItems.length) return;
      setRefreshing(true);
      try {
        const next = await checkoutService.refresh(baseItems);
        const quoted = await applyPromotionQuote(next);
        if (active) setItems(quoted);
      } finally {
        if (active) setRefreshing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [baseItems]);

  const refreshItems = async () => {
    setRefreshing(true);
    try {
      const next = await checkoutService.refresh(items);
      const quoted = await applyPromotionQuote(next);
      setItems(quoted);
    } finally {
      setRefreshing(false);
    }
  };

  if (!isAuthed) return null;

  const baseSubtotal = items.reduce((s,i) => s + (Number(i.promoBasePrice ?? i.price ?? 0) * (i.qty || 0)), 0);
  const promoSubtotal = items.reduce((s,i) => s + (Number(i.price || 0) * (i.qty || 0)), 0);
  const promoDiscount = Math.max(0, baseSubtotal - promoSubtotal);
  const couponDiscount = couponData ? Math.min(Number(couponData.discountAmount || 0), promoSubtotal) : 0;
  const total    = promoSubtotal - couponDiscount;
  const totalQty = items.reduce((s,i) => s + i.qty, 0);

  const updDel  = (k,v) => { setDelivery(d=>({...d,[k]:v})); setErrors(e=>{const c={...e};delete c[k];return c;}); };

  const validateStep1 = () => {
    const e={};
    if(!delivery.firstName.trim()) e.firstName="Requerido";
    if(!delivery.lastName.trim())  e.lastName="Requerido";
    if(!delivery.email.trim()||!/\S+@\S+\.\S+/.test(delivery.email)) e.email="Correo inválido";
    if(!delivery.phone.trim())     e.phone="Requerido";
    if(!delivery.province.trim())  e.province="Requerido";
    if(!delivery.city.trim())      e.city="Requerido";
    if(!delivery.address.trim())   e.address="Requerido";
    setErrors(e); return Object.keys(e).length===0;
  };
  const validateStep2 = () => true;

  const nextStep = async () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    if (step === 1) {
      try {
        await cartService.saveDelivery(delivery, cartId);
      } catch {
        // Best-effort: delivery is also sent again on final checkout.
      }
    }

    setErrors({});
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const prevStep = () => { setErrors({}); setStep(s=>s-1); window.scrollTo({top:0,behavior:"smooth"}); };

  const handleSubmit = async () => {
    if (!items.length) {
      setSubmitError("Tu carrito estÃ¡ vacÃ­o.");
      return;
    }

    setLoading(true);
    setSubmitError("");
    try {
      const payload = paymentPayloadBuilder.build({
        items,
        method: payMethod,
        delivery,
        card,
        cartId,
        couponCode: couponData?.code || couponCode || null,
      });
      if (!payload.lines.length) {
        throw new Error("No hay productos para procesar el pago.");
      }
      const response = await paymentService.checkout(payload);
      if (typeof clearCart === "function") clearCart();
      localStorage.removeItem("catalogix_store_coupon_code");
      if (response?.checkout_url) {
        window.location.assign(response.checkout_url);
        return;
      }
      const status = paymentStatusResolver.statusFromResponse(response);
      const orderRef = paymentStatusResolver.orderRef(response);
      navigate(`/payment-result?status=${status}&order=${encodeURIComponent(orderRef)}`);
    } catch (err) {
      setSubmitError(err?.message || "No se pudo procesar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
<div className={`page${ready?" in":""}`}>
        {/* HEADER */}
        <header className="hdr">
          <div className="hdr-in">
            <button className="back-btn" onClick={() => navigate("/cart")}><Ico.ArrowLeft />Carrito</button>
            <div className="brand" onClick={() => navigate("/")}><LogoCatalogix size={28}/><span className="brand-name">Catalog<em>ix</em></span></div>
          </div>
        </header>

        {/* STEPPER */}
        <div className="stepper">
          <div className="stepper-in">
            {STEPS.map((s, i) => {
              const state = step > s.id ? "done" : step === s.id ? "active" : "idle";
              return (
                <div key={s.id} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length-1 ? 1 : "none" }}>
                  <div className="s-item">
                    <div className={`s-circle ${state}`}>
                      {state === "done" ? <Ico.Check /> : s.icon}
                    </div>
                    <div className="s-txt">
                      <span className="s-num">Paso {s.id}</span>
                      <span className={`s-lbl ${state}`}>{s.label}</span>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="s-line">
                      <div className="s-line-fill" style={{ width: step > s.id ? "100%" : "0%" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* LAYOUT */}
        <div className="layout">
          <div>
            {/* ═══ PASO 1 ═══ */}
            {step === 1 && (
              <div className="panel">
                <div className="panel-head">
                  <div className="p-eyebrow">Paso 1 de 3</div>
                  <h2 className="p-title">Datos de entrega</h2>
                </div>
                <div className="panel-body">
                  <div className="f-row-2">
                    <div className="f-group">
                      <label className="f-label">Nombre *</label>
                      <div className="f-wrap"><span className="f-icon"><Ico.User /></span>
                        <input className={`f-input${errors.firstName?" err":""}`} type="text" placeholder="María" value={delivery.firstName} onChange={e=>updDel("firstName",e.target.value)} />
                      </div>
                      {errors.firstName && <p className="f-err">{errors.firstName}</p>}
                    </div>
                    <div className="f-group">
                      <label className="f-label">Apellido *</label>
                      <div className="f-wrap"><span className="f-icon"><Ico.User /></span>
                        <input className={`f-input${errors.lastName?" err":""}`} type="text" placeholder="González" value={delivery.lastName} onChange={e=>updDel("lastName",e.target.value)} />
                      </div>
                      {errors.lastName && <p className="f-err">{errors.lastName}</p>}
                    </div>
                  </div>
                  <div className="f-row-2">
                    <div className="f-group">
                      <label className="f-label">Correo electrónico *</label>
                      <div className="f-wrap"><span className="f-icon" style={{fontSize:14,left:14}}>@</span>
                        <input className={`f-input${errors.email?" err":""}`} type="email" placeholder="correo@ejemplo.com" value={delivery.email} onChange={e=>updDel("email",e.target.value)} />
                      </div>
                      {errors.email && <p className="f-err">{errors.email}</p>}
                    </div>
                    <div className="f-group">
                      <label className="f-label">Teléfono *</label>
                      <div className="f-wrap"><span className="f-icon"><Ico.Phone /></span>
                        <input className={`f-input${errors.phone?" err":""}`} type="tel" placeholder="809-000-0000" value={delivery.phone} onChange={e=>updDel("phone",e.target.value)} />
                      </div>
                      {errors.phone && <p className="f-err">{errors.phone}</p>}
                    </div>
                  </div>
                  <div className="f-row-2">
                    <div className="f-group">
                      <label className="f-label">Provincia *</label>
                      <div className="f-wrap"><span className="f-icon"><Ico.Map /></span>
                        <select className={`f-input${errors.province?" err":""}`} value={delivery.province} onChange={e=>updDel("province",e.target.value)}>
                          <option value="">Seleccionar…</option>
                          {PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      {errors.province && <p className="f-err">{errors.province}</p>}
                    </div>
                    <div className="f-group">
                      <label className="f-label">Municipio *</label>
                      <div className="f-wrap"><span className="f-icon"><Ico.Map /></span>
                        <input className={`f-input${errors.city?" err":""}`} type="text" placeholder="Ciudad" value={delivery.city} onChange={e=>updDel("city",e.target.value)} />
                      </div>
                      {errors.city && <p className="f-err">{errors.city}</p>}
                    </div>
                  </div>
                  <div className="f-group">
                    <label className="f-label">Dirección completa *</label>
                    <div className="f-wrap"><span className="f-icon"><Ico.Map /></span>
                      <input className={`f-input${errors.address?" err":""}`} type="text" placeholder="Calle, No., Sector, Barrio…" value={delivery.address} onChange={e=>updDel("address",e.target.value)} />
                    </div>
                    {errors.address && <p className="f-err">{errors.address}</p>}
                  </div>
                  <div className="f-group">
                    <label className="f-label">Referencias (opcional)</label>
                    <textarea className="f-input no-icon" rows={3} placeholder="Color de la casa, cerca de, punto de referencia…" value={delivery.reference} onChange={e=>updDel("reference",e.target.value)} />
                  </div>
                </div>
                <div className="panel-foot">
                  <button className="btn-next" onClick={nextStep}>Continuar al pago <Ico.ArrowRight /></button>
                </div>
              </div>
            )}

            {/* ═══ PASO 2 ═══ */}
            {step === 2 && (
              <div className="panel">
                <div className="panel-head">
                  <div className="p-eyebrow">Paso 2 de 3</div>
                  <h2 className="p-title">Método de pago</h2>
                </div>
                <div className="panel-body">
                  <div className="info-box">
                    <Ico.Lock />
                    <span className="info-box-txt">Todos los pagos están cifrados con SSL de 256 bits. Tu información financiera está completamente segura.</span>
                  </div>
                  <div className="pay-grid">
  {PAYMENT_METHODS.map(m => (
    <div key={m.id} className={`pay-opt${payMethod===m.id?" active":""}`} onClick={()=>setPayMethod(m.id)}>
      <span className="pay-ico">{m.icon}</span>
      <div><div className="pay-lbl">{m.label}</div><div className="pay-sub">{m.sub}</div></div>
      <div className="pay-radio">{payMethod===m.id && <div className="pay-radio-dot"/>}</div>
    </div>
  ))}
</div>
{payMethod !== "card" && (
  <div className="info-box" style={{ marginTop:8 }}>
    <Ico.Alert />
    <span className="info-box-txt">
      {payMethod==="stripe" && "Serás redirigido a Stripe para completar tu pago de forma segura con tarjeta o wallets."}
      {payMethod==="cash"   && "Deberás tener el monto exacto listo al momento de recibir tu pedido."}
    </span>
  </div>
)}
                </div>
                <div className="panel-foot">
                  <button className="btn-prev" onClick={prevStep}><Ico.ArrowLeft /> Regresar</button>
                  <button className="btn-next" onClick={nextStep}>Revisar pedido <Ico.ArrowRight /></button>
                </div>
              </div>
            )}

            {/* ═══ PASO 3 ═══ */}
            {step === 3 && (
              <div className="panel">
                <div className="panel-head">
                  <div className="p-eyebrow">Paso 3 de 3</div>
                  <h2 className="p-title">Revisa tu pedido</h2>
                </div>
                <div className="panel-body">
                  <div className="rev-section">
                    <div className="rev-title">Productos ({totalQty})</div>
                    <div className="rev-items">
                      {items.map(item => (
                        <div className="rev-item" key={item.id}>
                          <div className={`rev-thumb bg-gradient-to-br ${item.color}`}>👗</div>
                          <div className="rev-info">
                            <div className="rev-name">{item.name}</div>
                            <div className="rev-sub">{item.catalog} · x{item.qty}</div>
                          </div>
                          <div className="rev-price">RD${(item.price*item.qty).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rev-section">
                    <div className="rev-title">Datos de entrega <button className="rev-edit" onClick={()=>setStep(1)}><Ico.Edit /> Editar</button></div>
                    <div className="rev-box">
                      <div className="rev-row"><span className="rev-lbl">Nombre</span><span className="rev-val">{delivery.firstName} {delivery.lastName}</span></div>
                      <div className="rev-row"><span className="rev-lbl">Correo</span><span className="rev-val">{delivery.email}</span></div>
                      <div className="rev-row"><span className="rev-lbl">Teléfono</span><span className="rev-val">{delivery.phone}</span></div>
                      <div className="rev-row"><span className="rev-lbl">Dirección</span><span className="rev-val">{delivery.address}, {delivery.city}, {delivery.province}</span></div>
                    </div>
                  </div>
                  <div className="rev-section">
                    <div className="rev-title">Método de pago <button className="rev-edit" onClick={()=>setStep(2)}><Ico.Edit /> Editar</button></div>
                    <div className="rev-box">
                      <div className="rev-row"><span className="rev-lbl">Método</span><span className="rev-val">{PAYMENT_METHODS.find(m=>m.id===payMethod)?.label}</span></div>
                      {payMethod==="card" && card.number && (
                        <div className="rev-row"><span className="rev-lbl">Tarjeta</span><span className="rev-val">•••• {card.number.replace(/\s/g,"").slice(-4)}</span></div>
                      )}
                    </div>
                  </div>
                </div>
                {submitError && (
                  <div className="panel-body" style={{ paddingTop: 0 }}>
                    <div className="err-box">
                      <Ico.Alert />
                      <span className="err-box-txt">{submitError}</span>
                    </div>
                  </div>
                )}
                <div className="panel-foot">
                  <button className="btn-prev" onClick={prevStep}><Ico.ArrowLeft /> Regresar</button>
                  <button className="btn-next" onClick={handleSubmit} disabled={loading}>
                    {loading ? <><span className="spin"/>Procesando…</> : <>Confirmar y pagar · RD${total.toLocaleString()}</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RESUMEN LATERAL */}
          <div className="summary">
            <div className="summ-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Resumen del pedido</span>
              <button
                type="button"
                className="btn-prev"
                onClick={refreshItems}
                disabled={refreshing}
                style={{ padding: "8px 10px", fontSize: 12 }}
              >
                {refreshing ? "Recargando..." : "Recargar"}
              </button>
            </div>

            {Array.from(new Map(items.map((i) => [i?.vendor?.id || i?.vendor?.name, i?.vendor]).entries()).values())
              .filter(Boolean)
              .length > 0 && (
              <div className="summ-trust" style={{ marginTop: 10 }}>
                {Array.from(new Map(items.map((i) => [i?.vendor?.id || i?.vendor?.name, i?.vendor]).entries()).values())
                  .filter(Boolean)
                  .map((v) => (
                    <div className="trust-item" key={v.id || v.name} style={{ gap: 10 }}>
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          background: "var(--slate-100)",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundImage: v.image_url ? `url(${v.image_url})` : "none",
                          display: "inline-block",
                        }}
                      />
                      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                        <span style={{ fontWeight: 650 }}>{v.name || "Vendedor"}</span>
                        <span style={{ fontSize: 12, color: "var(--s4)" }}>{v.phone || v.email || ""}</span>
                      </span>
                    </div>
                  ))}
              </div>
            )}
            <div className="summ-items">
              {items.map(item => (
                <div className="summ-item" key={item.id}>
                  <div
                    className={`summ-thumb bg-gradient-to-br ${item.color}`}
                    style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                  >
                    {item.imageUrl ? "" : "👗"}
                  </div>
                  <div className="summ-info">
                    <div className="summ-name">{item.name}</div>
                    {item?.vendor?.name && (
                      <div className="summ-qty" style={{ color: "var(--s4)" }}>{item.vendor.name}</div>
                    )}
                    <div className="summ-qty">x{item.qty}</div>
                  </div>
                  <div className="summ-price">RD${(item.price*item.qty).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="summ-div" />
            <div className="summ-totals">
              <div className="summ-line"><span className="summ-lbl">Subtotal</span><span className="summ-val">RD${Math.round(baseSubtotal).toLocaleString()}</span></div>
              {promoDiscount > 0 && (
                <div className="summ-line">
                  <span className="summ-lbl">Promociones</span>
                  <span className="summ-val" style={{ color: "var(--green)", fontWeight: 800 }}>−RD${Math.round(promoDiscount).toLocaleString()}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="summ-line">
                  <span className="summ-lbl">
                    Descuento{couponData?.type === "percent" ? ` (${Number(couponData?.value || 0)}%)` : ""}
                  </span>
                  <span className="summ-val" style={{ color: "var(--green)", fontWeight: 800 }}>−RD${Math.round(couponDiscount).toLocaleString()}</span>
                </div>
              )}
              <div className="summ-line"><span className="summ-lbl">Envío</span><span className="summ-val" style={{color:"var(--green)"}}>Gratis</span></div>
              <div className="summ-total">
                <span className="summ-total-lbl">Total</span>
                <span className="summ-total-val">RD${total.toLocaleString()}</span>
              </div>
              <p style={{fontSize:11,color:"var(--s4)",textAlign:"right",marginTop:4}}>ITBIS (18%) incluido</p>
            </div>
            <div className="summ-trust">
              {[{i:<Ico.Shield/>,t:"Pago cifrado SSL"},{i:<Ico.Package/>,t:"Envío a todo el país"},{i:<Ico.Check/>,t:"Garantía de satisfacción"}].map(x=>(
                <div className="trust-item" key={x.t}>{x.i}{x.t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Lexend:wght@600;700;800&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body,#root{min-height:100%;}
        body{font-family:'Nunito',sans-serif;background:#f8fafc;}
        :root{
          --b7:#1d4ed8;--b6:#2563eb;--b5:#3b82f6;--b4:#60a5fa;--b1:#dbeafe;--b0:#eff6ff;
          --t5:#06b6d4;--t4:#22d3ee;
          --s9:#0f172a;--s7:#334155;--s5:#64748b;--s4:#94a3b8;--s3:#cbd5e1;
          --s2:#e2e8f0;--s1:#f1f5f9;--s0:#f8fafc;--w:#ffffff;
          --red:#ef4444;--red-bg:rgba(239,68,68,.07);--red-bdr:rgba(239,68,68,.22);
          --green:#22c55e;
        }
        .page{opacity:0;transform:translateY(8px);transition:opacity .4s ease,transform .4s ease;}
        .page.in{opacity:1;transform:translateY(0);}

        /* Header */
        .hdr{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.94);backdrop-filter:blur(14px);border-bottom:1px solid var(--s2);}
        .hdr-in{max-width:1080px;margin:0 auto;display:flex;align-items:center;gap:16px;padding:0 28px;height:64px;}
        .back-btn{display:flex;align-items:center;gap:6px;background:none;border:1.5px solid var(--s2);border-radius:10px;padding:7px 14px;font-size:13px;font-weight:700;color:var(--s5);cursor:pointer;font-family:'Nunito',sans-serif;transition:all .18s;}
        .back-btn:hover{border-color:var(--b4);color:var(--b6);background:var(--b0);}
        .brand{display:flex;align-items:center;gap:10px;cursor:pointer;}
        .brand-name{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--s9);letter-spacing:-.4px;}
        .brand-name em{font-style:normal;background:linear-gradient(90deg,var(--b6),var(--t5));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}

        /* Stepper */
        .stepper{background:var(--w);border-bottom:1px solid var(--s2);padding:0 28px;}
        .stepper-in{max-width:1080px;margin:0 auto;display:flex;align-items:center;height:72px;}
        .s-item{display:flex;align-items:center;gap:11px;flex-shrink:0;}
        .s-line{flex:1;height:2px;background:var(--s2);margin:0 16px;border-radius:2px;overflow:hidden;min-width:40px;}
        .s-line-fill{height:100%;background:linear-gradient(90deg,var(--b6),var(--t5));border-radius:2px;transition:width .5s ease;}
        .s-circle{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;transition:all .3s ease;flex-shrink:0;}
        .s-circle.done{background:linear-gradient(135deg,var(--b7),var(--t5));color:white;box-shadow:0 4px 14px rgba(29,78,216,.32);}
        .s-circle.active{background:var(--b6);color:white;box-shadow:0 4px 14px rgba(37,99,235,.35);}
        .s-circle.idle{background:var(--s1);color:var(--s4);border:2px solid var(--s2);}
        .s-txt{display:flex;flex-direction:column;}
        .s-num{font-size:10px;font-weight:700;color:var(--s4);text-transform:uppercase;letter-spacing:.8px;}
        .s-lbl{font-family:'Lexend',sans-serif;font-size:13px;font-weight:700;}
        .s-lbl.done{color:var(--b6);}.s-lbl.active{color:var(--s9);}.s-lbl.idle{color:var(--s4);}
        @media(max-width:520px){.s-txt{display:none;}.s-item{flex:none;}.s-line{min-width:20px;}}

        /* Layout */
        .layout{max-width:1080px;margin:0 auto;padding:36px 28px 80px;display:grid;grid-template-columns:1fr 360px;gap:28px;align-items:start;}
        @media(max-width:820px){.layout{grid-template-columns:1fr;}}

        /* Panel */
        .panel{background:var(--w);border-radius:20px;border:1px solid var(--s2);overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.05);animation:pIn .35s ease;}
        @keyframes pIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .panel-head{padding:24px 28px 18px;border-bottom:1px solid var(--s1);}
        .p-eyebrow{font-size:10.5px;font-weight:700;color:var(--t5);text-transform:uppercase;letter-spacing:1.6px;margin-bottom:5px;}
        .p-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--s9);letter-spacing:-.4px;}
        .panel-body{padding:24px 28px;}
        .panel-foot{padding:0 28px 24px;display:flex;gap:12px;justify-content:flex-end;margin-top:4px;}

        /* Fields */
        .f-row-2{display:flex;gap:14px;}
        .f-row-2>*{flex:1;}
        .f-group{margin-bottom:16px;}
        .f-label{display:block;font-size:10.5px;font-weight:700;color:var(--s5);text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px;}
        .f-wrap{position:relative;}
        .f-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--s3);pointer-events:none;display:flex;align-items:center;}
        .f-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--s3);padding:4px;display:flex;border-radius:6px;transition:color .15s;}
        .f-eye:hover{color:var(--b6);}
        .f-input{width:100%;background:var(--s0);border:1.5px solid var(--s2);border-radius:12px;padding:12px 14px 12px 42px;font-size:14px;font-weight:500;color:var(--s9);font-family:'Nunito',sans-serif;outline:none;transition:all .22s;-webkit-appearance:none;}
        .f-input.no-icon{padding-left:14px;}
        .f-input::placeholder{color:var(--s3);font-weight:400;}
        .f-input:focus{border-color:var(--b6);background:var(--w);box-shadow:0 0 0 4px rgba(37,99,235,.09);}
        .f-input.err{border-color:var(--red);background:var(--red-bg);}
        .f-wrap:focus-within .f-icon{color:var(--b6);}
        .f-err{font-size:11.5px;color:var(--red);font-weight:600;margin-top:5px;}
        select.f-input{cursor:pointer;}
        textarea.f-input{padding-left:14px;resize:none;line-height:1.5;}

        /* Payment */
        .pay-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;}
        @media(max-width:480px){.pay-grid{grid-template-columns:1fr;}}
        .pay-opt{display:flex;align-items:center;gap:10px;padding:12px 15px;border:1.5px solid var(--s2);border-radius:13px;cursor:pointer;transition:all .18s;background:var(--s0);}
        .pay-opt:hover{border-color:var(--b4);background:var(--b0);}
        .pay-opt.active{border-color:var(--b6);background:var(--b0);box-shadow:0 0 0 3px rgba(37,99,235,.1);}
        .pay-ico{font-size:22px;line-height:1;}
        .pay-lbl{font-size:13px;font-weight:700;color:var(--s7);}
        .pay-sub{font-size:11px;color:var(--s4);margin-top:1px;}
        .pay-radio{width:18px;height:18px;border-radius:50%;border:2px solid var(--s3);display:flex;align-items:center;justify-content:center;margin-left:auto;flex-shrink:0;transition:all .18s;}
        .pay-opt.active .pay-radio{border-color:var(--b6);background:var(--b6);}
        .pay-radio-dot{width:7px;height:7px;border-radius:50%;background:white;}

        /* Card preview */
        .cf-preview{height:140px;border-radius:16px;padding:20px 22px;background:linear-gradient(135deg,#1e40af 0%,#0891b2 100%);position:relative;overflow:hidden;margin-bottom:22px;box-shadow:0 8px 28px rgba(29,78,216,.35);}
        .cf-preview::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 80% 20%,rgba(34,211,238,.2),transparent 55%);}
        .cf-chip{width:36px;height:26px;border-radius:5px;background:rgba(255,255,255,.25);border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(4px);margin-bottom:16px;}
        .cf-number{font-family:'Lexend',sans-serif;font-size:16px;font-weight:700;color:rgba(255,255,255,.9);letter-spacing:2px;margin-bottom:14px;}
        .cf-row{display:flex;justify-content:space-between;align-items:flex-end;}
        .cf-lbl{font-size:9px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1px;}
        .cf-val{font-size:12.5px;font-weight:700;color:white;margin-top:2px;letter-spacing:.5px;}

        /* Info box */
        .info-box{display:flex;align-items:flex-start;gap:10px;background:rgba(37,99,235,.06);border:1px solid rgba(37,99,235,.15);border-radius:12px;padding:13px 16px;margin-bottom:20px;}
        .info-box-txt{font-size:13px;color:var(--b6);font-weight:600;line-height:1.5;}
        .err-box{display:flex;align-items:flex-start;gap:10px;background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:13px 16px;margin-bottom:14px;}
        .err-box-txt{font-size:13px;color:var(--red);font-weight:600;line-height:1.5;}

        /* Review */
        .rev-section{margin-bottom:22px;}
        .rev-title{font-family:'Lexend',sans-serif;font-size:14px;font-weight:700;color:var(--s9);margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;}
        .rev-edit{display:flex;align-items:center;gap:5px;background:none;border:none;color:var(--b6);font-size:12px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;padding:4px 8px;border-radius:7px;transition:all .15s;}
        .rev-edit:hover{background:var(--b0);}
        .rev-box{background:var(--s0);border:1px solid var(--s2);border-radius:13px;padding:16px 18px;}
        .rev-row{display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:8px;}
        .rev-row:last-child{margin-bottom:0;}
        .rev-lbl{color:var(--s5);font-weight:500;}
        .rev-val{color:var(--s9);font-weight:700;text-align:right;max-width:60%;}
        .rev-items{display:flex;flex-direction:column;gap:8px;}
        .rev-item{display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--s0);border:1px solid var(--s2);border-radius:12px;}
        .rev-thumb{width:44px;height:44px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;}
        .rev-img{width:100%;height:100%;object-fit:contain;border-radius:8px;padding:4px;display:block;}
        .rev-info{flex:1;min-width:0;}
        .rev-name{font-size:13px;font-weight:700;color:var(--s9);}
        .rev-sub{font-size:11.5px;color:var(--s4);margin-top:2px;}
        .rev-price{font-family:'Lexend',sans-serif;font-size:14px;font-weight:800;color:var(--s9);flex-shrink:0;}

        /* Buttons */
        .btn-prev{display:flex;align-items:center;gap:7px;padding:13px 22px;border-radius:13px;border:1.5px solid var(--s2);background:var(--s0);font-size:14px;font-weight:700;color:var(--s7);font-family:'Nunito',sans-serif;cursor:pointer;transition:all .2s;}
        .btn-prev:hover{border-color:var(--s3);background:var(--s1);}
        .btn-next{display:flex;align-items:center;gap:8px;padding:13px 28px;border-radius:13px;border:none;background:linear-gradient(135deg,var(--b7),var(--b6),#0284c7);color:white;font-size:14.5px;font-weight:800;font-family:'Nunito',sans-serif;cursor:pointer;transition:all .25s;box-shadow:0 4px 16px rgba(29,78,216,.32);position:relative;overflow:hidden;}
        .btn-next::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.12),transparent);opacity:0;transition:opacity .2s;}
        .btn-next:hover::after{opacity:1;}
        .btn-next:hover{transform:translateY(-2px);box-shadow:0 8px 26px rgba(29,78,216,.42);}
        .btn-next:disabled{opacity:.6;cursor:not-allowed;transform:none;box-shadow:none;}
        .spin{width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:rot .65s linear infinite;}
        @keyframes rot{to{transform:rotate(360deg)}}

        /* Summary */
        .summary{position:sticky;top:88px;background:var(--w);border-radius:20px;border:1px solid var(--s2);overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.06);}
        .summ-head{padding:20px 22px 14px;font-family:'Lexend',sans-serif;font-size:16px;font-weight:800;color:var(--s9);border-bottom:1px solid var(--s1);}
        .summ-items{padding:16px 22px;display:flex;flex-direction:column;gap:10px;}
        .summ-item{display:flex;align-items:center;gap:10px;}
        .summ-thumb{width:40px;height:40px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:17px;}
        .summ-img{width:100%;height:100%;object-fit:contain;border-radius:8px;padding:4px;display:block;}
        .summ-info{flex:1;min-width:0;}
        .summ-name{font-size:12.5px;font-weight:700;color:var(--s9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .summ-qty{font-size:11px;color:var(--s4);margin-top:1px;}
        .summ-price{font-family:'Lexend',sans-serif;font-size:13px;font-weight:800;color:var(--s9);flex-shrink:0;}
        .summ-div{height:1px;background:var(--s1);margin:0 22px;}
        .summ-totals{padding:16px 22px;}
        .summ-line{display:flex;justify-content:space-between;font-size:13px;margin-bottom:9px;}
        .summ-lbl{color:var(--s5);font-weight:500;}
        .summ-val{font-weight:700;color:var(--s9);}
        .summ-total{display:flex;justify-content:space-between;padding-top:13px;border-top:2px solid var(--s9);}
        .summ-total-lbl{font-family:'Lexend',sans-serif;font-size:14px;font-weight:800;color:var(--s9);}
        .summ-total-val{font-family:'Lexend',sans-serif;font-size:20px;font-weight:800;color:var(--s9);}
        .summ-trust{padding:14px 22px;background:var(--s0);border-top:1px solid var(--s1);display:flex;flex-direction:column;gap:7px;}
        .trust-item{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:var(--s5);}
        .trust-item svg{color:var(--b5);}

      `}</style>
</>
  );
}










