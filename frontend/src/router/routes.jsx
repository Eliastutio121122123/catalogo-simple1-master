import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute, PublicRoute } from "./guards";

// Auth
import Login             from "../pages/auth/Login";
import Register          from "../pages/auth/Register";
import ForgotPassword    from "../pages/auth/ForgotPassword";
import VerifyEmail       from "../pages/auth/VerifyEmail";
import ResetPassword     from "../pages/auth/ResetPassword";

// Store
import Home              from "../pages/store/Home";
import CatalogList       from "../pages/store/CatalogList";
import CatalogDetail     from "../pages/store/CatalogDetail";
import Cart              from "../pages/store/Cart";
import Checkout          from "../pages/store/Checkout";
import OrderConfirmation from "../pages/store/OrderConfirmation";
import PaymentResult     from "../pages/store/PaymentResult";
import Search            from "../pages/store/Search";
import ProductDetail     from "../pages/store/ProductDetail";
import FlowPrototype     from "../pages/prototype/FlowPrototype";

// Layouts
import AuthLayout        from "../layouts/AuthLayout";
import AdminLayout       from "../layouts/AdminLayout";
import CustomerLayout    from "../layouts/CustomerLayout";
import VendorLayout      from "../layouts/VendorLayout";
import PublicLayout      from "../layouts/PublicLayout";

// Vendor pages ✅
import VendorDashboard   from "../pages/vendor/VendorDashboard";
import VendorProducts    from "../pages/vendor/Products";
import VendorProductForm from "../pages/vendor/ProductForm";
import VendorProductDetail from "../pages/vendor/ProductDetail";
import VendorCatalogs    from "../pages/vendor/Catalogs";
import VendorCatalogForm from "../pages/vendor/CatalogForm";
import VendorOrders      from "../pages/vendor/Orders";
import VendorOrderDetail from "../pages/vendor/OrderDetail";
import VendorCoupons     from "../pages/vendor/Coupons";
import VendorCouponForm  from "../pages/vendor/CouponForm";
import VendorInventory   from "../pages/vendor/Inventory";
import VendorInventoryMovements from "../pages/vendor/InventoryMovements";
import VendorCustomers from "../pages/vendor/Customers";
import VendorInvoices from "../pages/vendor/Invoices";
import VendorInvoiceDetail from "../pages/vendor/InvoiceDetail";


import VendorPromotions from "../pages/vendor/Promotions";
import VendorPromotionForm from "../pages/vendor/PromotionForm";
import VendorNotifications from "../pages/vendor/Notifications";
import VendorReports from "../pages/vendor/Reports";
import VendorSettings from "../pages/vendor/Settings";

// Admin pages
import AdminDashboard from "../pages/admin/Dashboard";
import AdminUsers     from "../pages/admin/Users";
import AdminVendors   from "../pages/admin/Vendors";
import AdminCatalogs  from "../pages/admin/Catalogs";
import AdminProducts  from "../pages/admin/Products";
import AdminOrders    from "../pages/admin/Orders";
import AdminPayments  from "../pages/admin/Payments";
import AdminReports   from "../pages/admin/Reports";
import AdminAudit     from "../pages/admin/AuditLog";
import AdminSettings  from "../pages/admin/Settings";

