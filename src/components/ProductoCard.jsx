import Card from './Card'
import Badge from './Badge'
import Button from './Button'
import './ProductoCard.css'

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Deriva el estado de stock según las unidades producibles.
function estadoStock(n) {
  if (n == null) return null
  if (n === 0) return { type: 'out', texto: 'Agotado' }
  if (n <= 3) return { type: 'low', texto: `Bajo · ${n}` }
  return { type: 'ok', texto: `Disponible · ${n}` }
}

function ProductoCard({ producto, onEdit, onDelete }) {
  const { nombre, precio, unidades_disponibles: n } = producto
  const stock = estadoStock(n)

  return (
    <Card className="producto">
      <div className="producto__head">
        <h3 className="producto__nombre">{nombre}</h3>
        {stock ? (
          <Badge type={stock.type}>{stock.texto}</Badge>
        ) : (
          <span className="producto__sindato">Sin dato</span>
        )}
      </div>

      <p className="producto__precio">{cop.format(Number(precio) || 0)}</p>

      <p className="producto__unidades">
        <span className="producto__num">{n ?? '—'}</span> unidades · según receta
      </p>

      <div className="producto__acciones">
        <Button variant="ghost" onClick={() => onEdit?.(producto)}>
          Editar
        </Button>
        <Button variant="ghost" className="danger" onClick={() => onDelete?.(producto)}>
          Eliminar
        </Button>
      </div>
    </Card>
  )
}

export default ProductoCard
