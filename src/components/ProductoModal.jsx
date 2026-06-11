import { useEffect, useRef, useState } from 'react'
import Button from './Button'
import './ProductoModal.css'

// Modal crear/editar producto. Si recibe `producto` -> modo edición.
// `onSubmit(datos)` lo conecta el padre a crear o editar (y refresca la lista).
function ProductoModal({ producto, onClose, onSubmit, error }) {
  const edicion = Boolean(producto)
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [precio, setPrecio] = useState(producto?.precio != null ? String(producto.precio) : '')
  const [tocado, setTocado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const nombreRef = useRef(null)

  // Validación.
  const precioNum = Number(precio)
  const errNombre = nombre.trim() === '' ? 'El nombre es obligatorio.' : ''
  const errPrecio =
    precio === '' || Number.isNaN(precioNum) || precioNum <= 0
      ? 'El precio debe ser mayor a 0.'
      : ''
  const valido = !errNombre && !errPrecio

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
      await onSubmit({ nombre: nombre.trim(), precio: precioNum })
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
        aria-labelledby="modal-titulo"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="modal-titulo" className="modal__titulo">
          {edicion ? 'Editar producto' : 'Nuevo producto'}
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
              placeholder="Ej. Invictus 100ml"
              aria-invalid={tocado && Boolean(errNombre)}
            />
            {tocado && errNombre && <span className="field__error">{errNombre}</span>}
          </label>

          <label className="field">
            <span className="field__label">Precio (COP)</span>
            <input
              className="field__input"
              type="number"
              min="0"
              step="any"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="90000"
              aria-invalid={tocado && Boolean(errPrecio)}
            />
            {tocado && errPrecio && <span className="field__error">{errPrecio}</span>}
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

export default ProductoModal