// Customer pages (pendientes)
import CustomerChangePassword from "../pages/customer/ChangePassword";
import CustomerEditProfile from "../pages/customer/EditProfile";
import CustomerProfile from "../pages/customer/Profile";
import CustomerNotifications from "../pages/customer/Notifications";
import CustomerOrderHistory from "../pages/customer/OrderHistory";
import CustomerOrderTracking from "../pages/customer/OrderTracking";
import CustomerPurchaseDetail from "../pages/customer/PurchaseDetail";
import CustomerInvoices from "../pages/customer/Invoices";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ════════════════════════════════
          AUTH — con AuthLayout compartido
      ════════════════════════════════ */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email"    element={<VerifyEmail />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
      </Route>

      {/* ════════════════════════════════
          STORE — con PublicLayout compartido
      ════════════════════════════════ */}
      <Route element={<PublicLayout />}>
        <Route path="/home"        element={<Home />} />
        <Route path="/catalogs"    element={<CatalogList />} />
        <Route path="/catalog/:id" element={<CatalogDetail />} />
        <Route path="/search"      element={<Search />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart"        element={<Cart />} />
      </Route>

      {/* ════════════════════════════════
          CHECKOUT FLOW (sin layout)
      ════════════════════════════════ */}
      <Route path="/checkout"           element={<PrivateRoute><Checkout /></PrivateRoute>} />
      <Route path="/order-confirmation" element={<PrivateRoute><OrderConfirmation /></PrivateRoute>} />
      <Route path="/payment-result"     element={<PrivateRoute><PaymentResult /></PrivateRoute>} />
      <Route path="/prototype"          element={<FlowPrototype />} />

      {/* ════════════════════════════════
          ADMIN PANEL
      ════════════════════════════════ */}
      <Route path="/admin" element={<PrivateRoute requiredRole="admin"><AdminLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users"     element={<AdminUsers />} />
        <Route path="vendors"   element={<AdminVendors />} />
        <Route path="catalogs"  element={<AdminCatalogs />} />
        <Route path="products"  element={<AdminProducts />} />
        <Route path="orders"    element={<AdminOrders />} />
        <Route path="payments"  element={<AdminPayments />} />
        <Route path="reports"   element={<AdminReports />} />
        <Route path="audit"     element={<AdminAudit />} />
        <Route path="settings"  element={<AdminSettings />} />
      </Route>

      {/* ════════════════════════════════
          VENDOR PANEL ✅ ACTIVO
      ════════════════════════════════ */}
      <Route path="/vendor" element={<PrivateRoute requiredRole="vendor"><VendorLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/vendor/dashboard" replace />} />
        <Route path="dashboard"         element={<VendorDashboard />} />
        <Route path="products"          element={<VendorProducts />} />
        <Route path="products/new"      element={<VendorProductForm />} />
        <Route path="products/:id"      element={<VendorProductDetail />} />
        <Route path="products/:id/edit" element={<VendorProductForm />} />
        <Route path="catalogs"          element={<VendorCatalogs />} />
        <Route path="catalogs/new"      element={<VendorCatalogForm />} />
        <Route path="catalogs/:id/edit" element={<VendorCatalogForm />} />
        <Route path="orders"           element={<VendorOrders />} />
        <Route path="orders/:id"       element={<VendorOrderDetail />} />
        <Route path="coupons"          element={<VendorCoupons />} />
        <Route path="coupons/new"      element={<VendorCouponForm />} />
        <Route path="coupons/:id"      element={<VendorCouponForm />} />
        <Route path="customers"       element={<VendorCustomers />} />
        <Route path="invoices"        element={<VendorInvoices />} />
        <Route path="invoices/:id"    element={<VendorInvoiceDetail />} />


        <Route path="inventory"       element={<VendorInventory />} />
        <Route path="inventory-movements" element={<VendorInventoryMovements />} />
        <Route path="promotions"     element={<VendorPromotions />} />
        <Route path="promotions/new" element={<VendorPromotionForm />} />
        <Route path="promotions/:id" element={<VendorPromotionForm />} />
        <Route path="notifications"  element={<VendorNotifications />} />
        <Route path="reports"       element={<VendorReports />} />
        <Route path="settings"      element={<VendorSettings />} />
      </Route>

      {/* ════════════════════════════════
          CUSTOMER PANEL
      ════════════════════════════════ */}
      <Route path="/customer" element={<PrivateRoute requiredRole={["customer", "vendor"]}><CustomerLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/customer/profile" replace />} />
        <Route path="change-password" element={<CustomerChangePassword />} />
        <Route path="profile"  element={<CustomerProfile />} />
        <Route path="edit-profile"  element={<CustomerEditProfile />} />
        <Route path="notifications"  element={<CustomerNotifications />} />
        <Route path="orders"   element={<CustomerOrderHistory />} />
        <Route path="orders/:id/tracking"   element={<CustomerOrderTracking />} />
        <Route path="purchases/:id"   element={<CustomerPurchaseDetail />} />
        <Route path="invoices" element={<CustomerInvoices />} />
      </Route>

      {/* ════════════════════════════════
          CATCH-ALL
      ════════════════════════════════ */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
