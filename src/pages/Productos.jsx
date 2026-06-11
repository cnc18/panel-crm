import { useCallback, useEffect, useState } from 'react'
import { Search, Plus } from 'lucide-react'
import {
  getProductosConDisponibilidad,
  crearProducto,
  editarProducto,
  eliminarProducto,
} from '../api/crm'
import Card from '../components/Card'
import Button from '../components/Button'
import Skeleton from '../components/Skeleton'
import ProductoCard from '../components/ProductoCard'
import ProductoModal from '../components/ProductoModal'
import ConfirmDialog from '../components/ConfirmDialog'
import './Productos.css'

function Productos() {
  const [productos, setProductos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  // Modal crear/editar.
  const [modal, setModal] = useState({ abierto: false, producto: null })
  const [submitError, setSubmitError] = useState(null)

  // Confirmación de borrado.
  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setProductos(await getProductosConDisponibilidad())
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const q = busqueda.trim().toLowerCase()
  const filtrados = (productos || []).filter((p) => (p.nombre || '').toLowerCase().includes(q))

  // Crear / editar.
  const abrirCrear = () => {
    setSubmitError(null)
    setModal({ abierto: true, producto: null })
  }
  const abrirEditar = (producto) => {
    setSubmitError(null)
    setModal({ abierto: true, producto })
  }
  const cerrarModal = () => {
    setModal({ abierto: false, producto: null })
    setSubmitError(null)
  }
  const guardar = async (datos) => {
    setSubmitError(null)
    try {
      if (modal.producto) await editarProducto(modal.producto.id, datos)
      else await crearProducto(datos)
      cerrarModal()
      await cargar()
    } catch (e) {
      setSubmitError(e.message) // se muestra dentro del modal
    }
  }

  // Eliminar (borrado suave).
  const confirmarEliminar = async () => {
    if (!aEliminar) return
    setDeleteError(null)
    setEliminando(true)
    try {
      await eliminarProducto(aEliminar.id)
      setAEliminar(null)
      await cargar()
    } catch (e) {
      setDeleteError(e.message)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="productos">
      <div className="productos__head">
        <div className="productos__titulo">
          <h1>Productos</h1>
          {productos && (
            <span className="productos__count">
              {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
            </span>
          )}
        </div>
        <Button onClick={abrirCrear}>
          <Plus size={16} aria-hidden="true" /> Nuevo producto
        </Button>
      </div>

      <div className="productos__buscador">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre…"
          aria-label="Buscar productos"
        />
      </div>

      {/* Carga */}
      {cargando && (
        <div className="productos__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="producto">
              <div className="producto__head">
                <Skeleton width="60%" height={18} />
                <Skeleton width={72} height={22} radius="999px" />
              </div>
              <Skeleton width="40%" height={20} />
              <Skeleton width="55%" height={13} />
              <div className="producto__acciones">
                <Skeleton height={36} radius="10px" />
                <Skeleton height={36} radius="10px" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {!cargando && error && (
        <div className="api-error" role="alert">
          <p>Error al cargar los productos: {error}</p>
          <Button variant="ghost" onClick={cargar}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Vacío (sin productos) */}
      {!cargando && !error && productos && productos.length === 0 && (
        <Card className="productos__vacio">
          <p>Aún no tienes productos.</p>
          <Button onClick={abrirCrear}>Crear el primero</Button>
        </Card>
      )}

      {/* Sin coincidencias de búsqueda */}
      {!cargando && !error && productos && productos.length > 0 && filtrados.length === 0 && (
        <p className="empty">No hay productos que coincidan con «{busqueda}».</p>
      )}

      {/* Cuadrícula */}
      {!cargando && !error && filtrados.length > 0 && (
        <div className="productos__grid">
          {filtrados.map((p) => (
            <ProductoCard key={p.id} producto={p} onEdit={abrirEditar} onDelete={setAEliminar} />
          ))}
        </div>
      )}

      {modal.abierto && (
        <ProductoModal
          producto={modal.producto}
          error={submitError}
          onClose={cerrarModal}
          onSubmit={guardar}
        />
      )}

      {aEliminar && (
        <ConfirmDialog
          titulo="Eliminar producto"
          mensaje={`¿Eliminar «${aEliminar.nombre}»? Es un borrado suave: se marca como inactivo y deja de listarse, pero no se borra de la base.`}
          confirmLabel="Eliminar"
          procesandoLabel="Eliminando…"
          danger
          procesando={eliminando}
          error={deleteError}
          onConfirm={confirmarEliminar}
          onCancel={() => {
            setAEliminar(null)
            setDeleteError(null)
          }}
        />
      )}
    </div>
  )
}

export default Productos
