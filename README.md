# README

## Nombre del Proyecto
Catalogix (Sistema de venta de catalogos digitales)

## Descripción del Proyecto
Catalogix es una plataforma completa de comercio electrónico y gestión de múltiples vendedores (multi-vendor) profundamente integrada con Odoo 19. El sistema actúa como un puente tecnológico que permite a vendedores independientes gestionar sus catálogos, inventarios, facturación y pagos desde un entorno moderno, mientras sincroniza de manera bidireccional toda la data contable, de ventas e inventario con el ERP centralizado Odoo.

## Tecnologías Utilizadas
### **Frontend (Cliente y Dashboards)**
* React 19 + Vite
* Zustand y React Context (Manejo de estados)
* React Hook Form + Zod (Validaciones)
* CSS Vanilla / Variables globales
* Recharts (Gráficas estadísticas)

### **Backend (Middleware)**
* Python 3.10+ / Flask
* Odoo JSON-RPC Client (Desarrollo a medida)
* PyJWT & Flask-CORS
* SDK de Stripe y PayPal

### **Infraestructura y Datos**
* Docker y Docker Compose
* Instancia Oficial Odoo 19
* PostgreSQL 16
* Meta Cloud API (WhatsApp)

## Características del Sistema
* **Storefront (Tienda Pública):** Exploración de catálogos, búsqueda avanzada, carrito de compras persistente y sistema de checkout multi-método.
* **Panel de Vendedores (Vendor Dashboard):** Administración de productos, configuración de precios en múltiples monedas (DOP, USD, EUR), inventario, gestión de cupones, reportes de ingresos y visualización de órdenes.
* **Panel de Administración (Admin Dashboard):** Herramientas globales de auditoría, gestión de pagos, control de catálogos y moderación de cuentas de clientes/vendedores.
* **Integración en Tiempo Real:** El backend comunica cualquier actualización de manera instantánea a Odoo, garantizando que el ERP tenga siempre la información verídica.

## Requisitos del Sistema
* Sistema Operativo: Windows, macOS o Linux.
* Motor de contenedores: **Docker** y **Docker Compose** instalados.
* Node.js v18+ (Opcional, solo si se desea ejecutar el frontend fuera de Docker).
* Python 3.10+ (Opcional, solo si se desea ejecutar el backend fuera de Docker).
* Puertos libres: `5173` (Frontend), `5000` (Backend), `8069` (Odoo), `5432` (PostgreSQL).

## Instalación del Proyecto

### Clone de repositorio de github
Abre tu terminal o consola de comandos y ejecuta:
```bash
git clone https://github.com/tu-usuario/catalogo-simple1.git
cd catalogo-simple1
```

### Configuración
1. En la carpeta raíz del proyecto, asegúrate de tener el archivo `docker-compose.yml`.
2. Dirígete a la carpeta `/backend` y copia el archivo `.env.example` para crear tu propio archivo `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Edita el archivo `.env` para configurar tus credenciales de base de datos, Stripe, PayPal, y la URL de la instancia local de Odoo.

### Paso de ejecucion del proyecto paso a paso
1. Desde la raíz del proyecto (donde se ubica el `docker-compose.yml`), construye y levanta los servicios en segundo plano:
   ```bash
   docker-compose up --build -d
   ```
2. Espera unos momentos a que los contenedores se inicialicen. Puedes verificar los logs con `docker-compose logs -f`.
3. Ingresa a `http://localhost:8069` para configurar por primera vez la base de datos de Odoo (nómbrala como se indica en tu `.env`, usualmente `catalogix`).
4. Una vez la base de datos esté lista, visita `http://localhost:5173` para acceder a la plataforma (Frontend).

## Estructura del Proyecto
```text
catalogo-simple1/
├── backend/               # Servidor intermediario Flask (Python)
│   ├── app/               # Lógica, rutas API y cliente JSON-RPC para Odoo
│   ├── requirements.txt   # Dependencias de Python
│   └── .env               # Variables de entorno
├── frontend/              # Aplicación SPA en React
│   ├── src/               # Páginas, componentes, hooks y servicios
│   ├── package.json       # Dependencias de NPM
│   └── vite.config.js     # Configuración del empaquetador
├── docker-compose.yml     # Orquestación de contenedores (App, BD, ERP)
└── README.md              # Documentación principal
```

## Uso del Sistema
El sistema consta de tres flujos principales:
1. **Público (Clientes):** Navegación libre por la tienda, adición de productos al carrito y pago sin fricciones.
2. **Vendedores:** Los usuarios con rol "vendedor" inician sesión para acceder al menú `Catalogix Vendedor`. Desde ahí, gestionan sus productos, configuran su tienda y analizan sus ventas.
3. **Administradores:** Rol superior que accede a estadísticas globales del negocio, pagos retenidos, reportes contables generales e integración directa con las opciones profundas de Odoo.

