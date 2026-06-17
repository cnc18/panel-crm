import Badge from './Badge'
import Button from './Button'
import './PedidoCard.css'

// Transiciones válidas por estado: MISMO conjunto que el backend (_TRANSICIONES).
// Solo se ofrecen como botones las salidas válidas del estado actual.
const TRANSICIONES = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['en_produccion', 'entregado', 'cancelado'],
  en_produccion: ['entregado', 'cancelado'],
  entregado: ['cancelado'],
  cancelado: [],
}

// Etiqueta del botón según el estado DESTINO.
const ETIQUETA_ACCION = {
  confirmado: 'Confirmar',
  en_produccion: 'A producción',
  entregado: 'Entregar',
  cancelado: 'Cancelar',
}

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

// Fecha relativa: "hace un momento" / "hace 2 horas" / "ayer" / "hace 3 días".
function fmtRelativo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const seg = Math.round((d.getTime() - Date.now()) / 1000) // negativo = pasado
  const abs = Math.abs(seg)
  if (abs < 60) return 'hace un momento'
  if (abs < 3600) return rtf.format(Math.round(seg / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(seg / 3600), 'hour')
  if (abs < 2592000) return rtf.format(Math.round(seg / 86400), 'day')
  return d.toLocaleDateString('es-CO')
}

// Resumen de items: 1 línea -> "2x Invictus 100ml"; varias -> "3 productos".
function resumenItems(items = [], mapaProductos = {}) {
  if (items.length === 0) return 'Sin items'
  if (items.length === 1) {
    const it = items[0]
    const nombre = mapaProductos[it.producto_id]?.nombre || `Producto #${it.producto_id}`
    return `${it.cantidad}x ${nombre}`
  }
  return `${items.length} productos`
}

// Tarjeta de pedido para el kanban. Recibe el pedido y los mapas ya cargados;
// nunca llama a la API. Click en la tarjeta abre el detalle (PedidoModal);
// los botones solo cambian el estado y no propagan el click.
function PedidoCard({ pedido, mapaClientes = {}, mapaProductos = {}, onAbrir, onCambiarEstado }) {
  const estado = pedido.estado
  const cliente = mapaClientes[pedido.cliente_id]
  const nombre = cliente?.nombre?.trim() || `Cliente #${pedido.cliente_id}`
  const acciones = TRANSICIONES[estado] || []

  const cambiar = (e, nuevo) => {
    e.stopPropagation() // no abrir el detalle al usar los botones
    onCambiarEstado?.(pedido, nuevo)
  }

  return (
    <div
      className={`pedido pedido--${estado}`}
      role="button"
      tabIndex={0}
      onClick={() => onAbrir?.(pedido)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onAbrir?.(pedido)
        }
      }}
    >
      <div className="pedido__top">
        <h3 className="pedido__cliente">{nombre}</h3>
        {pedido.descontado && (
          <Badge type="low" className="pedido__descontado">
            stock descontado
          </Badge>
        )}
      </div>

      <p className="pedido__items">{resumenItems(pedido.items, mapaProductos)}</p>

      <div className="pedido__meta">
        <span className="pedido__total">{cop.format(Number(pedido.total) || 0)}</span>
        <span className="pedido__fecha">{fmtRelativo(pedido.created_at)}</span>
      </div>

      {acciones.length > 0 && (
        <div className="pedido__acciones">
          {acciones.map((destino) => (
            <Button
              key={destino}
              variant={destino === 'cancelado' ? 'ghost' : 'primary'}
              className="pedido__btn"
              onClick={(e) => cambiar(e, destino)}
            >
              {ETIQUETA_ACCION[destino]}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PedidoCard
