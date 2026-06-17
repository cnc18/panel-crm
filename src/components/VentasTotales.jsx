import { useEffect, useState } from 'react'
import { getResumen, getVentasPeriodo } from '../api/crm'
import Card from './Card'
import KpiCard from './KpiCard'
import Skeleton from './Skeleton'
import './VentasTotales.css'

// Formato moneda COP (sin decimales, separadores de miles). La API no da símbolo.
const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Fecha local como 'YYYY-MM-DD' (sin desfase de zona horaria de toISOString).
function fechaISO(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// Lunes de la semana actual (date_trunc('week') de Postgres empieza en lunes).
function lunesEstaSemana() {
  const d = new Date()
  const offset = (d.getDay() + 6) % 7 // domingo=0 -> 6; lunes=1 -> 0
  d.setDate(d.getDate() - offset)
  return fechaISO(d)
}

// La serie solo trae períodos CON ventas. Tomamos el último punto, pero solo
// cuenta si es el período actual; si hoy/esta semana no hubo ventas, devuelve 0
// (no el último día con ventas, que sería un número viejo mal etiquetado).
function totalPeriodoActual(serie, etiquetaActual) {
  const ultimo = (serie || []).at(-1)
  return ultimo && ultimo.periodo === etiquetaActual ? Number(ultimo.total) || 0 : 0
}

function VentasTotales() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    Promise.all([getVentasPeriodo('dia'), getVentasPeriodo('semana'), getResumen()])
      .then(([dia, semana, resumen]) => {
        setDatos({
          hoy: totalPeriodoActual(dia, fechaISO(new Date())),
          semana: totalPeriodoActual(semana, lunesEstaSemana()),
          mes: Number(resumen?.ventas_mes) || 0, // ya viene calculado del backend
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) {
    return (
      <div className="ventas-totales">
        <div className="ventas-totales__row">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="kpi">
              <Skeleton width="45%" height={11} />
              <Skeleton width="70%" height={30} radius="8px" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="api-error" role="alert">
        Error al cargar los totales de ventas: {error}
      </div>
    )
  }

  return (
    <div className="ventas-totales">
      <div className="ventas-totales__row">
        <KpiCard label="Vendido hoy" valor={cop.format(datos.hoy)} />
        <KpiCard label="Esta semana" valor={cop.format(datos.semana)} />
        <KpiCard label="Este mes" valor={cop.format(datos.mes)} />
      </div>
      <p className="ventas-totales__nota">No incluye pedidos cancelados</p>
    </div>
  )
}

export default VentasTotales