## Credenciales relevantes
*(Deberás cambiar estas credenciales en un entorno de producción)*
* **Odoo Local:** `http://localhost:8069`
  * Base de datos por defecto: `catalogix`
  * Usuario/Admin Odoo: (El que definas en la pantalla de inicialización)
* **Backend API:** `http://localhost:5000`
* **Frontend:** `http://localhost:5173`
  * Acceso Administrador (Ejemplo configurado): `gabriel123@gmail.com` / `123456789A`
  * Acceso Vendedor (Ejemplo configurado): `vendedor123@gmail.com` / `123456789A`

## APIs utilizadas (Internas y Externas)

El ecosistema de Catalogix se integra con múltiples servicios mediante diferentes APIs para ofrecer una experiencia completa y segura. A continuación se detallan tanto la API interna propia como las de terceros:

### 1. API Interna (Middleware Flask a Odoo)
Catalogix no expone la base de datos directamente al Frontend. Utiliza un **Middleware en Flask** que centraliza las peticiones mediante una arquitectura RESTful.

**Paso a paso de la implementación:**
1. **Frontend envía la petición:** La interfaz de React realiza una llamada HTTP (ej. `POST /api/vendor/products`) con los datos del formulario (incluyendo moneda, precios, nombre, imágenes).
2. **El Middleware intercepta (Flask):** El servidor recibe la llamada, valida los datos y el token JWT de seguridad para confirmar quién es el usuario.
3. **Comunicación con Odoo (JSON-RPC):** Flask traduce esta petición a un formato comprensible para el ERP y utiliza `odoo.call()` o `odoo.search_read()` para inyectar o leer registros en la base de datos Postgres de Odoo 19 de forma segura.
4. **Respuesta final:** Odoo retorna el ID del nuevo registro (ej. Producto Creado), el middleware lo transforma a una respuesta amigable (JSON) y el Frontend notifica al usuario con un mensaje de éxito.

### 2. APIs Externas Integradas
Para expandir sus funcionalidades transaccionales y de comunicación, el sistema implementa integraciones con las siguientes APIs de terceros:

* **Stripe API:** Utilizada para el procesamiento de pagos seguros con tarjeta de crédito y débito directamente en el flujo de checkout.
* **Meta Cloud API (WhatsApp):** Integrada para facilitar el contacto directo y el envío de mensajes o cotizaciones hacia los números de WhatsApp de los vendedores o administradores.
* **Google OAuth 2.0 API:** Empleada para gestionar la autenticación de usuarios (Single Sign-On), permitiendo un registro e inicio de sesión rápido y seguro utilizando cuentas de Google.

## Autor del desarrollado y Autor de administrador de proyecto
* **Autor desarrollado:** Gabriel Elias Alcala
* **Autor administrador de proyecto:** Jose Rijo

## Módulos de Odoo implementados
A continuación, se definen uno por uno los módulos y modelos del ERP gestionados por nuestra aplicación:

1. **Módulo de Contactos (`res.partner`)**: Se utiliza para almacenar toda la información de los usuarios (Clientes, Vendedores y Administradores). Aquí se manejan roles, credenciales de sesión enlazadas e información de contacto.
2. **Módulo de Inventario y Catálogo (`product.template`)**: Base de todo el sistema de ventas. Guarda el registro de cada producto subido por el vendedor, controlando su stock disponible, moneda, imágenes, códigos (SKU) y visibilidad en el portal.
3. **Módulo de Ventas (`sale.order`)**: Orquesta todo el flujo del carrito de compras. Cuando un usuario añade artículos y procesa un checkout, se genera una orden de venta en Odoo vinculando los productos y el cliente.
4. **Módulo de Facturación (`account.move`)**: Genera las facturas y asientos contables de cada venta realizada. Procesa y registra los estados de pago (ej. pagos por Stripe o en efectivo) manteniendo la contabilidad del sistema centralizada.
5. **Módulos Multi-Vendedor Personalizados (`catalog.catalog` y `catalog.vendor`)**: Tablas creadas específicamente en Odoo para nuestra plataforma. Permiten agrupar productos bajo colecciones (catálogos) y asocian configuraciones exclusivas (nombres de tienda, balances) para los vendedores individuales.
6. **Módulo de Monedas (`res.currency`)**: Implementado para asegurar que los productos puedan guardarse y valorarse internacionalmente utilizando identificadores de moneda dinámica (USD, DOP, EUR).
