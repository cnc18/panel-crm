import { useEffect, useRef, useState } from 'react'
import { getProductos } from '../api/crm'
import Button from './Button'
import './ProductoModal.css' // reusa el shell de modal y los estilos de campo
import './OfertaModal.css'

// Recorta a 'YYYY-MM-DD' para el input date (la API puede mandar fecha o datetime).
const aFechaInput = (v) => (v ? String(v).slice(0, 10) : '')

// Modal crear/editar oferta. Si recibe `oferta` -> modo edición.
// `onSubmit(datos)` lo conecta el padre a crear o editar (y refresca la lista).
function OfertaModal({ oferta, onClose, onSubmit, error }) {
  const edicion = Boolean(oferta)
  const [titulo, setTitulo] = useState(oferta?.titulo ?? '')
  const [descripcion, setDescripcion] = useState(oferta?.descripcion ?? '')
  const [productoId, setProductoId] = useState(
    oferta?.producto_id != null ? String(oferta.producto_id) : ''
  )
  const [fechaInicio, setFechaInicio] = useState(aFechaInput(oferta?.fecha_inicio))
  const [fechaFin, setFechaFin] = useState(aFechaInput(oferta?.fecha_fin))
  const [activa, setActiva] = useState(oferta?.activa ?? true)

  const [productos, setProductos] = useState([])
  const [tocado, setTocado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const tituloRef = useRef(null)

  // Validación.
  const errTitulo = titulo.trim() === '' ? 'El título es obligatorio.' : ''
  const errDescripcion = descripcion.trim() === '' ? 'La descripción es obligatoria.' : ''
  // Comparación de strings 'YYYY-MM-DD' equivale a comparación de fechas.
  const errFechas =
    fechaInicio && fechaFin && fechaFin < fechaInicio
      ? 'La fecha de fin no puede ser anterior a la de inicio.'
      : ''
  const valido = !errTitulo && !errDescripcion && !errFechas

  // Carga los productos para el select (si falla, queda solo "General").
  useEffect(() => {
    getProductos()
      .then((p) => setProductos(p || []))
      .catch(() => setProductos([]))
  }, [])

  // Foco inicial, cierre con Escape y bloqueo de scroll del fondo.
  useEffect(() => {
    tituloRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!valido) {
      setTocado(true)
      return
    }
    try {
      setGuardando(true)
      await onSubmit({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        producto_id: productoId === '' ? null : Number(productoId),
        fecha_inicio: fechaInicio || null,
        fecha_fin: fechaFin || null,
        activa,
        creada_por: oferta?.creada_por ?? 'manual',
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="oferta-modal-titulo"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="oferta-modal-titulo" className="modal__titulo">
          {edicion ? 'Editar oferta' : 'Nueva oferta'}
        </h2>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="field__label">Título</span>
            <input
              ref={tituloRef}
              className="field__input"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. 2x1 en perfumes seleccionados"
              aria-invalid={tocado && Boolean(errTitulo)}
            />
            {tocado && errTitulo && <span className="field__error">{errTitulo}</span>}
          </label>

          <label className="field">
            <span className="field__label">Descripción</span>
            <textarea
              className="field__input field__textarea"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Detalle de la oferta para el cliente…"
              aria-invalid={tocado && Boolean(errDescripcion)}
            />
            {tocado && errDescripcion && <span className="field__error">{errDescripcion}</span>}
          </label>

          <label className="field">
            <span className="field__label">Producto asociado</span>
            <select
              className="field__input"
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
            >
              <option value="">General / Sin producto específico</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="oferta__fechas">
            <label className="field">
              <span className="field__label">Fecha inicio</span>
              <input
                className="field__input"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Fecha fin</span>
              <input
                className="field__input"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                aria-invalid={tocado && Boolean(errFechas)}
              />
            </label>
          </div>
          {tocado && errFechas && <span className="field__error">{errFechas}</span>}

          <label className="field--check">
            <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} />
            <span>Oferta activa</span>
          </label>

          {error && (
            <p className="field__error" role="alert">
              {error}
            </p>
          )}

          <div className="modal__acciones">
            <Button type="button" variant="ghost" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OfertaModal
