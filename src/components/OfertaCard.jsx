import { useEffect, useState } from 'react'
import { Calendar, Megaphone, PenLine } from 'lucide-react'
import { cambiarEstadoOferta } from '../api/crm'
import Card from './Card'
import Badge from './Badge'
import Button from './Button'
import './OfertaCard.css'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// 'YYYY-MM-DD' -> "1 jun" (sin pasar por Date para evitar saltos de zona horaria).
function fmtFecha(s) {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return ''
  return `${d} ${MESES[m - 1]}`
}

function rangoVigencia(inicio, fin) {
  const i = inicio ? fmtFecha(inicio) : ''
  const f = fin ? fmtFecha(fin) : ''
  if (i && f) return `${i} → ${f}`
  if (i) return `Desde ${i}`
  if (f) return `Hasta ${f}`
  return ''
}

// Tarjeta de oferta. El toggle cambia el estado directo contra el CRM (sin modal).
// `productoNombre` lo resuelve el padre (la oferta solo trae producto_id).
function OfertaCard({ oferta, productoNombre, onEdit, onDelete, onChanged }) {
  const [activa, setActiva] = useState(oferta.activa)
  const [toggling, setToggling] = useState(false)
  const [toggleError, setToggleError] = useState(false)

  // Resincroniza si el padre refresca la lista.
  useEffect(() => {
    setActiva(oferta.activa)
  }, [oferta.activa])

  const vigencia = rangoVigencia(oferta.fecha_inicio, oferta.fecha_fin)
  const esMarketing = oferta.creada_por === 'marketing'

  // Toggle optimista: actualiza el badge ya y revierte si el CRM falla.
  async function toggle() {
    const nuevo = !activa
    setToggling(true)
    setToggleError(false)
    setActiva(nuevo)
    try {
      await cambiarEstadoOferta(oferta.id, nuevo)
      onChanged?.(oferta.id, nuevo) // el padre mueve la tarjeta de sección
    } catch {
      setActiva(!nuevo)
      setToggleError(true)
    } finally {
      setToggling(false)
    }
  }

  return (
    <Card className={`oferta${activa ? '' : ' oferta--inactiva'}`}>
      <div className="oferta__head">
        <h3 className="oferta__titulo">{oferta.titulo}</h3>
        <button
          type="button"
          role="switch"
          aria-checked={activa}
          aria-label={activa ? 'Desactivar oferta' : 'Activar oferta'}
          className="switch"
          onClick={toggle}
          disabled={toggling}
          aria-busy={toggling}
        >
          <span className="switch__thumb" />
        </button>
      </div>

      <p className="oferta__desc">{oferta.descripcion}</p>

      <div className="oferta__meta">
        <Badge type={activa ? 'ok' : 'neutral'} className="oferta__estado">
          <span className="badge__dot" aria-hidden="true" />
          {activa ? 'Activa' : 'Inactiva'}
        </Badge>
        <Badge
          type={esMarketing ? 'marketing' : 'manual'}
          title={esMarketing ? 'Creada por el agente de marketing' : 'Creada manualmente'}
        >
          {esMarketing ? (
            <Megaphone size={12} aria-hidden="true" />
          ) : (
            <PenLine size={12} aria-hidden="true" />
          )}
          {esMarketing ? 'Marketing' : 'Manual'}
        </Badge>
        {productoNombre && <span className="oferta__chip">{productoNombre}</span>}
      </div>

      {vigencia && (
        <p className="oferta__vigencia">
          <Calendar size={14} aria-hidden="true" />
          {vigencia}
        </p>
      )}

      {toggleError && (
        <p className="oferta__error" role="alert">
          No se pudo cambiar el estado. Intenta de nuevo.
        </p>
      )}

      <div className="oferta__acciones">
        <Button variant="ghost" onClick={() => onEdit?.(oferta)}>
          Editar
        </Button>
        <Button variant="ghost" className="danger" onClick={() => onDelete?.(oferta)}>
          Eliminar
        </Button>
      </div>
    </Card>
  )
}

export default OfertaCard
