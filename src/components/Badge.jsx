import './Badge.css'

// Etiqueta de estado: type = 'ok' | 'low' | 'out'.
function Badge({ type = 'ok', children, className = '', ...rest }) {
  return (
    <span className={`badge badge--${type} ${className}`.trim()} {...rest}>
      {children}
    </span>
  )
}

export default Badge
