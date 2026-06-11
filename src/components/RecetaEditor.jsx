import { useCallback, useEffect, useMemo, useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import {
  getReceta,
  getDisponibilidad,
  getMateriasPrimas,
  editarReceta,
  agregarInsumo,
  quitarInsumo,
} from '../api/crm'
import Button from './Button'
import Skeleton from './Skeleton'
import './RecetaEditor.css'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
const fmtNum = (v) => (Number(v) || 0).toLocaleString('es-CO')

// Editor de receta del producto seleccionado. Carga receta + disponibilidad +
// materias primas, ejecuta las acciones contra el CRM y refresca tras cada cambio.
function RecetaEditor({ producto, onChanged }) {
  const [receta, setReceta] = useState(null)
  const [disponibilidad, setDisponibilidad] = useState(null)
  const [materias, setMaterias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)

  const [insumos, setInsumos] = useState([])
  const [nuevaMateria, setNuevaMateria] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [agregando, setAgregando] = useState(false)
  const [quitandoId, setQuitandoId] = useState(null)
  const [accionError, setAccionError] = useState(null)

  // Carga (o recarga) receta + disponibilidad + materias primas.
  const cargar = useCallback(async () => {
    if (!producto?.id) return
    setCargando(true)
    setErrorCarga(null)
    setAccionError(null)
    try {
      const r = await getReceta(producto.id).catch((e) => {
        if (e.status === 404) return { insumos: [] } // respaldo: producto sin receta (legacy)
        throw e
      })
      const disp = await getDisponibilidad(producto.id).catch(() => null)
      const mats = await getMateriasPrimas().catch(() => [])
      setReceta(r)
      setDisponibilidad(disp)
      setMaterias(mats || [])
    } catch (e) {
      setErrorCarga(e.message)
    } finally {
      setCargando(false)
    }
  }, [producto?.id])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Sincroniza el estado editable cuando llega/recarga la receta.
  useEffect(() => {
    setInsumos(
      (receta?.insumos || []).map((i) => ({
        id: i.id, // puede no venir (RecetaSalida no expone el id de línea hoy)
        materia_prima_id: i.materia_prima_id,
        nombre: i.nombre,
        cantidad: i.cantidad != null ? String(i.cantidad) : '',
        unidad: i.unidad,
      }))
    )
    setNuevaMateria('')
    setNuevaCantidad('')
    setAccionError(null)
  }, [receta])

  const materiaPorId = useMemo(() => Object.fromEntries(materias.map((m) => [m.id, m])), [materias])
  // Excluye del selector las materias que ya están en la receta (sin duplicar).
  const usados = new Set(insumos.map((i) => Number(i.materia_prima_id)))
  const paraAgregar = materias.filter((m) => !usados.has(Number(m.id)))
  // Unidades producibles (puede venir como número o string).
  const unidades =
    disponibilidad?.unidades_disponibles == null
      ? null
      : Number(disponibilidad.unidades_disponibles)
  const hayUnidades = Number.isFinite(unidades)
  const puedeAgregar = nuevaMateria !== '' && Number(nuevaCantidad) > 0
  const ocupado = guardando || agregando || quitandoId != null

  function cambiarCantidad(idx, valor) {
    setInsumos((prev) => prev.map((i, k) => (k === idx ? { ...i, cantidad: valor } : i)))
  }

  // Guardar receta -> PUT con la lista completa (persiste las cantidades editadas).
  async function guardar() {
    if (insumos.some((i) => !(Number(i.cantidad) > 0))) {
      setAccionError('Todas las cantidades deben ser mayores a 0.')
      return
    }
    const payload = insumos.map((i) => ({
      materia_prima_id: i.materia_prima_id,
      cantidad: Number(i.cantidad),
      unidad: i.unidad,
    }))
    setAccionError(null)
    setGuardando(true)
    try {
      await editarReceta(producto.id, payload)
      await cargar()
      onChanged?.()
    } catch (e) {
      setAccionError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  // Agregar insumo -> POST y refresca (incluye `unidad`: el CRM la exige).
  async function agregar() {
    const m = materiaPorId[Number(nuevaMateria)]
    if (!m || !(Number(nuevaCantidad) > 0)) return
    setAccionError(null)
    setAgregando(true)
    try {
      await agregarInsumo(producto.id, {
        materia_prima_id: m.id,
        cantidad: Number(nuevaCantidad),
        unidad: m.unidad,
      })
      await cargar()
      onChanged?.()
    } catch (e) {
      setAccionError(e.message)
    } finally {
      setAgregando(false)
    }
  }

  // Quitar insumo -> DELETE por id de línea; si el CRM no lo expone, PUT sin ese
  // insumo (usando las cantidades del servidor, no ediciones sin guardar).
  async function quitar(insumo) {
    setAccionError(null)
    setQuitandoId(insumo.materia_prima_id)
    try {
      if (insumo.id != null) {
        await quitarInsumo(insumo.id)
      } else {
        const restantes = (receta?.insumos || [])
          .filter((i) => i.materia_prima_id !== insumo.materia_prima_id)
          .map((i) => ({
            materia_prima_id: i.materia_prima_id,
            cantidad: Number(i.cantidad),
            unidad: i.unidad,
          }))
        await editarReceta(producto.id, restantes)
      }
      await cargar()
      onChanged?.()
    } catch (e) {
      setAccionError(e.message)
    } finally {
      setQuitandoId(null)
    }
  }

  return (
    <div className="receta-editor">
      <header className="receta-editor__head">
        <h2 className="receta-editor__nombre">{producto.nombre}</h2>
        <span className="receta-editor__precio">{cop.format(Number(producto.precio) || 0)}</span>
      </header>

      {cargando ? (
        <>
          <Skeleton height={42} radius="10px" />
          <Skeleton height={120} radius="10px" />
        </>
      ) : errorCarga ? (
        <div className="api-error" role="alert">
          <p>Error al cargar la receta: {errorCarga}</p>
          <Button variant="ghost" onClick={cargar}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          {hayUnidades ? (
            <div className="receta-editor__disp" role="status">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>
                Con el stock actual puedes producir <strong>{unidades}</strong>{' '}
                {unidades === 1 ? 'unidad' : 'unidades'}.
              </span>
            </div>
          ) : (
            <div className="receta-editor__disp receta-editor__disp--neutro">
              Disponibilidad no calculada.
            </div>
          )}

          <div className="receta-tabla-wrap">
            <table className="receta-tabla">
              <thead>
                <tr>
                  <th>Materia prima</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th>Disponible</th>
                  <th aria-label="Quitar" />
                </tr>
              </thead>
              <tbody>
                {insumos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="receta-tabla__vacia">
                      Sin insumos todavía. Agrega las materias primas para definir cómo se produce
                      este perfume.
                    </td>
                  </tr>
                ) : (
                  insumos.map((i, idx) => {
                    const m = materiaPorId[i.materia_prima_id]
                    return (
                      <tr key={i.materia_prima_id}>
                        <td>{i.nombre}</td>
                        <td>
                          <input
                            className="receta-tabla__input"
                            type="number"
                            min="0"
                            step="any"
                            value={i.cantidad}
                            onChange={(e) => cambiarCantidad(idx, e.target.value)}
                            disabled={ocupado}
                            aria-label={`Cantidad de ${i.nombre}`}
                          />
                        </td>
                        <td className="receta-tabla__unidad">{i.unidad}</td>
                        <td className="receta-tabla__disp">
                          {m ? `${fmtNum(m.stock_actual)} ${m.unidad}` : '—'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="receta-tabla__quitar"
                            onClick={() => quitar(i)}
                            disabled={ocupado}
                            aria-label={`Quitar ${i.nombre}`}
                          >
                            <X size={16} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Fila de agregar — siempre al final de la tabla */}
          {paraAgregar.length > 0 ? (
            <div className="receta-agregar">
              <select
                className="receta-agregar__select"
                value={nuevaMateria}
                onChange={(e) => setNuevaMateria(e.target.value)}
                disabled={ocupado}
                aria-label="Materia prima a agregar"
              >
                <option value="">Materia prima…</option>
                {paraAgregar.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} ({m.unidad})
                  </option>
                ))}
              </select>
              <input
                className="receta-agregar__cant"
                type="number"
                min="0"
                step="any"
                value={nuevaCantidad}
                onChange={(e) => setNuevaCantidad(e.target.value)}
                placeholder="Cantidad"
                disabled={ocupado}
                aria-label="Cantidad del nuevo insumo"
              />
              <Button onClick={agregar} disabled={!puedeAgregar || ocupado}>
                {agregando ? 'Agregando…' : 'Agregar'}
              </Button>
            </div>
          ) : materias.length > 0 ? (
            <p className="receta-agregar__aviso">
              Todos los insumos disponibles ya están en la receta.
            </p>
          ) : (
            <p className="receta-agregar__aviso">
              No hay materias primas registradas. Créalas para poder agregarlas.
            </p>
          )}

          {accionError && (
            <p className="receta-editor__error" role="alert">
              {accionError}
            </p>
          )}

          <div className="receta-editor__acciones">
            <Button onClick={guardar} disabled={ocupado}>
              {guardando ? 'Guardando…' : 'Guardar receta'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default RecetaEditor
