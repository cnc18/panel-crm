import { useEffect, useState } from 'react'
import { cambiarEstadoPedido } from '../api/crm'
import PedidoCard from './PedidoCard'
import './KanbanPedidos.css'

// Las 5 columnas. 'cancelado' es terminal -> va al final y arranca colapsada.
const COLUMNAS = ['pendiente', 'confirmado', 'en_produccion', 'entregado', 'cancelado']
const NOMBRE = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_produccion: 'En producción',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

// Tablero de pedidos. Sin drag-and-drop: el cambio de estado se hace con los
// botones de PedidoCard (que solo ofrecen transiciones válidas). La llamada a la
// API vive aquí; la tarjeta NO se mueve hasta que el backend confirma (refrescamos
// vía onActualizado). Errores (p. ej. 409 stock) -> toast, la tarjeta no se mueve.
function KanbanPedidos({ pedidos = [], mapaClientes = {}, mapaProductos = {}, onAbrir, onActualizado }) {
  const [aviso, setAviso] = useState(null) // { tipo, texto }
  const [procesando, setProcesando] = useState(null) // id del pedido en curso
  const [verCancelados, setVerCancelados] = useState(false)

  // Auto-cierra el toast tras unos segundos.
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4500)
    return () => clearTimeout(t)
  }, [aviso])

  // Agrupa pedidos por estado.
  const porEstado = COLUMNAS.reduce((acc, e) => ({ ...acc, [e]: [] }), {})
  pedidos.forEach((p) => {
    if (porEstado[p.estado]) porEstado[p.estado].push(p)
  })

  async function cambiarEstado(pedido, nuevo) {
    if (procesando) return // evita doble clic mientras hay uno en curso
    setAviso(null)
    try {
      setProcesando(pedido.id)
      await cambiarEstadoPedido(pedido.id, nuevo)
      onActualizado?.() // recién aquí la tarjeta se reubica (al refrescar datos)
    } catch (e) {
      // 409 stock insuficiente (con detalle) / 400 transición inválida.
      setAviso({ tipo: 'error', texto: e.message })
    } finally {
      setProcesando(null)
    }
  }

  const columnasVisibles = COLUMNAS.filter((e) => e !== 'cancelado')
  const cancelados = porEstado.cancelado

  // Render de una tarjeta (helper, no componente -> no remonta columnas).
  const renderCard = (p) => (
    <PedidoCard
      key={p.id}
      pedido={p}
      mapaClientes={mapaClientes}
      mapaProductos={mapaProductos}
      onAbrir={onAbrir}
      onCambiarEstado={cambiarEstado}
    />
  )

  return (
    <div className="kanban-pedidos-wrap">
      {aviso && (
        <div className={`kp-toast kp-toast--${aviso.tipo}`} role="alert">
          {aviso.texto}
        </div>
      )}

      <div className="kanban-pedidos">
        {columnasVisibles.map((estado) => (
          <section key={estado} className={`kpcol kpcol--${estado}`}>
            <header className="kpcol__header">
              <span className="kpcol__nombre">{NOMBRE[estado]}</span>
              <span className="kpcol__count">{porEstado[estado].length}</span>
            </header>
            <div className="kpcol__body">
              {porEstado[estado].length === 0 ? (
                <p className="empty kpcol__vacio">Sin pedidos.</p>
              ) : (
                porEstado[estado].map(renderCard)
              )}
            </div>
          </section>
        ))}

        {/* Cancelados: terminal, colapsable al final */}
        <section className="kpcol kpcol--cancelado kpcol--colapsable">
          <header className="kpcol__header">
            <button
              type="button"
              className="kpcol__toggle"
              onClick={() => setVerCancelados((v) => !v)}
              aria-expanded={verCancelados}
            >
              {verCancelados ? '▾' : '▸'} {NOMBRE.cancelado}
            </button>
            <span className="kpcol__count">{cancelados.length}</span>
          </header>
          {verCancelados && (
            <div className="kpcol__body">
              {cancelados.length === 0 ? (
                <p className="empty kpcol__vacio">Sin pedidos cancelados.</p>
              ) : (
                cancelados.map(renderCard)
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default KanbanPedidos
