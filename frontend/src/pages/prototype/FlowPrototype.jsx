import { Link, useNavigate } from "react-router-dom";
import "../../styles/prototype/FlowPrototype.css";

const FLOW_STAGES = [
  {
    step: "01",
    title: "Acceso y autenticacion",
    summary: "El usuario entra al sistema, se registra si no tiene cuenta o inicia sesion si ya existe.",
    points: [
      "Pantalla principal con acceso directo a login y registro.",
      "Formulario de registro con nombre, correo, contrasena y tipo de usuario.",
      "Recuperacion de contrasena con envio de enlace.",
    ],
  },
  {
    step: "02",
    title: "Exploracion del catalogo",
    summary: "Desde la tienda el usuario revisa catalogos, abre productos y usa busqueda para encontrar lo que necesita.",
    points: [
      "Vista general de catalogos disponibles.",
      "Detalle de catalogo con productos y disponibilidad.",
      "Busqueda con filtros por nombre, categoria y precio.",
    ],
  },
  {
    step: "03",
    title: "Carrito y compra",
    summary: "El usuario agrega productos, ajusta cantidades, revisa totales y genera el pedido.",
    points: [
      "Carrito con resumen, cambios de cantidad y eliminacion.",
      "Checkout con datos del cliente y confirmacion del pedido.",
      "Resultado de pago para validar exito o reintento.",
    ],
  },
  {
    step: "04",
    title: "Seguimiento y paneles",
    summary: "Despues de la compra el sistema separa experiencias para cliente y vendedor sin romper el flujo comun.",
    points: [
      "Cliente: perfil, historial, notificaciones y seguimiento.",
      "Vendedor: productos, catalogos, cupones, pedidos e facturas.",
      "Salida segura con cierre de sesion.",
    ],
  },
];

