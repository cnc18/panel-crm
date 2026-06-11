import { useCallback, useEffect, useState } from 'react'
import { MousePointerClick, Search } from 'lucide-react'
import { getClientes, actualizarCliente } from '../api/crm'
import Button from '../components/Button'
import Skeleton from '../components/Skeleton'
import KanbanColumna from '../components/KanbanColumna'
import LeadDetalle from '../components/LeadDetalle'
import './Clientes.css'

const ESTADOS = ['nuevo', 'interesado', 'cliente']

function Clientes() {
  const [clientes, setClientes] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [seleccionado, setSeleccionado] = useState(null) // teléfono
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setClientes(await getClientes())
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Cambia el estado_lead en el estado local (mueve la tarjeta de columna).
  const aplicarEstadoLocal = (telefono, nuevo) =>
    setClientes((prev) =>
      (prev || []).map((c) => (c.telefono === telefono ? { ...c, estado_lead: nuevo } : c))
    )

  // Desde la tarjeta: la página persiste en el CRM y mueve la tarjeta (optimista).
  const cambiarDesdeTarjeta = async (lead, nuevo) => {
    if (!nuevo || nuevo === lead.estado_lead) return
    const previo = lead.estado_lead
    aplicarEstadoLocal(lead.telefono, nuevo)
    try {
      await actualizarCliente(lead.telefono, { estado_lead: nuevo })
    } catch {
      aplicarEstadoLocal(lead.telefono, previo) // revertir si falla
    }
  }

  // Desde el detalle: LeadDetalle ya persistió; solo sincronizamos el kanban.
  const sincronizarDesdeDetalle = (telefono, nuevo) => aplicarEstadoLocal(telefono, nuevo)

  const seleccionadoCliente = (clientes || []).find((c) => c.telefono === seleccionado) || null

  // Filtro en frontend por nombre o teléfono (no hace fetch nuevo).
  const q = busqueda.trim().toLowerCase()
  const filtrados =
    q === ''
      ? clientes || []
      : (clientes || []).filter(
          (c) =>
            (c.nombre || '').toLowerCase().includes(q) ||
            (c.telefono || '').toLowerCase().includes(q)
        )

  // Contadores sobre el total real (no afectados por la búsqueda).
  const totalLeads = clientes?.length ?? 0
  const totalClientes = (clientes || []).filter((c) => c.estado_lead === 'cliente').length

  return (
    <div className="clientes">
      <header className="page-head">
        <h1>Clientes</h1>
      </header>

      {cargando ? (
        <div className="clientes__board">
          <div className="clientes__kanban">
            {ESTADOS.map((e) => (
              <div key={e} className={`kanban-col kanban-col--${e}`}>
                <div className="kanban-col__header">
                  <Skeleton width={80} height={16} />
                </div>
                <div className="kanban-col__body">
                  <Skeleton height={86} radius="10px" />
                  <Skeleton height={86} radius="10px" />
                </div>
              </div>
            ))}
          </div>
          <div className="clientes__panel" />
        </div>
      ) : error ? (
        <div className="api-error" role="alert">
          <p>Error al cargar los clientes: {error}</p>
          <Button variant="ghost" onClick={cargar}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <div className="clientes__toolbar">
            <div className="clientes__buscador">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o teléfono…"
                aria-label="Buscar leads"
              />
            </div>
            <span className="clientes__count">
              {totalLeads} leads en total · {totalClientes} clientes
            </span>
          </div>

          <div className="clientes__board">
            <div className="clientes__kanban">
              {ESTADOS.map((estado) => (
                <KanbanColumna
                  key={estado}
                  estado={estado}
                  leads={filtrados.filter((c) => c.estado_lead === estado)}
                  seleccionadoTelefono={seleccionado}
                  onSelect={(lead) => setSeleccionado(lead.telefono)}
                  onCambiarEstado={cambiarDesdeTarjeta}
                />
              ))}
            </div>

          <aside className="clientes__panel">
            {seleccionado ? (
              <LeadDetalle
                key={seleccionado}
                telefono={seleccionado}
                estadoActual={seleccionadoCliente?.estado_lead}
                onEstadoChange={sincronizarDesdeDetalle}
              />
            ) : (
              <div className="clientes__placeholder">
                <MousePointerClick size={26} aria-hidden="true" />
                <p>Selecciona un lead para ver su detalle y sus pedidos.</p>
              </div>
            )}
          </aside>
          </div>
        </>
      )}
    </div>
  )
}

export default Clientes
