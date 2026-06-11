import { useEffect, useRef, useState } from 'react'
import Button from './Button'
import './ProductoModal.css' // reusa el shell de modal y los estilos de campo

const TIPOS = ['esencia', 'alcohol', 'frasco']
const UNIDADES = ['ml', 'gramos', 'unidad']
// Unidad sugerida según el tipo (el usuario puede cambiarla).
const UNIDAD_POR_TIPO = { esencia: 'gramos', alcohol: 'ml', frasco: 'unidad' }

// Modal crear/editar materia prima. Si recibe `materia` -> modo edición.
// `onSubmit(datos)` lo conecta el padre a crear o editar (y refresca la lista).
function MateriaModal({ materia, onClose, onSubmit, error }) {
  const edicion = Boolean(materia)
  const tipoInicial = (materia?.tipo ?? 'esencia').toLowerCase()
  const [nombre, setNombre] = useState(materia?.nombre ?? '')
  const [tipo, setTipo] = useState(tipoInicial)
  const [stock, setStock] = useState(
    materia?.stock_actual != null ? String(materia.stock_actual) : ''
  )
  const [unidad, setUnidad] = useState(materia?.unidad ?? UNIDAD_POR_TIPO[tipoInicial])
  const [tocado, setTocado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const nombreRef = useRef(null)

  // Validación.
  const stockNum = Number(stock)
  const errNombre = nombre.trim() === '' ? 'El nombre es obligatorio.' : ''
  const errStock =
    stock === '' || Number.isNaN(stockNum) || stockNum < 0
      ? 'El stock debe ser 0 o mayor.'
      : ''
  const valido = !errNombre && !errStock

  // Cambiar el tipo re-sugiere la unidad (el usuario puede volver a cambiarla).
  function cambiarTipo(nuevo) {
    setTipo(nuevo)
    setUnidad(UNIDAD_POR_TIPO[nuevo] ?? unidad)
  }

  // Foco inicial, cierre con Escape y bloqueo de scroll del fondo.
  useEffect(() => {
    nombreRef.current?.focus()
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
      await onSubmit({ nombre: nombre.trim(), tipo, stock_actual: stockNum, unidad })
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
        aria-labelledby="materia-modal-titulo"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="materia-modal-titulo" className="modal__titulo">
          {edicion ? 'Editar materia prima' : 'Nueva materia prima'}
        </h2>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="field__label">Nombre</span>
            <input
              ref={nombreRef}
              className="field__input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Esencia Invictus"
              aria-invalid={tocado && Boolean(errNombre)}
            />
            {tocado && errNombre && <span className="field__error">{errNombre}</span>}
          </label>

          <label className="field">
            <span className="field__label">Tipo</span>
            <select
              className="field__input"
              value={tipo}
              onChange={(e) => cambiarTipo(e.target.value)}
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">Stock actual</span>
            <input
              className="field__input"
              type="number"
              min="0"
              step="any"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
              aria-invalid={tocado && Boolean(errStock)}
            />
            {tocado && errStock && <span className="field__error">{errStock}</span>}
          </label>

          <label className="field">
            <span className="field__label">Unidad</span>
            <select
              className="field__input"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
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

export default MateriaModal
