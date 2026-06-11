import { useEffect, useRef, useState } from 'react'
import Button from './Button'
import './ProductoModal.css' // reusa el shell de modal y los estilos de campo
import './ReponerStockModal.css'

const fmtNum = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })

// Modal para fijar el stock a un valor ABSOLUTO nuevo (no suma).
// `onSubmit({ stock_actual })` lo conecta el padre a ajustarStock (PATCH) y refresca.
function ReponerStockModal({ materia, onClose, onSubmit, error }) {
  const actual = Number(materia?.stock_actual) || 0
  const [valor, setValor] = useState(String(actual))
  const [tocado, setTocado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const valorRef = useRef(null)

  // Validación: valor absoluto >= 0.
  const valorNum = Number(valor)
  const errValor =
    valor === '' || Number.isNaN(valorNum) || valorNum < 0 ? 'El stock debe ser 0 o mayor.' : ''
  const valido = !errValor

  // Foco inicial (selecciona el texto), Escape para cerrar y bloqueo de scroll.
  useEffect(() => {
    valorRef.current?.select()
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
      await onSubmit({ stock_actual: valorNum })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal modal--sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reponer-modal-titulo"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="reponer-modal-titulo" className="modal__titulo">
          Reponer stock
        </h2>

        <p className="reponer__resumen">
          <strong>{materia?.nombre}</strong>
          <br />
          Stock actual: {fmtNum.format(actual)} {materia?.unidad}
        </p>

        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="field__label">¿Cuánto {materia?.unidad} tienes disponible ahora?</span>
            <input
              ref={valorRef}
              className="field__input"
              type="number"
              min="0"
              step="any"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0"
              aria-invalid={tocado && Boolean(errValor)}
            />
            {tocado && errValor && <span className="field__error">{errValor}</span>}
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

export default ReponerStockModal
