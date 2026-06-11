import './Card.css'

// Tarjeta base: borde, sombra suave y línea dorada lateral al hover.
function Card({ children, className = '', ...rest }) {
  return (
    <div className={`card ${className}`.trim()} {...rest}>
      {children}
    </div>
  )
}

export default Card
