# Acta de Constitución del Proyecto (Project Charter)

## 1. Información General del Proyecto
- **Nombre del Proyecto:** Catalogix (Catálogo Simple Multi-Vendor)
- **Fecha de Elaboración:** Abril 2026
- **Gerente(s) del Proyecto:** [Gabriel Alcala Aquino]

---

## 2. Propósito y Justificación del Proyecto
**Propósito:** Desarrollar una plataforma Web robusta para comercio electrónico que actúe bajo el modelo "Multi-Vendor" (Múltiples vendedores), soportada por una arquitectura descentralizada donde un sistema centralizado ERP procese la lógica administrativa.

**Justificación:** Existe la necesidad de contar con una aplicación rápida y moderna para los clientes (Frontend) sin sacrificar la robustez y capacidad contable/inventarial del servidor (ERP). Utilizando **Odoo 19** como motor central subyacente y **React** como escaparate público y administrativo, logramos alto rendimiento, alta escalabilidad y un control estricto contable.

---

## 3. Objetivos del Proyecto
1. **Desplegar un Frontend interactivo** y de rápida respuesta mediante Single Page Application (SPA), garantizando una excelente experiencia de usuario (UX).
2. **Desarrollar paneles segmentados**:
   - **Store Tienda:** Catálogo, Carrito de Compras de gestión ágil.
   - **Vendedor (Vendor):** Acceso privado para gestionar inventario, ventas, cupones y catálogos.
   - **Administrativo (Admin):** Auditoría total, gestión de pagos y visualización de dashboards.
3. **Integrar con precisión Odoo ERP** utilizando JSON-RPC para evitar desajustes de stock en tiempo real y facturación automatizada.
4. **Implementar múltiples pasarelas de pago** de forma nativa (Stripe, PayPal y Transferencias).

---

## 4. Alcance del Proyecto
### **Incluye:**
- Creación de interfaz en React + Vite.
- Middleware en Flask (Backend API) para enrutar comunicaciones, autenticar usuarios externamente a Odoo y mantener seguridad.
- Módulos personalizados en Odoo 19 para manejar multi-vendedor y contabilidad.
- Generación y consulta de transacciones mediante bases de datos relacionales PostgreSQL (Vía Odoo).
- Despliegue empaquetado en contenedores Docker y Docker Compose.

### **No Incluye (Fuera del Alcance Inicial):**
- Desarrollo de aplicaciones nativas para plataformas iOS / Android.
- Implementación de módulos de RRHH u operacionales de Odoo no relacionados al comercio y facturación de la plataforma.

---

## 5. Requisitos de Alto Nivel
- **Tecnológicos:** Servidores con soporte para Docker/Docker-Compose. Motor base PostgreSQL v16+. Odoo v19.
- **Técnicos:** Node.js (React 19, Vite, Zustand para gestión de estado global), Python 3.10+ (Flask, PyJWT, Requests para JSON-RPC).
- **Seguridad:** Autenticación de sesiones de usuarios por JSON Web Tokens y gestión cruzada de sesiones en Odoo. Prevención de vulnerabilidades CSRF y CORS configurados.
- **Rendimiento:** Tiempos de respuesta para el servidor en el catálogo inferiores a < 500ms en condiciones de carga base.

---

## 6. Riesgos Iniciales Identificados
| Riesgo Mapeado | Impacto | Estrategia de Mitigación |
| --- | --- | --- |
| Errores y Timeouts en Odoo vía JSON-RPC. | Alto | Implementar manejo de errores asíncronos y backoffs en el API middleware (`client.py`). |
| Fuga o sobreescritura de estado en SPA. | Medio | Utilizar herramientas rígidas de estado como `Zustand` evitando reescrituras de contexto. |
| Inconsistencias de cobro o contracargos con Webhooks (Stripe). | Alto | Auditar estados del pago y guardar logs (Admin Audit) pre-integración ERP. |

---

## 7. Aprobaciones
Al firmar este documento, las partes aprueban el marco general detallado para la construcción de **Catalogix**.

| Nombre / Rol | Firma | Fecha |
| --- | --- | --- |
| ___________________________ <br> *Patrocinador del Proyecto* | | |
| ___________________________ <br> *Gerente de Desarrollo* | | |
| ___________________________ <br> *Arquitecto de Software* | | |