const PROTOTYPE_SCREENS = [
  {
    name: "Portada / Login",
    category: "Acceso",
    route: "/login",
    objective: "Abrir el sistema con una portada clara y una entrada directa al flujo principal.",
    actions: ["Entrar al sistema", "Ir a registro", "Ir a recuperacion"],
    frame: {
      hero: "Principal",
      chips: ["Login", "Registro", "Recuperacion"],
      panels: ["Mensaje de valor", "Formulario rapido", "Atajos"],
    },
  },
  {
    name: "Registro",
    category: "Acceso",
    route: "/register",
    objective: "Crear cuentas nuevas segun el tipo de usuario y dejar listo el acceso.",
    actions: ["Nombre", "Correo", "Contrasena", "Tipo de usuario"],
    frame: {
      hero: "Registro",
      chips: ["Cliente", "Vendedor", "Admin"],
      panels: ["Datos personales", "Credenciales", "Confirmacion"],
    },
  },
  {
    name: "Recuperacion",
    category: "Acceso",
    route: "/forgot-password",
    objective: "Permitir restablecer credenciales sin salir del sistema.",
    actions: ["Ingresar correo", "Enviar enlace", "Continuar a reset"],
    frame: {
      hero: "Reset",
      chips: ["Correo", "Enlace", "Nueva clave"],
      panels: ["Solicitud", "Estado", "Ayuda"],
    },
  },
  {
    name: "Inicio de tienda",
    category: "Catalogo",
    route: "/home",
    objective: "Presentar los catalogos destacados y orientar la navegacion desde el primer vistazo.",
    actions: ["Explorar", "Buscar", "Abrir catalogos"],
    frame: {
      hero: "Store",
      chips: ["Destacados", "Categorias", "Ofertas"],
      panels: ["Hero comercial", "Categorias", "Productos top"],
    },
  },
  {
    name: "Catalogos",
    category: "Catalogo",
    route: "/catalogs",
    objective: "Mostrar todos los catalogos disponibles y su estructura comercial.",
    actions: ["Ver catalogos", "Comparar tiendas", "Entrar a detalle"],
    frame: {
      hero: "Catalogos",
      chips: ["Tiendas", "Rating", "Stock"],
      panels: ["Grid general", "Filtros", "CTA"],
    },
  },
  {
    name: "Detalle de catalogo",
    category: "Catalogo",
    route: "/catalog/1",
    objective: "Reunir productos por catalogo y facilitar el paso al detalle de producto.",
    actions: ["Ver productos", "Ordenar", "Agregar al carrito"],
    frame: {
      hero: "Detalle",
      chips: ["Productos", "Orden", "Disponibilidad"],
      panels: ["Banner", "Grid de productos", "Resumen"],
    },
  },
  {
    name: "Busqueda y filtros",
    category: "Catalogo",
    route: "/search",
    objective: "Encontrar productos concretos por texto, categoria o rango de precio.",
    actions: ["Buscar", "Filtrar", "Ajustar resultados"],
    frame: {
      hero: "Search",
      chips: ["Nombre", "Categoria", "Precio"],
      panels: ["Buscador", "Filtros", "Resultados"],
    },
  },
  {
    name: "Producto",
    category: "Compra",
    route: "/product/1",
    objective: "Mostrar nombre, precio, descripcion y disponibilidad antes de comprar.",
    actions: ["Revisar info", "Elegir cantidad", "Agregar al carrito"],
    frame: {
      hero: "Producto",
      chips: ["Precio", "Descripcion", "Stock"],
      panels: ["Galeria", "Ficha", "Acciones"],
    },
  },
  {
    name: "Carrito",
    category: "Compra",
    route: "/cart",
    objective: "Validar seleccion, editar cantidades, eliminar items y revisar totales.",
    actions: ["Editar cantidad", "Eliminar item", "Ver total"],
    frame: {
      hero: "Carrito",
      chips: ["Items", "Cantidad", "Total"],
      panels: ["Listado", "Resumen", "Cupon"],
    },
  },
  {
    name: "Checkout",
    category: "Compra",
    route: "/checkout",
    objective: "Confirmar datos del cliente, generar pedido y abrir el pago si aplica.",
    actions: ["Confirmar datos", "Generar pedido", "Continuar a pago"],
    frame: {
      hero: "Checkout",
      chips: ["Cliente", "Pedido", "Pago"],
      panels: ["Formulario", "Resumen", "Metodo"],
    },
  },
  {
    name: "Confirmacion y pago",
    category: "Compra",
    route: "/payment-result",
    objective: "Entregar un cierre claro del pedido y del resultado de pago.",
    actions: ["Ver pedido", "Confirmar pago", "Seguir estado"],
    frame: {
      hero: "Resultado",
      chips: ["Exito", "Pendiente", "Accion"],
      panels: ["Estado", "Recibo", "Siguiente paso"],
    },
  },
  {
    name: "Panel cliente",
    category: "Cuenta",
    route: "/customer/profile",
    objective: "Concentrar perfil, compras, historial y notificaciones del usuario final.",
    actions: ["Ver perfil", "Consultar compras", "Revisar notificaciones"],
    frame: {
      hero: "Cliente",
      chips: ["Perfil", "Pedidos", "Facturas"],
      panels: ["Resumen", "Historial", "Alertas"],
    },
  },
  {
    name: "Panel vendedor",
    category: "Cuenta",
    route: "/vendor/dashboard",
    objective: "Gestionar catalogos, productos, pedidos, cupones e facturas desde una vista operativa.",
    actions: ["Gestionar productos", "Ver pedidos", "Revisar facturas"],
    frame: {
      hero: "Vendedor",
      chips: ["Productos", "Pedidos", "Facturas"],
      panels: ["KPIs", "Operaciones", "Acciones rapidas"],
    },
  },
  {
    name: "Cierre de sesion",
    category: "Cuenta",
    route: "/login",
    objective: "Cerrar el recorrido con una salida segura sin perder claridad de estado.",
    actions: ["Cerrar sesion", "Volver al acceso", "Reingresar"],
    frame: {
      hero: "Logout",
      chips: ["Seguridad", "Salida", "Reingreso"],
      panels: ["Confirmacion", "Mensaje", "Acceso"],
    },
  },
];

const ROLE_COLUMNS = [
  {
    name: "Cliente",
    route: "/customer/profile",
    title: "Experiencia posterior a la compra",
    items: [
      "Revisar perfil personal y datos de cuenta.",
      "Consultar historial de compras y seguimiento.",
      "Ver notificaciones, facturas y estado del pedido.",
    ],
  },
  {
    name: "Vendedor",
    route: "/vendor/dashboard",
    title: "Experiencia operativa del negocio",
    items: [
      "Gestionar productos, catalogos y promociones.",
      "Controlar pedidos, inventario y cupones.",
      "Revisar facturas, clientes y reportes.",
    ],
  },
];

