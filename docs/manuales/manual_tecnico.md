# Manual Técnico - Catalogix

## 1. Introducción
Este documento detalla la arquitectura, configuración y despliegue del proyecto **Catalogix** (Catálogo Simple 1). Está dirigido a desarrolladores, ingenieros DevOps y administradores de sistemas responsables del mantenimiento del código y de los servidores.

## 2. Arquitectura del Sistema
El sistema se compone de una arquitectura en tres capas principales:

1. **Frontend (Capa de Presentación):** Desarrollado como una Single Page Application (SPA) usando **React 19** y **Vite**. Manejo del estado centralizado mediante **Zustand**. No usa un motor de SSR, se renderiza completamente del lado del cliente y se comunica exclusivamente mediante API tipo REST/JSON.
2. **Backend / Middleware (Capa Intermedia):** API desarrollada en **Python (Flask)**. Actúa como capa de seguridad y orquestación. Emite los JSON Web Tokens (JWT) para la sesión del Frontend y centraliza la lógica compleja de negocio, pagos con **Stripe/PayPal** y validaciones de datos antes de impactar la capa de datos.
3. **ERP / Base de Datos (Capa de Persistencia):** **Odoo 19** sustentado sobre **PostgreSQL 16**. Odoo actúa como motor principal de reglas de negocio para facturas, manejo real del stock contable, multi-vendors, y auditoría. Flask se comunica con Odoo usando estrictamente **JSON-RPC**.

## 3. Entorno de Desarrollo y Requisitos
### Tecnologías Requeridas
- **Docker** y **Docker Compose** (Versiones ≥ `v2.x`).
- **Node.js**: Versión `v18.x` o superior para desarrollo local del Frontend.
- **Python**: Versión `3.10` o superior para pruebas locales del Backend.

### Dependencias Principales
- **Frontend (`package.json`)**: React 19, vite, react-router-dom, react-hook-form, zustand, @stripe/react-stripe-js.
- **Backend (`requirements.txt`)**: Flask, flask-cors, PyJWT, requests, stripe.

## 4. Estructura de Archivos Core
```text
/
├── backend/                  # Entorno Python/Flask
│   ├── app/
│   │   ├── api/              # Controladores (Blueprints de Admin, Vendor, Cliente)
│   │   ├── odoo/             # Integración. Contiene client.py (JSON-RPC)
│   │   ├── __init__.py      # Registro de todos los blueprints y CORS
│   │   └── config.py         # Carga y validación inicial de .env
│   ├── requirements.txt      # Dependencias PIP
│   └── Dockerfile            # Imagen base de Python
├── frontend/                 # Entorno Node/React
│   ├── src/
│   │   ├── components/       # Componentes reusables de interfaz
│   │   ├── pages/            # Vistas enrutables (Store, Admin, Vendor)
│   │   ├── services/         # Clientes Axios (Llamadas a Flask/Odoo)
│   │   ├── store/            # Lógica global y Zustand
│   │   └── App.jsx           # Entrypoint y Context Providers
│   ├── package.json
│   └── Dockerfile            # Nginx para SPA estática
├── docs/                     # Documentación del proyecto y manuales
├── docker-compose.yml        # Orquestador del servicio global (Odoo, Web, API, DB)
```

## 5. Integración con Odoo 19 (JSON-RPC)
A diferencia de versiones anteriores, el sistema descarta XML-RPC y utiliza peticiones HTTP directas por JSON. 
El `client.py` interno (en `backend/app/odoo/`) maneja las funciones de bajo nivel: `search_read`, `search_count`, `create`, `write`, `unlink`. Los controladores de Flask no llaman la DB directamente, exigen métodos remotos sobre los modelos de Odoo (e.g. `product.template`, `sale.order`, `account.move`).

## 6. Despliegue Configurado (Docker)
1. **Configuración Inicial:** Duplicar los archivos `.env.example` en `/` y `/backend` a `.env` con las claves seguras predefinidas.
2. Hacer el levante del orquestador:
   ```bash
   docker-compose down -v  # (Opcional) si se requiere limpiar de builds anteriores
   docker-compose build --no-cache
   docker-compose up -d
   ```
3. Los puertos expuestos al host serán:
   - **Frontend UI:** `80` (A través de Nginx interno en Dockerfile o mapeado a `5173`)
   - **Backend API:** `5000`
   - **Odoo Admin GUI:** `8069`
   - **DB Postgres:** `5432` solo accesible en las redes internas (`catalogix`).
