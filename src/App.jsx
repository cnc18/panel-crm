import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Pedidos from './pages/Pedidos'
import Productos from './pages/Productos'
import Inventario from './pages/Inventario'
import Recetas from './pages/Recetas'
import Ofertas from './pages/Ofertas'
import './App.css'

// Nombres de cada sección (contenido real va después).
const SECTIONS = {
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  pedidos: 'Pedidos',
  productos: 'Productos',
  inventario: 'Inventario',
  recetas: 'Recetas',
  ofertas: 'Ofertas',
}

function App() {
  const [section, setSection] = useState('dashboard')

  return (
    <div className="app">
      <Sidebar active={section} onNavigate={setSection} />

      <main className="app__main">
        {/* Todas las secciones implementadas traen su propio título; el resto usa la cabecera genérica. */}
        {section === 'dashboard' ? (
          <Dashboard />
        ) : section === 'clientes' ? (
          <Clientes />
        ) : section === 'pedidos' ? (
          <Pedidos />
        ) : section === 'productos' ? (
          <Productos />
        ) : section === 'inventario' ? (
          <Inventario />
        ) : section === 'recetas' ? (
          <Recetas />
        ) : section === 'ofertas' ? (
          <Ofertas />
        ) : (
          <>
            <header className="page-head">
              <h1>{SECTIONS[section]}</h1>
            </header>
            <p className="placeholder">Sección en construcción.</p>
          </>
        )}
      </main>
    </div>
  )
}

export default App
