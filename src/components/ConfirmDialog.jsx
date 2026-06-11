import { useEffect } from 'react'
import Button from './Button'
import './ConfirmDialog.css'

// Diálogo de confirmación reutilizable (overlay Atelier).
function ConfirmDialog({
  titulo,
  mensaje,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  procesandoLabel = 'Procesando…',
  danger = false,
  procesando = false,
  error,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onCancel])

  return (
    <div className="confirm-overlay" onMouseDown={onCancel}>
      <div
        className="confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-titulo" className="confirm__titulo">
          {titulo}
        </h2>
        {mensaje && <p className="confirm__mensaje">{mensaje}</p>}
        {error && (
          <p className="confirm__error" role="alert">
            {error}
          </p>
        )}

        <div className="confirm__acciones">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={procesando}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            className={danger ? 'danger-solid' : ''}
            onClick={onConfirm}
            disabled={procesando}
          >
            {procesando ? procesandoLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
