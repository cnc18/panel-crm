import { useEffect, useState } from 'react'
import { getResumen } from '../api/crm'
import Card from '../components/Card'
import KpiCard from '../components/KpiCard'
import Skeleton from '../components/Skeleton'
import VentasChart from '../components/VentasChart'
import LeadsChart from '../components/LeadsChart'
import TopProductos from '../components/TopProductos'
import './Dashboard.css'

// Formato moneda COP (sin decimales).
const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const num = (v) => (v ?? 0).toLocaleString('es-CO')

function Dashboard() {
  const [resumen, setResumen] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getResumen()
      .then(setResumen)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  const r = resumen || {}

  return (
    <div className="dashboard">
      <header className="page-head">
        <h1>Dashboard</h1>
      </header>

      {/* KPIs (cada gráfica maneja su propia carga aparte) */}
      {cargando ? (
        <div className="kpi-row">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="kpi">
              <Skeleton width="55%" height={11} />
              <Skeleton width="80%" height={30} radius="8px" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="api-error" role="alert">
          Error al cargar el resumen: {error}
        </div>
      ) : (
        <div className="kpi-row">
          <KpiCard label="Ventas del mes" valor={cop.format(Number(r.ventas_mes) || 0)} />
          <KpiCard label="Clientes totales" valor={num(r.total_clientes)} />
          <KpiCard label="Pedidos pendientes" valor={num(r.pedidos_pendientes)} />
          <KpiCard label="Productos activos" valor={num(r.total_productos_activos)} />
        </div>
      )}

      {/* Ventas (ancha) + Leads (angosta) */}
      <div className="charts-row">
        <VentasChart />
        <LeadsChart />
      </div>

      {/* Top productos a todo el ancho */}
      <TopProductos />
    </div>
  )
}

export default Dashboard
