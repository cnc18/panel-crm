import Card from './Card'
import './KpiCard.css'

// Tarjeta de número clave: label en mayúsculas, valor grande en Fraunces.
function KpiCard({ label, valor, subtexto }) {
  return (
    <Card className="kpi">
      <span className="kpi__label">{label}</span>
      <span className="kpi__valor">{valor}</span>
      {subtexto && <span className="kpi__sub">{subtexto}</span>}
    </Card>
  )
}

export default KpiCard
