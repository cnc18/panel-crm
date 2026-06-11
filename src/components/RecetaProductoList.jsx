import './RecetaProductoList.css'

// Columna izquierda de Recetas. Cada producto trae `n_insumos` (nº de insumos de
// su receta). Todo producto tiene receta (se crea vacia al crearlo); si aun no
// tiene insumos se muestra "Sin insumos" (no "Sin receta", que confundiria).
function RecetaProductoList({ productos, seleccionadoId, onSelect }) {
  return (
    <ul className="receta-lista">
      {productos.map((p) => {
        const n = p.n_insumos
        const sub =
          typeof n === 'number' && n > 0 ? `${n} ${n === 1 ? 'insumo' : 'insumos'}` : 'Sin insumos'
        const activo = p.id === seleccionadoId
        return (
          <li key={p.id}>
            <button
              type="button"
              className={`receta-item${activo ? ' activo' : ''}`}
              aria-current={activo ? 'true' : undefined}
              onClick={() => onSelect?.(p)}
            >
              <span className="receta-item__nombre">{p.nombre}</span>
              <span className="receta-item__sub">{sub}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default RecetaProductoList
