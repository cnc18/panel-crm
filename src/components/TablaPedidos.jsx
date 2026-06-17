import './TablaPedidos.css'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const NOMBRE_ESTADO = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_produccion: 'En producción',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

const fmtFecha = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Resumen de items: 1 línea -> "2x Invictus"; varias -> "N productos".
function resumenItems(items = [], mapaProductos = {}) {
  if (items.length === 0) return 'Sin items'
  if (items.length === 1) {
    const it = items[0]
    const nombre = mapaProductos[it.producto_id]?.nombre || `Producto #${it.producto_id}`
    return `${it.cantidad}x ${nombre}`
  }
  return `${items.length} productos`
}

// Vista tabla de pedidos. Recibe los pedidos y los mapas (no llama a la API).
// Click en una fila abre el detalle (PedidoModal) vía onAbrir.
function TablaPedidos({ pedidos = [], mapaClientes = {}, mapaProductos = {}, onAbrir }) {
  return (
    <div className="tabla-pedidos__wrap">
      <table className="tabla-pedidos">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Items</th>
            <th className="tp-num">Total</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => {
            const cliente = mapaClientes[p.cliente_id]
            const nombre = cliente?.nombre?.trim() || `Cliente #${p.cliente_id}`
            return (
              <tr
                key={p.id}
                className="tabla-pedidos__fila"
                onClick={() => onAbrir?.(p)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onAbrir?.(p)
                  }
                }}
              >
                <td>{nombre}</td>
                <td className="tp-items">{resumenItems(p.items, mapaProductos)}</td>
                <td className="tp-num">{cop.format(Number(p.total) || 0)}</td>
                <td>
                  <span className={`tp-estado tp-estado--${p.estado}`}>
                    {NOMBRE_ESTADO[p.estado] || p.estado}
                  </span>
                </td>
                <td className="tp-fecha">{fmtFecha(p.created_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default TablaPedidos
