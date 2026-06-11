import './Skeleton.css'

// Bloque de carga con shimmer suave (placeholder elegante).
function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-sm)', className = '', style }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

export default Skeleton
