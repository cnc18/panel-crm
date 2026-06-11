import './Button.css'

// Botón con variantes: 'primary' (oscuro) | 'ghost' (borde).
function Button({ variant = 'primary', type = 'button', className = '', children, ...rest }) {
  return (
    <button type={type} className={`btn btn--${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  )
}

export default Button
