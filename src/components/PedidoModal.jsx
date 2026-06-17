import { useEffect, useMemo, useState } from 'react'
import { getProductos, getClientes, crearPedido, editarPedido, cambiarEstadoPedido } from '../api/crm'
import Button from './Button'
import './ProductoModal.css' // reusa el shell de modal y los estilos de campo
import './PedidoModal.css'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Transiciones válidas por estado (mismo conjunto que el backend y R.4).
const TRANSICIONES = {
  pendiente: ['confirmado', 'cancelado'],
  confirmado: ['en_produccion', 'entregado', 'cancelado'],
  en_produccion: ['entregado', 'cancelado'],
  entregado: ['cancelado'],
  cancelado: [],
}

const ETIQUETA_ESTADO = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmar',
  en_produccion: 'A producción',
  entregado: 'Entregar',
  cancelado: 'Cancelar',
}

const NOMBRE_ESTADO = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_produccion: 'En producción',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

// Modal de pedido con dos modos: ver/editar (si recibe `pedido`) o crear.
// `onActualizado` lo conecta el padre para refrescar la lista tras un cambio.
function PedidoModal({ pedido, mapaClientes = {}, mapaProductos = {}, onClose, onActualizado }) {
  const edicion = Boolean(pedido)
  const [estadoActual, setEstadoActual] = useState(pedido?.estado)
  // Pedido cancelado: edición de items bloqueada, solo lectura.
  const soloLectura = estadoActual === 'cancelado'

  // Catálogo (selector de productos + precios vigentes), en ambos modos.
  const [productos, setProductos] = useState([])
  // Clientes (solo modo crear).
  const [clientes, setClientes] = useState([])
  const [filtroCliente, setFiltroCliente] = useState('')
  const [clienteId, setClienteId] = useState('')

  // Items editables: [{producto_id, cantidad, precioRef}]. precioRef = precio
  // original (edición) o precio actual (líneas nuevas / crear), solo de referencia.
  const [items, setItems] = useState(() =>
    (pedido?.items || []).map((it) => ({
      producto_id: it.producto_id,
      cantidad: it.cantidad,
      precioRef: Number(it.precio_unitario),
    }))
  )
  const [nuevoProductoId, setNuevoProductoId] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [error, setError] = useState('')

  // Precio vigente por producto, para el total estimado en vivo.
  const precioActual = useMemo(() => {
    const m = {}
    productos.forEach((p) => {
      m[p.id] = Number(p.precio)
    })
    return m
  }, [productos])

  const nombreProd = (id) =>
    productos.find((p) => p.id === id)?.nombre || mapaProductos[id]?.nombre || `Producto #${id}`

  // Items originales (normalizados) para detectar cambios reales.
  const itemsOriginales = useMemo(
    () => (pedido?.items || []).map((it) => ({ producto_id: it.producto_id, cantidad: it.cantidad })),
    [pedido]
  )
  const itemsNorm = items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad }))
  const hayCambios = JSON.stringify(itemsNorm) !== JSON.stringify(itemsOriginales)

  // Total estimado con precios VIGENTES (el real lo confirma el backend).
  const totalEstimado = items.reduce(
    (s, i) => s + (precioActual[i.producto_id] ?? i.precioRef) * i.cantidad,
    0
  )

  const itemsValidos = items.length > 0 && items.every((i) => i.cantidad > 0)
  const puedeGuardar = edicion && !soloLectura && hayCambios && itemsValidos
  const puedeCrear = !edicion && clienteId !== '' && itemsValidos

  // Carga catálogo (ambos modos) y clientes (solo crear).
  useEffect(() => {
    getProductos()
      .then((p) => setProductos(p || []))
      .catch(() => setProductos([]))
  }, [])
  useEffect(() => {
    if (!edicion) {
      getClientes()
        .then((c) => setClientes(c || []))
        .catch(() => setClientes([]))
    }
  }, [edicion])

  // Escape para cerrar y bloqueo de scroll del fondo.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  /* ── Operaciones sobre items ── */
  const setCantidad = (idx, v) => {
    const n = Math.max(1, parseInt(v, 10) || 1)
    setItems(items.map((it, i) => (i === idx ? { ...it, cantidad: n } : it)))
  }
  const quitar = (idx) => setItems(items.filter((_, i) => i !== idx))
  const agregar = () => {
    const id = Number(nuevoProductoId)
    if (!id) return
    setItems((prev) => {
      const existe = prev.find((i) => i.producto_id === id)
      if (existe) return prev.map((i) => (i.producto_id === id ? { ...i, cantidad: i.cantidad + 1 } : i))
      return [...prev, { producto_id: id, cantidad: 1, precioRef: precioActual[id] ?? 0 }]
    })
    setNuevoProductoId('')
  }

  /* ── Acciones contra la API ── */
  const cuerpoItems = () => items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad }))

  async function guardarCambios() {
    setError('')
    try {
      setGuardando(true)
      await editarPedido(pedido.id, { items: cuerpoItems() })
      onActualizado?.()
      onClose?.()
    } catch (e) {
      // 409: stock insuficiente (el mensaje ya trae la materia faltante).
      // 400: pedido cancelado. Nada se guardó -> el modal NO se cierra.
      if (e.status === 400) setError('No se puede editar un pedido cancelado.')
      else setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function crear() {
    setError('')
    try {
      setGuardando(true)
      await crearPedido({ cliente_id: Number(clienteId), items: cuerpoItems() })
      onActualizado?.()
      onClose?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  async function aplicarEstado(nuevo) {
    setError('')
    try {
      setCambiandoEstado(true)
      const actualizado = await cambiarEstadoPedido(pedido.id, nuevo)
      setEstadoActual(actualizado.estado)
      onActualizado?.()
    } catch (e) {
      // 409 trae la materia faltante; 400 transición inválida.
      setError(e.message)
    } finally {
      setCambiandoEstado(false)
    }
  }

  const clienteNombre = edicion
    ? mapaClientes[pedido.cliente_id]?.nombre?.trim() || `Cliente #${pedido.cliente_id}`
    : ''

  const clientesFiltrados = clientes.filter((c) => {
    const q = filtroCliente.trim().toLowerCase()
    if (!q) return true
    return (c.nombre || '').toLowerCase().includes(q) || (c.telefono || '').includes(q)
  })

  const transiciones = TRANSICIONES[estadoActual] || []

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal pedido-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pedido-modal-titulo"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="pedido-modal-titulo" className="modal__titulo">
          {edicion ? `Pedido #${pedido.id}` : 'Nuevo pedido'}
        </h2>

        <div className="modal__form">
          {/* ── Cliente ── */}
          {edicion ? (
            <div className="field">
              <span className="field__label">Cliente</span>
              <div className="pedido-modal__cliente">
                {clienteNombre}
                <span className={`pedido-modal__estado pedido-modal__estado--${estadoActual}`}>
                  {NOMBRE_ESTADO[estadoActual] || estadoActual}
                </span>
              </div>
            </div>
          ) : (
            <>
              <label className="field">
                <span className="field__label">Buscar cliente</span>
                <input
                  className="field__input"
                  type="text"
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  placeholder="Nombre o teléfono…"
                />
              </label>
              <label className="field">
                <span className="field__label">Cliente</span>
                <select
                  className="field__input"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                >
                  <option value="">Selecciona un cliente…</option>
                  {clientesFiltrados.map((c) => (
                    <option key={c.id} value={c.id}>
                      {(c.nombre?.trim() || 'Sin nombre') + ` — ${c.telefono}`}
                    </option>
                  ))}
                </select>
                {clientes.length === 0 && (
                  <span className="field__hint">
                    Si el cliente no existe, créalo primero en la sección Clientes.
                  </span>
                )}
              </label>
            </>
          )}

          {/* ── Aviso de stock descontado (edición) ── */}
          {edicion && pedido.descontado && !soloLectura && (
            <p className="pedido-modal__aviso" role="note">
              Este pedido ya descontó stock — al guardar, el inventario se ajustará automáticamente.
            </p>
          )}

          {soloLectura && (
            <p className="pedido-modal__aviso pedido-modal__aviso--bloqueo" role="note">
              Pedido cancelado — solo lectura, no se puede editar.
            </p>
          )}

          {/* ── Items ── */}
          <div className="field">
            <span className="field__label">Items</span>
            {items.length === 0 ? (
              <p className="pedido-modal__vacio">Sin items. Agrega al menos un producto.</p>
            ) : (
              <ul className="pedido-items">
                {items.map((it, idx) => (
                  <li key={`${it.producto_id}-${idx}`} className="pedido-item">
                    <span className="pedido-item__nombre">{nombreProd(it.producto_id)}</span>
                    {soloLectura ? (
                      <span className="pedido-item__cant-ro">{it.cantidad}×</span>
                    ) : (
                      <input
                        className="field__input pedido-item__cant"
                        type="number"
                        min="1"
                        value={it.cantidad}
                        onChange={(e) => setCantidad(idx, e.target.value)}
                        aria-label={`Cantidad de ${nombreProd(it.producto_id)}`}
                      />
                    )}
                    <span className="pedido-item__precio">
                      {cop.format(edicion ? it.precioRef : precioActual[it.producto_id] ?? it.precioRef)}
                    </span>
                    {!soloLectura && (
                      <button
                        type="button"
                        className="pedido-item__quitar"
                        onClick={() => quitar(idx)}
                        aria-label={`Quitar ${nombreProd(it.producto_id)}`}
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {edicion && !soloLectura && (
              <span className="field__hint">
                El precio mostrado es el original; se recalcula con el precio vigente al guardar.
              </span>
            )}

            {/* Agregar producto */}
            {!soloLectura && (
              <div className="pedido-modal__agregar">
                <select
                  className="field__input"
                  value={nuevoProductoId}
                  onChange={(e) => setNuevoProductoId(e.target.value)}
                >
                  <option value="">Agregar producto…</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — {cop.format(Number(p.precio))}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="ghost" onClick={agregar} disabled={!nuevoProductoId}>
                  Agregar
                </Button>
              </div>
            )}
          </div>

          {/* ── Totales ── */}
          <div className="pedido-modal__totales">
            {edicion && (
              <div className="pedido-modal__total-fila">
                <span>Total actual</span>
                <span className="pedido-modal__total-val">{cop.format(Number(pedido.total) || 0)}</span>
              </div>
            )}
            {(!edicion || hayCambios) && (
              <div className="pedido-modal__total-fila">
                <span>{edicion ? 'Estimado con cambios' : 'Total estimado'}</span>
                <span className="pedido-modal__total-val pedido-modal__total-val--est">
                  {cop.format(totalEstimado)}
                </span>
              </div>
            )}
            {(!edicion || hayCambios) && (
              <span className="field__hint">
                Estimado con precios vigentes; el total real lo confirma el backend al guardar.
              </span>
            )}
          </div>

          {error && (
            <p className="field__error" role="alert">
              {error}
            </p>
          )}

          {/* ── Acciones principales ── */}
          <div className="modal__acciones">
            <Button type="button" variant="ghost" onClick={onClose} disabled={guardando}>
              Cerrar
            </Button>
            {edicion ? (
              <Button type="button" variant="primary" onClick={guardarCambios} disabled={!puedeGuardar || guardando}>
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={crear} disabled={!puedeCrear || guardando}>
                {guardando ? 'Creando…' : 'Crear pedido'}
              </Button>
            )}
          </div>

          {/* ── Cambiar estado (edición, acción independiente) ── */}
          {edicion && transiciones.length > 0 && (
            <div className="pedido-modal__estado-box">
              <span className="field__label">Cambiar estado</span>
              <div className="pedido-modal__estado-btns">
                {transiciones.map((destino) => (
                  <Button
                    key={destino}
                    type="button"
                    variant={destino === 'cancelado' ? 'ghost' : 'primary'}
                    onClick={() => aplicarEstado(destino)}
                    disabled={cambiandoEstado}
                  >
                    {ETIQUETA_ESTADO[destino]}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PedidoModal
