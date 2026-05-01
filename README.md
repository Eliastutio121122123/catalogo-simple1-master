# 🛒 Catalogix - Plataforma E-Commerce Multi-Vendedor y Odoo ERP

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?logo=flask)
![Odoo](https://img.shields.io/badge/Odoo-19.0-714B67?logo=odoo)

## 📖 1. Descripción del Proyecto

**Catalogix** es un ecosistema integral diseñado para revolucionar el comercio electrónico mediante un modelo **Multi-Vendedor (Multi-Vendor)**. La plataforma sirve como puente tecnológico entre una experiencia de usuario moderna (frontend en React) y un potente sistema de planificación de recursos empresariales (Odoo 19).

Permite a múltiples comerciantes independientes (vendedores) crear, personalizar y administrar sus propias tiendas digitales (catálogos), manteniendo un control absoluto sobre su inventario, políticas de precios (multi-moneda), cupones de descuento y órdenes de venta. Simultáneamente, el sistema sincroniza **absolutamente todos** los procesos transaccionales, contables y de stock con la base de datos centralizada de Odoo en tiempo real, garantizando una administración sin fisuras y con respaldo fiscal/contable.

---

## 🚀 2. Arquitectura del Sistema

Catalogix implementa una arquitectura moderna de **Microservicios Híbridos / API Gateway**:

1. **Frontend (Capa de Presentación):** SPA (Single Page Application) reactiva que consume endpoints REST.
2. **Backend / Middleware (Capa de Negocio y Enrutamiento):** Un servidor Flask ágil que no posee base de datos propia, sino que orquesta y traduce las peticiones HTTP a llamadas JSON-RPC.
3. **ERP Odoo (Capa de Datos y Core de Negocio):** Actúa como la única fuente de verdad (Single Source of Truth) procesando ventas, contactos, facturas e inventario.

---

## ✨ 3. Funcionalidades Detalladas

El sistema se divide en 3 grandes ecosistemas, cada uno enfocado en un rol específico de usuario.

### 🛍️ 3.1. Ecosistema de Clientes (Storefront)
*   **Navegación Intuitiva:** Exploración fluida de miles de productos con filtros dinámicos (categoría, rango de precios, vendedor).
*   **Gestión de Carrito Avanzada:** Carrito persistente en memoria y `localStorage`, cálculo de subtotales, impuestos y aplicación dinámica de cupones de descuento.
*   **Checkout Simplificado (Fricción Cero):** Integración directa de un flujo de pago con un solo clic. Validación instantánea de tarjetas.
*   **Visualización de Catálogos Personalizados:** Posibilidad de visitar perfiles de "Tiendas" o "Catálogos" específicos de cada vendedor.
*   **Autenticación Fluida:** Login social con Google o por correo tradicional.

### 🏪 3.2. Ecosistema de Vendedores (Vendor Dashboard)
*   **Gestión de Inventario PIM:** Subida masiva o individual de productos. Definición de SKU, código de barras, imágenes múltiples y descripciones enriquecidas.
*   **Pricing Dinámico Multi-Moneda:** Asignación de precios en USD, DOP o EUR, con cálculos automáticos en Odoo según la tasa de cambio del día.
*   **Módulo de Promociones y Cupones:** Creación de códigos de descuento (porcentajes o montos fijos) con fechas de caducidad.
*   **Reportes Estadísticos Interactivos:** Gráficas de ventas, ingresos mensuales, productos estrella e historial de órdenes.
*   **Facturación (Exportación Excel/PDF):** Descarga de documentos con branding corporativo y cumplimiento de estructuras tabulares.
*   **Manejo de Perfil y Branding:** Personalización de su catálogo con logos, banners y descripciones únicas.

### 👑 3.3. Ecosistema Administrativo (Admin Dashboard)
*   **Auditoría y Trazabilidad:** Logs detallados sobre inicios de sesión, cambios críticos de datos y errores de sincronización.
*   **Gestión de Usuarios Global:** Activación, suspensión o eliminación de cuentas (Clientes y Vendedores).
*   **Aprobación de Vendedores:** Flujo de onboarding donde un admin debe validar los datos antes de que el catálogo sea público.
*   **Métricas Macro:** Visualización de la salud financiera de toda la plataforma, retenciones de pago y comisiones (si aplican).
*   **Sincronización Manual/Forzada Odoo:** Herramientas para corregir discrepancias o forzar actualizaciones masivas de catálogos.

---

## 🔌 4. Dónde encontrar los Endpoints de la API

La aplicación cuenta con una estructura robusta de rutas centralizada en el directorio de `routers` del backend y los `services` del frontend.

### 📌 En el Backend (Flask):
Los endpoints se encuentran modularizados en `backend/app/router/`. Todos están registrados bajo el prefijo `/api` (ej. `/api/auth/login`).
*   **Autenticación:** `auth.py`, `users.py`
*   **Público/Storefront:** `store.py`, `products.py`, `catalogs.py`
*   **Panel de Vendedores:** `vendor_dashboard.py`, `vendor_products.py`, `vendor_orders.py`, `vendor_inventory.py`, `vendor_promotions.py`, `vendor_invoices.py`, etc.
*   **Panel de Administración:** `admin_dashboard.py`, `admin_users.py`, `admin_products.py`, `admin_audit.py`, etc.
*   **Utilidades y Pagos:** `payments.py`, `whatsapp.py`, `currencies.py`

### 📌 En el Frontend (React):
Las llamadas a estos endpoints están encapsuladas en la carpeta `frontend/src/services/flask/` a través de **Axios**, permitiendo una fácil reutilización e inyección de tokens JWT en los interceptores.

---

## 📦 5. Dependencias del Frontend Explicadas al Detalle

El proyecto cliente está construido con React 19 y Vite. Cada librería ha sido seleccionada cuidadosamente por su rendimiento y tamaño.

### Core y Estructura
1.  **`react` (^19.2.0) y `react-dom` (^19.2.0):** El motor principal. Proveen la arquitectura de componentes y el Virtual DOM hiper-optimizado.
2.  **`react-router-dom` (^7.13.0):** Manejo del enrutamiento del lado del cliente. Permite navegar entre el dashboard, el login y la tienda pública sin recargar la página.
3.  **`zustand` (^5.0.11):** Manejador de estados globales minimalista. Se utiliza para persistir la información del carrito de compras y los tokens de sesión de los usuarios. Más ligero que Redux.

### Conectividad y Utilidades
4.  **`axios` (^1.13.5):** Cliente HTTP basado en promesas. Se configura globalmente con interceptores para añadir el `Authorization: Bearer <token>` en cada petición.
5.  **`date-fns` (^4.1.0):** Herramienta poderosa y modular para el formateo, cálculo y manipulación de fechas (Ej: "Hace 5 minutos", "dd/mm/yyyy").
6.  **`lucide-react` (^0.575.0):** Librería de iconografía basada en SVG, asegurando que todos los íconos del sistema mantengan un estilo consistente y limpio.

### Formularios y Validación
7.  **`react-hook-form` (^7.71.2):** Gestión ultra-rápida de formularios no controlados. Minimiza los re-renderizados cuando el usuario teclea (muy útil en creación de productos).
8.  **`zod` (^4.3.6):** Validación de esquemas fuertemente tipados en TypeScript/JavaScript. Se asegura que un "precio" sea realmente un número o que el email tenga un formato válido.
9.  **`@hookform/resolvers` (^5.2.2):** El puente perfecto entre `react-hook-form` y `zod` para lanzar errores visuales de manera automática.

### Interfaz y Experiencia de Usuario (UI/UX)
10. **`recharts` (^3.7.0):** Componentes basados en React para generar gráficos de D3.js. Se emplea en el Dashboard para pintar ingresos, tendencias de ventas y estadísticas.
11. **`react-hot-toast` (^2.6.0):** Notificaciones emergentes (Toasts) amigables, ligeras y animadas para informar sobre éxito (producto añadido) o errores.
12. **`@tanstack/react-table` (^8.21.3):** Potente herramienta "headless" para construir tablas avanzadas (paginación, filtros, ordenamiento) utilizadas masivamente en los paneles de administración y vendedores.

### Integraciones Externas / Archivos
13. **`@stripe/react-stripe-js` y `@stripe/stripe-js`:** Componentes seguros y oficiales para montar la pasarela de pagos (tarjetas) sin que Catalogix toque información sensible (Cumplimiento PCI).
14. **`@paypal/react-paypal-js`:** Componente para la integración de PayPal (Mantenido como legado/alternativa de pago secundario).
15. **`xlsx` (^0.18.5) y `file-saver` (^2.0.5):** Combinación clave para formatear la información de la tabla en el navegador y forzar la descarga en formato Excel (`.xlsx`) y hojas de cálculo estructuradas.
16. **`qrcode` (^1.5.3):** Generación dinámica de Códigos QR, usualmente para perfiles de vendedores o confirmaciones de órdenes en sitio.

---

## 🐍 6. Dependencias del Backend (Middleware) Explicadas al Detalle

El backend, desarrollado en Python 3.10+, actúa estrictamente como intermediario inteligente.

1.  **`flask` (>=3.0.0):** El microframework principal. Liviano, rápido de iniciar y excelente para arquitecturas de microservicios. Expone los endpoints REST.
2.  **`flask-cors` (>=4.0.0):** Middleware de seguridad (Cross-Origin Resource Sharing). Impide que dominios ajenos consuman nuestra API. Configurado para aceptar conexiones desde el Frontend (`localhost:5173`).
3.  **`PyJWT` (>=2.8.0):** Generador y validador de JSON Web Tokens (JWT). Toda la seguridad del sistema se basa en él: tras un login exitoso en Odoo, Flask emite un token firmado.
4.  **`python-dotenv` (>=1.0.0):** Extrae y carga dinámicamente las claves secretas (APIs, contraseñas, IPs) desde un archivo `.env` que nunca se sube a GitHub, protegiendo las credenciales.
5.  **`gunicorn` (>=21.2.0):** Servidor HTTP WSGI para producción. A diferencia de Flask puro, Gunicorn maneja peticiones asíncronas y concurrentes con múltiples "workers" haciendo el sistema escalable.
6.  **`requests` (>=2.31.0):** Cliente HTTP sincrónico. Se usa dentro de las clases `OdooConnector` para realizar llamadas JSON-RPC al core de Odoo, o para comunicarse con Meta/Google API.
7.  **`stripe` (>=10.0.0):** SDK oficial de Stripe en Python. Se usa para crear los "PaymentIntents", confirmar fondos y notificar a Odoo que una factura está cobrada.
8.  **`google-auth` (==2.38.0):** Librería oficial que valida criptográficamente que los tokens recibidos desde el login de Google del Frontend son legítimos, evitando suplantación de identidad.
9.  **`cryptography`, `pyasn1`, `tzdata`:** Librerías de soporte requeridas para manejo robusto de encriptación y procesamiento exacto de zonas horarias de órdenes internacionales.

---

## 🌐 7. APIs Externas Integradas

Para proporcionar un servicio moderno y de grado empresarial, Catalogix utiliza los siguientes servicios de terceros:

### 💳 A. Stripe Payments API
**Uso:** Procesador de pagos principal.
**Cómo funciona:** El usuario ingresa la tarjeta en el frontend. Stripe retorna un token que se envía a Flask. Flask utiliza el SDK para autorizar un pago (`PaymentIntent`). Si es exitoso, Flask le indica a Odoo que valide la factura del cliente y actualice la contabilidad del sistema automáticamente.

### 📱 B. Meta Cloud API (WhatsApp Business)
**Uso:** Notificaciones, enlaces y comunicación omnicanal.
**Cómo funciona:** Los clientes y administradores pueden compartir catálogos y órdenes mediante WhatsApp. En flujos B2B, envía plantillas o links directos con parámetros UTM preconfigurados.

### 🔐 C. Google OAuth 2.0 API
**Uso:** SSO (Single Sign-On).
**Cómo funciona:** Otorga a los usuarios una alternativa rápida de registro. El sistema valida el token de Google y, si el correo no existe, crea automáticamente un registro `res.partner` (Cliente/Vendedor) en Odoo y le permite el acceso, devolviendo el JWT propio de Catalogix.

### 🏢 D. Odoo XML/JSON-RPC API (La fuente de la verdad)
**Uso:** Aunque es interna en el sentido del proyecto, es un protocolo externo entre Flask y Odoo.
**Cómo funciona:** En vez de hacer queries directos a PostgreSQL, Flask llama los controladores nativos de Odoo (métodos `create`, `write`, `search_read`). Esto garantiza que se ejecuten todos los hooks de Odoo (disparos automáticos de contabilidad, reabastecimiento, impuestos).

---

## 🏗️ 8. Módulos de Odoo Implementados (Modelos de Base de Datos)

Para lograr el soporte de Multi-Vendor, se explotan y modifican ciertos modelos estándar de Odoo 19 y se desarrollan lógicas custom:

1.  **`res.partner` (Contactos/Usuarios):** Almacena Clientes, Vendedores y Admins. Utiliza flags (booleanos) para determinar el rol.
2.  **`product.template` y `product.product` (Inventario):** Cada producto se asocia fuertemente al `res.partner` del Vendedor. Maneja inventario global (`qty_available`) y la lista de precios.
3.  **`sale.order` y `sale.order.line` (Ventas):** El carrito de compras crea una "Orden de Venta" en Odoo, primero en estado "Borrador" (`draft`) y al pagarse pasa a "Orden Confirmada" (`sale`).
4.  **`account.move` (Facturación y Pagos):** Central de operaciones contables. Al confirmarse la venta, se genera una factura (`out_invoice`).
5.  **`res.currency` (Monedas):** Soporte activo a ventas cruzadas, manejando tasas de cambio del día (DOP, USD, EUR) de modo que Odoo sepa los márgenes exactos.

---

## 🛠️ 9. Instalación y Puesta en Marcha (Paso a Paso Detallado)

### Requisitos del Sistema
*   Motor de contenedores: **Docker** y **Docker Compose** (Indispensables).
*   Puertos Libres: `5173` (Frontend), `5000` (Backend), `8069` (Odoo), `5432` (PostgreSQL).

### Paso 1: Clonar y Preparar el Entorno
```bash
git clone https://github.com/tu-usuario/catalogo-simple1.git
cd catalogo-simple1
```

### Paso 2: Configurar las Variables de Entorno (Backend)
```bash
cd backend
cp .env.example .env
```
Edita este `.env` con tus credenciales de Stripe (Claves Secretas de Prueba) y configura tu clave de encriptación (JWT Secret).

### Paso 3: Orquestar Contenedores con Docker
Retorna a la raíz del proyecto y compila:
```bash
docker-compose up --build -d
```
Esto descargará la imagen de PostgreSQL 16 y la oficial de Odoo 19, además de construir los contenedores de Node (Vite) y Python (Gunicorn).

### Paso 4: Inicialización de Odoo
Abre `http://localhost:8069`. El sistema de Odoo requerirá crear la base de datos maestra.
**Nombre de BD:** `catalogix` (Debe coincidir con la variable ODOO_DB de tu backend).
Al crearla, instala los módulos base de E-commerce, Facturación y Ventas desde la sección de "Aplicaciones" de Odoo.

### Paso 5: Script de Auto-Configuración
Para evitar configurar cuentas contables y monedas manualmente en Odoo, puedes ejecutar el script Python provisto:
```bash
python setup_odoo_accounting.py
```
Este configurará República Dominicana como país, impuestos y diarios de pago.

### Paso 6: Listo para usar
Visita `http://localhost:5173`. El frontend se conectará con el Middleware y el Middleware con Odoo. ¡El ecosistema está activo!

---

## 👨‍💻 10. Autores y Contribuciones

*   **Autor Desarrollador Principal y Arquitecto:** Gabriel Elias Alcala
*   **Autor Administrador del Proyecto:** Jose Rijo

Proyecto privado bajo desarrollo cerrado.
