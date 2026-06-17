import { useCallback, useEffect, useState } from 'react'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { getPedidos, getMapaClientes, getMapaProductos } from '../api/crm'
import Button from '../components/Button'
import Skeleton from '../components/Skeleton'
import VentasTotales from '../components/VentasTotales'
import TablaPedidos from '../components/TablaPedidos'
import KanbanPedidos from '../components/KanbanPedidos'
import PedidoModal from '../components/PedidoModal'
import './Pedidos.css'

function Pedidos() {
  const [pedidos, setPedidos] = useState(null)
  const [mapaClientes, setMapaClientes] = useState({})
  const [mapaProductos, setMapaProductos] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [vista, setVista] = useState('tabla') // 'tabla' | 'kanban'
  const [modal, setModal] = useState(null) // null | { modo:'crear' } | { modo:'editar', pedido }

  // Carga inicial: pedidos + ambos mapas en paralelo.
  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [peds, cli, prod] = await Promise.all([
        getPedidos(),
        getMapaClientes(),
        getMapaProductos(),
      ])
      setPedidos(peds || [])
      setMapaClientes(cli)
      setMapaProductos(prod)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Tras crear/editar/cambiar estado: recarga pedidos y el mapa de clientes
  // (el agente puede haber creado un cliente nuevo junto con su pedido).
  const refrescar = useCallback(async () => {
    try {
      const [peds, cli] = await Promise.all([getPedidos(), getMapaClientes()])
      setPedidos(peds || [])
      setMapaClientes(cli)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const abrirPedido = (pedido) => setModal({ modo: 'editar', pedido })
  const cerrarModal = () => setModal(null)

  const hayPedidos = (pedidos?.length ?? 0) > 0

  return (
    <div className="pedidos">
      <header className="page-head">
        <h1>Pedidos</h1>
        <Button variant="primary" onClick={() => setModal({ modo: 'crear' })}>
          <Plus size={16} aria-hidden="true" /> Nuevo pedido
        </Button>
      </header>

      <VentasTotales />

      {cargando ? (
        <div className="pedidos__skeleton">
          <Skeleton height={44} radius="12px" />
          <Skeleton height={120} radius="12px" />
          <Skeleton height={120} radius="12px" />
        </div>
      ) : error ? (
        <div className="api-error" role="alert">
          <p>Error al cargar los pedidos: {error}</p>
          <Button variant="ghost" onClick={cargar}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <div className="pedidos__toolbar">
            <div className="pedidos__toggle" role="group" aria-label="Cambiar vista">
              <button
                type="button"
                className={`pedidos__tab${vista === 'tabla' ? ' activo' : ''}`}
                aria-pressed={vista === 'tabla'}
                onClick={() => setVista('tabla')}
              >
                <List size={16} aria-hidden="true" /> Tabla
              </button>
              <button
                type="button"
                className={`pedidos__tab${vista === 'kanban' ? ' activo' : ''}`}
                aria-pressed={vista === 'kanban'}
                onClick={() => setVista('kanban')}
              >
                <LayoutGrid size={16} aria-hidden="true" /> Kanban
              </button>
            </div>
            <span className="pedidos__count">{pedidos.length} pedidos</span>
          </div>

          {!hayPedidos ? (
            <div className="pedidos__vacio">
              <p>Todavía no hay pedidos.</p>
              <p className="pedidos__vacio-sub">
                El agente de ventas los creará aquí en cuanto haya una venta, o puedes crear uno
                manualmente.
              </p>
              <Button variant="primary" onClick={() => setModal({ modo: 'crear' })}>
                <Plus size={16} aria-hidden="true" /> Crear el primero
              </Button>
            </div>
          ) : vista === 'tabla' ? (
            <TablaPedidos
              pedidos={pedidos}
              mapaClientes={mapaClientes}
              mapaProductos={mapaProductos}
              onAbrir={abrirPedido}
            />
          ) : (
            <div className="pedidos__board">
              <KanbanPedidos
                pedidos={pedidos}
                mapaClientes={mapaClientes}
                mapaProductos={mapaProductos}
                onAbrir={abrirPedido}
                onActualizado={refrescar}
              />
            </div>
          )}
        </>
      )}

      {modal && (
        <PedidoModal
          pedido={modal.modo === 'editar' ? modal.pedido : null}
          mapaClientes={mapaClientes}
          mapaProductos={mapaProductos}
          onClose={cerrarModal}
          onActualizado={refrescar}
        />
      )}
    </div>
  )
}

export default Pedidos
