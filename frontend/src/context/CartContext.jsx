import { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import authService from "../services/odoo/authService";
import { cartService } from "../services/odoo/cartService";

export const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

class CartPresenter {
  constructor(normalizer) {
    this.normalizer = normalizer;
  }

  add(items, product) {
    const list = Array.isArray(items) ? items : [];
    const normalized = this.normalizer ? this.normalizer.normalize(product) : product;
    const existing = list.find((i) => i.id === normalized.id);
    if (existing) {
      return list.map((i) =>
        i.id === normalized.id ? { ...i, qty: i.qty + (normalized.qty || 1) } : i
      );
    }
    return [...list, { ...normalized, qty: normalized.qty || 1 }];
  }

  remove(items, productId) {
    const list = Array.isArray(items) ? items : [];
    return list.filter((i) => i.id !== productId);
  }

  updateQty(items, productId, qty) {
    const list = Array.isArray(items) ? items : [];
    if (qty <= 0) return this.remove(list, productId);
    return list.map((i) => (i.id === productId ? { ...i, qty } : i));
  }

  count(items) {
    const list = Array.isArray(items) ? items : [];
    return list.reduce((s, i) => s + (i.qty || 0), 0);
  }

  total(items) {
    const list = Array.isArray(items) ? items : [];
    return list.reduce((s, i) => s + (Number(i.price || 0) * (i.qty || 0)), 0);
  }
}

class CartSyncQueue {
  constructor(service, delayMs = 500) {
    this.service = service;
    this.delayMs = delayMs;
    this.timer = null;
    this.pending = null;
  }

  schedule(items, cartId, onSaved, onError) {
    this.pending = { items, cartId, onSaved, onError };
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.delayMs);
  }

  async flush() {
    const payload = this.pending;
    this.pending = null;
    if (!payload) return;
    try {
      const res = await this.service.saveCart(payload.items, payload.cartId);
      const nextId = res?.cart_id || res?.cartId || res?.id;
      if (payload.onSaved) payload.onSaved(nextId);
    } catch (err) {
      if (payload.onError) payload.onError(err);
    }
  }
}

class CartItemNormalizer {
  normalize(product) {
    const base = product || {};
    const images = Array.isArray(base.images) ? base.images : [];
    const imageUrl =
      base.imageUrl ||
      base.image ||
      images.find((img) => typeof img === "string") ||
      "";
    return {
      ...base,
      id: base.id || base.productId,
      productId: base.productId || base.id,
      imageUrl,
    };
  }
}

// Instanciar dependencias fuera del render para evitar problemas con useRef durante el render
const normalizer = new CartItemNormalizer();
const presenter = new CartPresenter(normalizer);
const syncQueue = new CartSyncQueue(cartService, 450);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [remoteEnabled, setRemoteEnabled] = useState(authService.isAuthenticated());
  const cartIdRef = useRef(null);

  useEffect(() => {
    cartIdRef.current = cartId;
  }, [cartId]);

  useEffect(() => {
    let active = true;
    if (!remoteEnabled) return undefined;

    (async () => {
      try {
        const payload = await cartService.loadHydratedCart();
        if (!active) return;
        setCartItems(payload.items);
        setCartId(payload.cartId);
      } catch {
        if (!active) return;
        setRemoteEnabled(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [remoteEnabled]);

  const addToCart = (product) => {
    const nextItems = presenter.add(cartItems, product);
    setCartItems(nextItems);
    if (remoteEnabled) {
      syncQueue.schedule(nextItems, cartIdRef.current, (nextId) => {
        if (nextId && nextId !== cartIdRef.current) setCartId(nextId);
      });
    }
  };

  const removeFromCart = (productId) => {
    const nextItems = presenter.remove(cartItems, productId);
    setCartItems(nextItems);
    if (remoteEnabled) {
      syncQueue.schedule(nextItems, cartIdRef.current, (nextId) => {
        if (nextId && nextId !== cartIdRef.current) setCartId(nextId);
      });
    }
  };

  const updateQty = (productId, qty) => {
    const nextItems = presenter.updateQty(cartItems, productId, qty);
    setCartItems(nextItems);
    if (remoteEnabled) {
      syncQueue.schedule(nextItems, cartIdRef.current, (nextId) => {
        if (nextId && nextId !== cartIdRef.current) setCartId(nextId);
      });
    }
  };

  const clearCart = () => {
    setCartItems([]);
    if (remoteEnabled) {
      syncQueue.schedule([], cartIdRef.current, (nextId) => {
        if (nextId && nextId !== cartIdRef.current) setCartId(nextId);
      });
    }
  };

  // Memoizar estos valores para evitar re-cálculos si items no cambian
  const cartCount = useMemo(() => presenter.count(cartItems), [cartItems]);
  const cartTotal = useMemo(() => presenter.total(cartItems), [cartItems]);

  const cartValue = {
    cartItems,
    cartId,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    cartCount,
    cartTotal,
    remoteEnabled,
  };

  return (
    <CartContext.Provider value={cartValue}>
      {children}
    </CartContext.Provider>
  );
}
