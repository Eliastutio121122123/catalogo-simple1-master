# Catalogix (Catálogo Simple)

Catalogix es una plataforma completa de comercio electrónico y gestión de vendedores (multi-vendor) profundamente integrada con **Odoo 19**. 

El sistema se compone de un Front-End moderno y ultrarrápido construido con React y Vite, y un Backend robusto en Flask que actúa como middleware y puente ligero mediante **JSON-RPC** hacia el ERP de Odoo, el cual maneja la facturación, los inventarios y la contabilidad.

---

## 🚀 Características Principales

* **Aplicación de Tienda (Storefront):** Catálogo de productos, carrito de compras persistente, y checkout integrado (soporte para Stripe, PayPal, Transferencias y Efectivo).
* **Panel de Vendedores (Vendor Dashboard):** Los vendedores pueden gestionar sus propios productos, inventario, precios, cupones, promociones y visualizar sus reportes y métricas de ventas.
* **Panel de Administración (Admin Dashboard):** Herramientas globales de control para administradores, enfocadas en auditar transacciones, pagos, catálogos, órdenes de clientes y moderar cuentas.
* **Integración Nativa con Odoo 19:** Utilización del moderno API JSON-RPC de Odoo para mantener el catálogo, el inventario, perfiles de usuario y asientos contables sincronizados en tiempo real.
* **Sistema Seguro:** Autenticación local mediante JWT para la API en conjunción con validación de sesiones directas de Odoo.

---

## 🛠️ Tecnologías Utilizadas

### **Frontend**
* **Framework:** React 19 + Vite
* **Estado:** Zustand (Global) + React Context
* **Formularios & Validación:** React Hook Form + Zod
* **Estilos:** CSS Modules / Variables Globales
* **Gráficas:** Recharts

### **Backend**
* **Framework:** Flask (Python) con Blueprints para modularización de micro-servicios.
* **Integración ERP:** Cliente personalizado Odoo JSON-RPC, adaptado para la versión 19.
* **Pagos:** SDK de Stripe y PayPal integrados en backend y frontend.
* **Seguridad:** PyJWT, Flask-CORS.

### **Infraestructura**
* **Contenedores:** Docker & Docker Compose
* **Base de Datos:** PostgreSQL 16 (Dedicado para Odoo)
* **ERP:** Instancia de Odoo 19 Oficial.

---

## 📂 Estructura del Proyecto

```text
catalogo-simple1/
├── backend/               # Servidor Flask (Intermediario a Odoo)
│   ├── app/               # ── Blueprints, integración API y Odoo (client.py)
│   ├── odoo_module/       # ── Módulos o addons customizados para cargar en Odoo
│   ├── Dockerfile         # ── Dockerfile de Python/Flask
│   └── requirements.txt   # ── Dependencias del backend
├── frontend/              # Aplicación SPA React
│   ├── src/               # ── Componentes, páginas, servicios y hooks
│   ├── Dockerfile         # ── Dockerfile con Nginx/Servidor estático
│   └── package.json       # ── Dependencias de NPM
├── docs/                  # Documentación extendida
├── docker-compose.yml     # Orquestación de contenedores (Frontend, Backend, Odoo, DB)
└── README.md              # Este archivo
```

---

## ⚙️ Requisitos Previos

Asegúrate de tener instalado en tu máquina local:
- [Docker](https://www.docker.com/get-started) y Docker Compose.
- (Opcional, para desarrollo local) Node.js v18+ y Python 3.10+

---

## 🏃‍♂️ Entorno de Desarrollo Rápido con Docker

La forma más sencilla de levantar la aplicación es utilizando el archivo `docker-compose.yml` provisto, el cual configura:
1. Una base de datos PostgreSQL.
2. El contenedor de Odoo 19.
3. El frontend de React.
4. El backend de Flask.

### Pasos para iniciar:

1. **Clonar y configurar entorno:**
   Copia los archivos `.env.example` tanto en la raíz como dentro de la carpeta `/backend/` a un archivo `.env` local, ajustando las claves según tus credenciales de Stripe u Odoo.

   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Levantar los servicios:**
   Desde la raíz del proyecto, ejecuta corporizar los contenedores:

   ```bash
   docker-compose up --build -d
   ```

3. **Verificar servicios en ejecución:**
   - **Frontend (Sitio Público y Dashboards):** `http://localhost:5173` o `http://localhost:80` (según tu asignación de mapeos)
   - **Backend API (Flask):** `http://localhost:5000`
   - **Odoo Local (ERP Backend):** `http://localhost:8069`

*(Nota: En la primera ejecución, deberás configurar una base de datos en `http://localhost:8069` con el nombre `catalogix` e instalar los módulos bases desde Odoo o mediante comandos provistos en la documentación)*

---

## 🔐 Recuperación de contraseña (Forgot Password)

El proyecto incluye pantallas de **Recuperar contraseña** (`/forgot-password`) y **Restablecer contraseña** (`/reset-password?token=...`) y estos endpoints en el backend:

- `POST /api/auth/forgot-password` (genera token y envía correo si está habilitado)
- `POST /api/auth/validate-reset-token`
- `POST /api/auth/reset-password`

Para que llegue un correo real a tu bandeja:

- En `backend/.env` activa `SEND_RESET_EMAIL=true`
- Elige proveedor: `RESET_EMAIL_PROVIDER=smtp` (recomendado) o `RESET_EMAIL_PROVIDER=odoo`
- Si usas SMTP, configura `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_USE_TLS/SMTP_USE_SSL` (ver `backend/.env.example`)

En desarrollo, si `FLASK_DEBUG=true`, el backend devuelve `reset_url` en la respuesta para que puedas probar sin depender del correo.

---

## 💬 Integración WhatsApp (Meta Cloud API)

Se agregó una integración de WhatsApp basada en clases (OOP) dentro del Backend Flask, con:

- **Env vars** en `backend/.env` (ver `backend/.env.example`).
- **API para envío** (requiere JWT): `POST /api/whatsapp/messages/text` y `POST /api/whatsapp/messages/template`.
- **Webhook** de Meta: `GET/POST /api/whatsapp/webhook` (verificación por `WHATSAPP_WEBHOOK_VERIFY_TOKEN`).
- **Seguridad recomendada**: define `WHATSAPP_APP_SECRET` para validar `X-Hub-Signature-256` en el webhook.

Opcional: `WHATSAPP_NOTIFY_PAYMENTS=true` intenta notificar por WhatsApp cuando Stripe confirma el pago (webhook) de una factura.

---

## 🤝 Contribuir

Las sugerencias y mejoras son bienvenidas. Para organizar el trabajo:
1. Sigue convenciones de nombres estándar en ramas `feature/...` o `bugfix/...`.
2. Mantén la lógica de visualización (Frontend) separada de la lógica de integración y reglas de negocio (Backend/Odoo).
3. Escribe hooks o servicios bien documentados si agregas alguna llamada API a Odoo nueva.
