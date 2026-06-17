import { LayoutDashboard, Users, Receipt, Package, Boxes, FlaskConical, Tag } from 'lucide-react'
import './Sidebar.css'

// Secciones del panel.
const NAV = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'clientes', label: 'Clientes', Icon: Users },
  { id: 'pedidos', label: 'Pedidos', Icon: Receipt },
  { id: 'productos', label: 'Productos', Icon: Package },
  { id: 'inventario', label: 'Inventario', Icon: Boxes },
  { id: 'recetas', label: 'Recetas', Icon: FlaskConical },
  { id: 'ofertas', label: 'Ofertas', Icon: Tag },
]

// Controlado: el padre pasa la sección activa y recibe los cambios.
function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        Atelier<span className="sidebar__dot">.</span>
      </div>

      <nav className="sidebar__nav" aria-label="Navegación principal">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`nav-link${active === id ? ' active' : ''}`}
            aria-current={active === id ? 'page' : undefined}
            onClick={() => onNavigate(id)}
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
