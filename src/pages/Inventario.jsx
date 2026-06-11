import { useCallback, useEffect, useState } from 'react'
import { Search, Plus } from 'lucide-react'
import {
  getMateriasPrimas,
  crearMateria,
  editarMateria,
  eliminarMateria,
  ajustarStock,
} from '../api/crm'
import Card from '../components/Card'
import Button from '../components/Button'
import Skeleton from '../components/Skeleton'
import MateriaCard from '../components/MateriaCard'
import MateriaModal from '../components/MateriaModal'
import ReponerStockModal from '../components/ReponerStockModal'
import ConfirmDialog from '../components/ConfirmDialog'
import './Inventario.css'

// Tabs de filtro: valor de tipo -> etiqueta.
const FILTROS = [
  { tipo: 'todas', label: 'Todas' },
  { tipo: 'esencia', label: 'Esencias' },
  { tipo: 'alcohol', label: 'Alcoholes' },
  { tipo: 'frasco', label: 'Frascos' },
]

function Inventario() {
  const [materias, setMaterias] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todas')

  // Modal crear/editar.
  const [modal, setModal] = useState({ abierto: false, materia: null })
  const [submitError, setSubmitError] = useState(null)

  // Modal reponer stock.
  const [reponer, setReponer] = useState(null)
  const [reponerError, setReponerError] = useState(null)

  // Confirmación de borrado.
  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setMaterias(await getMateriasPrimas())
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
  const filtrados = (materias || []).filter((m) => {
    const coincideNombre = (m.nombre || '').toLowerCase().includes(q)
    const coincideTipo = tipoFiltro === 'todas' || (m.tipo || '').toLowerCase() === tipoFiltro
    return coincideNombre && coincideTipo
  })

  // Crear / editar.
  const abrirCrear = () => {
    setSubmitError(null)
    setModal({ abierto: true, materia: null })
  }
  const abrirEditar = (materia) => {
    setSubmitError(null)
    setModal({ abierto: true, materia })
  }
  const cerrarModal = () => {
    setModal({ abierto: false, materia: null })
    setSubmitError(null)
  }
  const guardar = async (datos) => {
    setSubmitError(null)
    try {
      if (modal.materia) await editarMateria(modal.materia.id, datos)
      else await crearMateria(datos)
      cerrarModal()
      await cargar()
    } catch (e) {
      setSubmitError(e.message) // se muestra dentro del modal
    }
  }

  // Reponer stock (PATCH valor absoluto).
  const guardarStock = async (datos) => {
    if (!reponer) return
    setReponerError(null)
    try {
      await ajustarStock(reponer.id, datos)
      setReponer(null)
      await cargar()
    } catch (e) {
      setReponerError(e.message)
    }
  }

  // Eliminar (borrado suave).
  const confirmarEliminar = async () => {
    if (!aEliminar) return
    setDeleteError(null)
    setEliminando(true)
    try {
      await eliminarMateria(aEliminar.id)
      setAEliminar(null)
      await cargar()
    } catch (e) {
      setDeleteError(e.message)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="inventario">
      <div className="inventario__head">
        <div className="inventario__titulo">
          <h1>Inventario</h1>
          {materias && (
            <span className="inventario__count">
              {materias.length} {materias.length === 1 ? 'materia activa' : 'materias activas'}
            </span>
          )}
        </div>
        <Button onClick={abrirCrear}>
          <Plus size={16} aria-hidden="true" /> Nueva materia prima
        </Button>
      </div>

      <div className="inventario__buscador">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre…"
          aria-label="Buscar materias primas"
        />
      </div>

      {/* Filtro por tipo */}
      <div className="inventario__filtros" role="tablist" aria-label="Filtrar por tipo">
        {FILTROS.map((f) => (
          <button
            key={f.tipo}
            type="button"
            role="tab"
            aria-selected={tipoFiltro === f.tipo}
            className={`inventario__tab${tipoFiltro === f.tipo ? ' activo' : ''}`}
            onClick={() => setTipoFiltro(f.tipo)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Carga */}
      {cargando && (
        <div className="inventario__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="materia">
              <div className="materia__head">
                <Skeleton width="55%" height={18} />
                <Skeleton width={56} height={22} radius="999px" />
              </div>
              <Skeleton width={70} height={22} radius="999px" />
              <Skeleton width="45%" height={14} />
              <div className="materia__acciones">
                <Skeleton height={36} radius="10px" />
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
          <p>Error al cargar el inventario: {error}</p>
          <Button variant="ghost" onClick={cargar}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Vacío (sin materias) */}
      {!cargando && !error && materias && materias.length === 0 && (
        <Card className="inventario__vacio">
          <p>Aún no tienes materias primas.</p>
          <Button onClick={abrirCrear}>Crear la primera</Button>
        </Card>
      )}

      {/* Sin coincidencias de búsqueda/filtro */}
      {!cargando && !error && materias && materias.length > 0 && filtrados.length === 0 && (
        <p className="empty">No hay materias primas que coincidan con el filtro.</p>
      )}

      {/* Cuadrícula */}
      {!cargando && !error && filtrados.length > 0 && (
        <div className="inventario__grid">
          {filtrados.map((m) => (
            <MateriaCard
              key={m.id}
              materia={m}
              onEdit={abrirEditar}
              onReponer={setReponer}
              onDelete={setAEliminar}
            />
          ))}
        </div>
      )}

      {modal.abierto && (
        <MateriaModal
          materia={modal.materia}
          error={submitError}
          onClose={cerrarModal}
          onSubmit={guardar}
        />
      )}

      {reponer && (
        <ReponerStockModal
          materia={reponer}
          error={reponerError}
          onClose={() => {
            setReponer(null)
            setReponerError(null)
          }}
          onSubmit={guardarStock}
        />
      )}

      {aEliminar && (
        <ConfirmDialog
          titulo="Eliminar materia prima"
          mensaje={`¿Eliminar «${aEliminar.nombre}»? Es un borrado suave: se marca como inactiva y deja de listarse, pero no se borra de la base.`}
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

export default Inventario