export default function FlowPrototype() {
  const navigate = useNavigate();

  return (
    <div className="proto-shell">
      <div className="proto-grid" />
      <header className="proto-hero">
        <div className="proto-hero-copy">
          <span className="proto-kicker">Prototype mode</span>
          <h1>
            Prototipo visual del flujo de tu proyecto
            <span> sin tocar la logica actual.</span>
          </h1>
          <p>
            Esta pantalla convierte tu algoritmo funcional en una experiencia navegable:
            acceso, catalogo, busqueda, carrito, checkout, seguimiento y paneles por rol.
          </p>
          <div className="proto-actions">
            <button className="proto-primary" onClick={() => navigate("/home")}>
              Ver tienda real
            </button>
            <button className="proto-secondary" onClick={() => navigate("/login")}>
              Abrir login real
            </button>
          </div>
          <ul className="proto-badges">
            <li>No reemplaza rutas existentes</li>
            <li>Sirve como mapa visual del sistema</li>
            <li>Usa pantallas ya presentes como destino real</li>
          </ul>
        </div>

        <div className="proto-summary-card">
          <div className="proto-summary-head">
            <span>Ruta recomendada</span>
            <strong>Del acceso al pedido</strong>
          </div>
          <ol>
            <li>Login o registro</li>
            <li>Catalogo y busqueda</li>
            <li>Producto y carrito</li>
            <li>Checkout y pago</li>
            <li>Seguimiento y paneles</li>
          </ol>
          <div className="proto-summary-footer">
            <span>Prototype route</span>
            <code>/prototype</code>
          </div>
        </div>
      </header>

      <section className="proto-section">
        <div className="proto-section-head">
          <span>Algoritmo convertido en flujo</span>
          <h2>Etapas maestras del recorrido</h2>
        </div>
        <div className="proto-stage-grid">
          {FLOW_STAGES.map((stage) => (
            <article key={stage.step} className="proto-stage-card">
              <div className="proto-stage-step">{stage.step}</div>
              <h3>{stage.title}</h3>
              <p>{stage.summary}</p>
              <ul>
                {stage.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="proto-section">
        <div className="proto-section-head">
          <span>Pantallas propuestas</span>
          <h2>Mapa del prototipo por vista</h2>
        </div>
        <div className="proto-screen-grid">
          {PROTOTYPE_SCREENS.map((screen) => (
            <article key={`${screen.category}-${screen.name}`} className="proto-screen-card">
              <div className="proto-screen-top">
                <span className="proto-screen-tag">{screen.category}</span>
                <Link to={screen.route} className="proto-screen-link">
                  {screen.route}
                </Link>
              </div>
              <h3>{screen.name}</h3>
              <p>{screen.objective}</p>

              <div className="proto-mini-screen">
                <div className="proto-mini-topbar">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="proto-mini-hero">{screen.frame.hero}</div>
                <div className="proto-mini-chips">
                  {screen.frame.chips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
                <div className="proto-mini-panels">
                  {screen.frame.panels.map((panel) => (
                    <div key={panel}>{panel}</div>
                  ))}
                </div>
              </div>

              <div className="proto-screen-actions">
                {screen.actions.map((action) => (
                  <span key={action}>{action}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="proto-section proto-role-section">
        <div className="proto-section-head">
          <span>Separacion por rol</span>
          <h2>Despues de la compra, el sistema se divide por experiencia</h2>
        </div>
        <div className="proto-role-grid">
          {ROLE_COLUMNS.map((role) => (
            <article key={role.name} className="proto-role-card">
              <div className="proto-role-top">
                <span>{role.name}</span>
                <Link to={role.route}>{role.route}</Link>
              </div>
              <h3>{role.title}</h3>
              <ul>
                {role.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="proto-footer-card">
        <div>
          <span className="proto-kicker">Uso sugerido</span>
          <h2>Este prototipo te sirve como referencia visual para decidir que pantalla pulir primero.</h2>
        </div>
        <div className="proto-footer-actions">
          <button className="proto-primary" onClick={() => navigate("/catalogs")}>
            Revisar catalogos reales
          </button>
          <button className="proto-secondary" onClick={() => navigate("/vendor/dashboard")}>
            Abrir panel vendedor
          </button>
        </div>
      </section>
    </div>
  );
}
