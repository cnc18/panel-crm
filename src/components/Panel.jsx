import Card from './Card'
import './Panel.css'

// Panel de dashboard: tarjeta con título en serif.
function Panel({ title, children, className = '' }) {
  return (
    <Card className={`panel ${className}`.trim()}>
      {title && <h2 className="panel__title">{title}</h2>}
      {children}
    </Card>
  )
}

export default Panel
