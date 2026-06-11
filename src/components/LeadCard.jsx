import { MessageCircle, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import './LeadCard.css'

// Orden del pipeline; el índice define avanzar/retroceder.
const ESTADOS = ['nuevo', 'interesado', 'cliente']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Fecha de registro: relativa los primeros días, luego fecha corta.
function fmtRegistro(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const ahora = new Date()
  const dias = Math.floor((ahora - d) / 86400000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  const corta = `${d.getDate()} ${MESES[d.getMonth()]}`
  return d.getFullYear() === ahora.getFullYear() ? corta : `${corta} ${d.getFullYear()}`
}

// whatsapp -> ícono de mensaje redondo; otros canales -> mensaje genérico.
function CanalIcon({ canal }) {
  const Icono = canal === 'whatsapp' ? MessageCircle : MessageSquare
  return <Icono size={13} aria-hidden="true" />
}

// Tarjeta de lead para el kanban. Click en la tarjeta selecciona y abre el
// detalle; los botones de avanzar/retroceder no propagan el click.
function LeadCard({ lead, seleccionado, onSelect, onCambiarEstado }) {
  const nombre = lead.nombre?.trim() || lead.telefono
  const estado = lead.estado_lead
  const idx = ESTADOS.indexOf(estado)
  const puedeRetroceder = idx > 0
  const puedeAvanzar = idx >= 0 && idx < ESTADOS.length - 1

  const cambiar = (e, nuevo) => {
    e.stopPropagation() // no seleccionar al usar los botones
    onCambiarEstado?.(lead, nuevo)
  }

  return (
    <div
      className={`lead lead--${estado}${seleccionado ? ' seleccionado' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={seleccionado}
      onClick={() => onSelect?.(lead)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.(lead)
        }
      }}
    >
      <div className="lead__top">
        <h3 className="lead__nombre">{nombre}</h3>
        {lead.nombre?.trim() && <span className="lead__tel">{lead.telefono}</span>}
      </div>

      <div className="lead__meta">
        <span className="lead__canal">
          <CanalIcon canal={lead.canal_origen} />
          {lead.canal_origen}
        </span>
        <span className="lead__fecha">{fmtRegistro(lead.created_at)}</span>
      </div>

      <div className="lead__acciones">
        <button
          type="button"
          className="lead__arrow"
          onClick={(e) => cambiar(e, ESTADOS[idx - 1])}
          disabled={!puedeRetroceder}
          aria-label="Retroceder estado"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="lead__arrow"
          onClick={(e) => cambiar(e, ESTADOS[idx + 1])}
          disabled={!puedeAvanzar}
          aria-label="Avanzar estado"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export default LeadCard
