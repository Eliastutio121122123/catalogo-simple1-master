# Manual de Usuario - Catalogix

Bienvenido al sistema **Catalogix**, una plataforma de comercio electrónico multi-vendedor. Este manual está diseñado para guiarte en el uso diario de la plataforma, dependiendo del rol asignado a tu cuenta.

## 1. Registro e Ingreso al Sistema
Al ingresar a la interfaz principal (Store), podrás navegar por todo el catálogo como **Visitante**.
Para realizar operaciones, deberás ingresar desde la pantalla de *Login*:
1. Ingresa tu correo electrónico registrado y contraseña.
2. El sistema identificará automáticamente si eres **Cliente (Customer)**, **Vendedor (Vendor)** o **Administrador (Admin)**, redirigiéndote a la pantalla correcta.

---

## 2. Perfil de Cliente (Escaparate Público)
Si tu cuenta tiene permisos de comprador, tu inicio transcurre en la tienda principal:

- **Catálogo y Búsqueda:** Navega por los artículos. Puedes utilizar la barra de búsqueda superior y los filtros laterales para encontrar lo que necesitas.
- **Carrito de Compras:** 
  - Haciendo click en "Añadir al Carrito" en la ficha de un producto, verás actualizarse el contador en el botón flotante del carrito.
  - Podrás modificar cantidades o eliminar ítems dentro del panel lateral o la vista detallada de carrito.
- **Proceso de Pago (Checkout):** 
  - Dirígete a tu carrito y presiona "Ir al Checkout".
  - Llena tu información de envío (si corresponde).
  - Elige el método de pago (Tarjeta / PayPal / Efectivo o Transferencia). Si eliges pasarelas digitales, la transacción se procesará en tiempo real de forma segura.

---

## 3. Perfil de Vendedor (Panel Vendor)
Si eres propietario de una tienda afiliada, tendrás acceso a tu propio panel de control (*Vendor Dashboard*):

- **Dashboard Principal:** Al ingresar podrás observar gráficas rápidas sobre tus ingresos diarios, mensuales, y el porcentaje de ventas aprobadas versus pendientes.
- **Catálogo / Productos:** 
  - Visualiza tus listados y administra el precio y fotografías de tus productos.
  - Odoo controla rigurosamente tu stock, por lo que tus clientes no podrán comprar artículos marcados con cantidad 0 si lo configuras así.
- **Seguimiento de Órdenes:** Visualiza en tiempo real cuando un cliente realiza una compra de tus artículos. Actualiza el estado de envío y confirma entregas.
- **Cupones y Promociones:** Puedes generar códigos de descuento que serán validados de forma inteligente por la tienda.

---

## 4. Perfil de Administrador (Panel Administrativo)
El perfil directivo o "Super-Usuario" de la tienda maneja toda la infraestructura globalmente:

- **Dashboard General de Métricas:** Observa todas las transacciones de todos los vendedores de forma unificada.
- **Gestión de Pagos (`Payments`):**
  - Módulo donde ocurren las consolidaciones.
  - Permite revisar estatus de tarjetas declinadas (*Chargebacks*), compras pendientes por transferencias bancarias manuales que debes "Aprobar", y filtros profundos de auditoría de fraude.
- **Administración Cuentas (Users & Vendors):** Aquí podrás sancionar o aprobar las solicitudes de creación de nuevas cuentas de tiendas y suspender tiendas morosas o catalogar usuarios problemáticos.
- **Integración Contable (Vía Odoo):** 
  Para auditorías financieras avanzadas (Asientos contables, P&L, Libros mayores), el administrador puede acceder con sus mismas credenciales directo por la URL interna de Odoo (`puerto :8069`) usando el entorno avanzado y nativo ERP.

---

### ¿Necesitas ayuda extra?
Si algo falla en las interfaces de pago o los tableros no se actualizan (Spinners interminables o un "Error de Autenticación"), contacta al responsable del sistema para verificar posibles desconexiones entre la capa web y el ERP.
