import Card from './Card'
import Badge from './Badge'
import Button from './Button'
import './MateriaCard.css'

const fmtNum = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })

// Estado de stock: umbral simple (>10 OK, 1-10 Bajo, 0 Agotado).
function estadoStock(n) {
  if (n <= 0) return { type: 'out', texto: 'Agotado' }
  if (n <= 10) return { type: 'low', texto: 'Bajo' }
  return { type: 'ok', texto: 'OK' }
}

// "unidad" se pluraliza; ml/gramos quedan igual.
function unidadLabel(unidad, n) {
  if (unidad === 'unidad') return n === 1 ? 'unidad' : 'unidades'
  return unidad
}

function MateriaCard({ materia, onEdit, onReponer, onDelete }) {
  const { nombre, unidad } = materia
  const stock = Number(materia.stock_actual) || 0
  const estado = estadoStock(stock)
  // Normaliza el tipo (puede venir en mayúsculas): minúscula para el badge, capitalizado para mostrar.
  const tipo = (materia.tipo || '').toLowerCase()
  const tipoLabel = tipo ? tipo[0].toUpperCase() + tipo.slice(1) : '—'

  return (
    <Card className="materia">
      <div className="materia__head">
        <h3 className="materia__nombre">{nombre}</h3>
        <Badge type={estado.type} className="materia__estado">
          <span className="badge__dot" aria-hidden="true" />
          {estado.texto}
        </Badge>
      </div>

      <Badge type={tipo} className="materia__tipo">
        {tipoLabel}
      </Badge>

      <p className="materia__stock">
        <span className="materia__num">{fmtNum.format(stock)}</span> {unidadLabel(unidad, stock)}
      </p>

      <div className="materia__acciones">
        <Button variant="ghost" onClick={() => onEdit?.(materia)}>
          Editar
        </Button>
        <Button variant="ghost" onClick={() => onReponer?.(materia)}>
          Reponer
        </Button>
        <Button variant="ghost" className="danger" onClick={() => onDelete?.(materia)}>
          Eliminar
        </Button>
      </div>
    </Card>
  )
}

export default MateriaCard
