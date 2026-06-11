import { useCallback, useEffect, useState } from 'react'
import { Copy, Check, MessageCircle } from 'lucide-react'
import { getCliente, getPedidos, actualizarCliente } from '../api/crm'
import Badge from './Badge'
import Button from './Button'
import Skeleton from './Skeleton'
import './LeadDetalle.css'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const ESTADOS = ['nuevo', 'interesado', 'cliente']
const ESTADO_LEAD = {
  nuevo: { type: 'neutral', label: 'Nuevo' },
  interesado: { type: 'low', label: 'Interesado' },
  cliente: { type: 'ok', label: 'Cliente' },
}
const ESTADO_PEDIDO = {
  pendiente: { type: 'neutral', label: 'Pendiente' },
  confirmado: { type: 'low', label: 'Confirmado' },
  en_produccion: { type: 'low', label: 'En producción' },
  entregado: { type: 'ok', label: 'Entregado' },
  cancelado: { type: 'out', label: 'Cancelado' },
}

const fmtFecha = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Panel lateral de detalle del lead seleccionado. Carga el cliente y sus pedidos.
// `onEstadoChange(telefono, nuevo)` avisa al padre para mover la tarjeta en el kanban.
function LeadDetalle({ telefono, estadoActual, onEstadoChange }) {
  const [cliente, setCliente] = useState(null)
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [cambiando, setCambiando] = useState(false)
  const [estadoError, setEstadoError] = useState(null)
  const [copiado, setCopiado] = useState(false)

  const cargar = useCallback(async () => {
    if (!telefono) return
    setCargando(true)
    setError(null)
    setEstadoError(null)
    try {
      const c = await getCliente(telefono)
      const todos = await getPedidos().catch(() => [])
      setCliente(c)
      setPedidos((todos || []).filter((p) => p.cliente_id === c.id))
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [telefono])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Sincroniza el badge/selector si el estado cambió desde el kanban (sin re-fetch).
  useEffect(() => {
    if (estadoActual) setCliente((c) => (c && c.estado_lead !== estadoActual ? { ...c, estado_lead: estadoActual } : c))
  }, [estadoActual])

  // Cambia el estado del lead (optimista) y avisa al padre para sincronizar el kanban.
  async function cambiarEstado(nuevo) {
    if (!cliente || nuevo === cliente.estado_lead) return
    const previo = cliente.estado_lead
    setCambiando(true)
    setEstadoError(null)
    setCliente((c) => ({ ...c, estado_lead: nuevo }))
    try {
      await actualizarCliente(telefono, { estado_lead: nuevo })
      onEstadoChange?.(telefono, nuevo)
    } catch (e) {
      setCliente((c) => ({ ...c, estado_lead: previo }))
      setEstadoError(e.message)
    } finally {
      setCambiando(false)
    }
  }

  async function copiarTelefono() {
    try {
      await navigator.clipboard.writeText(cliente.telefono)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      /* sin portapapeles disponible */
    }
  }

  if (cargando) {
    return (
      <div className="lead-detalle">
        <Skeleton width="70%" height={24} />
        <Skeleton width="50%" height={14} />
        <Skeleton height={1} />
        <Skeleton width="60%" height={14} />
        <Skeleton height={80} radius="10px" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="lead-detalle">
        <div className="api-error" role="alert">
          <p>Error al cargar el lead: {error}</p>
          <Button variant="ghost" onClick={cargar}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  if (!cliente) return null

  const estado = ESTADO_LEAD[cliente.estado_lead] ?? { type: 'neutral', label: cliente.estado_lead }
  const waUrl = `https://wa.me/${String(cliente.telefono).replace(/\D/g, '')}`

  return (
    <div className="lead-detalle">
      {/* Identidad */}
      <header className="lead-detalle__head">
        <h2 className="lead-detalle__nombre">{cliente.nombre?.trim() || 'Sin nombre'}</h2>
        <div className="lead-detalle__tel">
          <span>{cliente.telefono}</span>
          <button
            type="button"
            className="lead-detalle__copiar"
            onClick={copiarTelefono}
            aria-label="Copiar teléfono"
          >
            {copiado ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </header>

      <div className="lead-detalle__sep" />

      {/* Datos */}
      <dl className="lead-detalle__datos">
        <div>
          <dt>Canal</dt>
          <dd className="cap">{cliente.canal_origen}</dd>
        </div>
        <div>
          <dt>Registro</dt>
          <dd>{fmtFecha(cliente.created_at)}</dd>
        </div>
      </dl>

      <div className="lead-detalle__sep" />

      {/* Estado */}
      <section className="lead-detalle__estado">
        <div className="lead-detalle__estado-row">
          <span className="lead-detalle__label">Estado</span>
          <Badge type={estado.type}>{estado.label}</Badge>
        </div>
        <select
          className="lead-detalle__select"
          value={cliente.estado_lead}
          onChange={(e) => cambiarEstado(e.target.value)}
          disabled={cambiando}
          aria-label="Cambiar estado del lead"
        >
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {ESTADO_LEAD[s].label}
            </option>
          ))}
        </select>
        {estadoError && (
          <p className="lead-detalle__error" role="alert">
            {estadoError}
          </p>
        )}
      </section>

      <div className="lead-detalle__sep" />

      {/* Pedidos */}
      <section className="lead-detalle__pedidos">
        <h3 className="lead-detalle__subtitulo">Pedidos</h3>
        {pedidos.length === 0 ? (
          <p className="empty">Sin pedidos todavía.</p>
        ) : (
          <ul className="pedido-lista">
            {pedidos.map((p) => {
              const est = ESTADO_PEDIDO[p.estado] ?? { type: 'neutral', label: p.estado }
              return (
                <li key={p.id} className="pedido">
                  <div className="pedido__info">
                    <span className="pedido__id">Pedido #{p.id}</span>
                    <Badge type={est.type}>{est.label}</Badge>
                  </div>
                  <span className="pedido__total">{cop.format(Number(p.total) || 0)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <a className="btn btn--primary lead-detalle__wa" href={waUrl} target="_blank" rel="noreferrer">
        <MessageCircle size={16} aria-hidden="true" /> Ver en WhatsApp
      </a>
    </div>
  )
}

export default LeadDetalle
