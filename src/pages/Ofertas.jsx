import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import {
  getOfertas,
  getProductos,
  crearOferta,
  editarOferta,
  eliminarOferta,
  cambiarEstadoOferta,
} from '../api/crm'
import Card from '../components/Card'
import Button from '../components/Button'
import Skeleton from '../components/Skeleton'
import OfertaCard from '../components/OfertaCard'
import OfertaModal from '../components/OfertaModal'
import ConfirmDialog from '../components/ConfirmDialog'
import './Ofertas.css'

function Ofertas() {
  const [ofertas, setOfertas] = useState(null)
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [mostrarInactivas, setMostrarInactivas] = useState(true)

  // Modal crear/editar.
  const [modal, setModal] = useState({ abierto: false, oferta: null })
  const [submitError, setSubmitError] = useState(null)

  // Confirmación de borrado.
  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [ofs, prods] = await Promise.all([getOfertas(), getProductos().catch(() => [])])
      setOfertas(ofs || [])
      setProductos(prods || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Mapa producto_id -> nombre para el chip de la tarjeta.
  const nombrePorProducto = useMemo(
    () => Object.fromEntries(productos.map((p) => [p.id, p.nombre])),
    [productos]
  )

  const activas = (ofertas || []).filter((o) => o.activa)
  const inactivas = (ofertas || []).filter((o) => !o.activa)

  // Toggle en vivo: actualiza solo esa oferta en el estado (la tarjeta cambia de sección).
  const handleToggled = (id, nuevaActiva) => {
    setOfertas((prev) => prev.map((o) => (o.id === id ? { ...o, activa: nuevaActiva } : o)))
  }

  // Crear / editar.
  const abrirCrear = () => {
    setSubmitError(null)
    setModal({ abierto: true, oferta: null })
  }
  const abrirEditar = (oferta) => {
    setSubmitError(null)
    setModal({ abierto: true, oferta })
  }
  const cerrarModal = () => {
    setModal({ abierto: false, oferta: null })
    setSubmitError(null)
  }
  const guardar = async (datos) => {
    setSubmitError(null)
    try {
      if (modal.oferta) {
        await editarOferta(modal.oferta.id, datos)
      } else {
        // OfertaCrear ignora `activa` (el CRM la pone true); si se pidió inactiva, se ajusta.
        const creada = await crearOferta(datos)
        if (creada?.id && datos.activa === false) await cambiarEstadoOferta(creada.id, false)
      }
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
      await eliminarOferta(aEliminar.id)
      setAEliminar(null)
      await cargar()
    } catch (e) {
      setDeleteError(e.message)
    } finally {
      setEliminando(false)
    }
  }

  const total = ofertas?.length ?? 0

  return (
    <div className="ofertas">
      <div className="ofertas__head">
        <div className="ofertas__titulo">
          <h1>Ofertas</h1>
          {ofertas && (
            <span className="ofertas__count">
              {activas.length} activas · {inactivas.length} inactivas
            </span>
          )}
        </div>
        <Button onClick={abrirCrear}>
          <Plus size={16} aria-hidden="true" /> Nueva oferta
        </Button>
      </div>

      {/* Carga */}
      {cargando && (
        <div className="ofertas__grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="oferta">
              <div className="oferta__head">
                <Skeleton width="55%" height={18} />
                <Skeleton width={38} height={22} radius="999px" />
              </div>
              <Skeleton width="90%" height={13} />
              <Skeleton width="70%" height={13} />
              <div className="oferta__acciones">
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
          <p>Error al cargar las ofertas: {error}</p>
          <Button variant="ghost" onClick={cargar}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Vacío total */}
      {!cargando && !error && total === 0 && (
        <Card className="ofertas__vacio">
          <p>Aún no tienes ofertas.</p>
          <Button onClick={abrirCrear}>Crear la primera</Button>
        </Card>
      )}

      {/* Contenido */}
      {!cargando && !error && total > 0 && (
        <>
          <section className="ofertas__seccion">
            <h2 className="ofertas__seccion-titulo">
              Activas ahora <span className="ofertas__seccion-n">{activas.length}</span>
            </h2>
            {activas.length > 0 ? (
              <div className="ofertas__grid">
                {activas.map((o) => (
                  <OfertaCard
                    key={o.id}
                    oferta={o}
                    productoNombre={o.producto_id != null ? nombrePorProducto[o.producto_id] : null}
                    onEdit={abrirEditar}
                    onDelete={setAEliminar}
                    onChanged={handleToggled}
                  />
                ))}
              </div>
            ) : (
              <p className="empty">No hay ofertas activas ahora.</p>
            )}
          </section>

          {inactivas.length > 0 && (
            <section className="ofertas__seccion">
              <button
                type="button"
                className="ofertas__seccion-toggle"
                aria-expanded={mostrarInactivas}
                onClick={() => setMostrarInactivas((v) => !v)}
              >
                <ChevronDown
                  size={18}
                  className={`ofertas__chevron${mostrarInactivas ? ' abierto' : ''}`}
                  aria-hidden="true"
                />
                Inactivas <span className="ofertas__seccion-n">{inactivas.length}</span>
              </button>
              {mostrarInactivas && (
                <div className="ofertas__grid">
                  {inactivas.map((o) => (
                    <OfertaCard
                      key={o.id}
                      oferta={o}
                      productoNombre={
                        o.producto_id != null ? nombrePorProducto[o.producto_id] : null
                      }
                      onEdit={abrirEditar}
                      onDelete={setAEliminar}
                      onChanged={handleToggled}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {modal.abierto && (
        <OfertaModal
          oferta={modal.oferta}
          error={submitError}
          onClose={cerrarModal}
          onSubmit={guardar}
        />
      )}

      {aEliminar && (
        <ConfirmDialog
          titulo="Eliminar oferta"
          mensaje={`¿Eliminar «${aEliminar.titulo}»? Es un borrado suave: se marca como inactiva y deja de listarse, pero no se borra de la base.`}
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

export default Ofertas
