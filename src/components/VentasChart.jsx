import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { getVentasPeriodo } from '../api/crm'
import Panel from './Panel'
import Skeleton from './Skeleton'

// Colores del sistema (Recharts necesita valores, no var() en atributos SVG).
const GOLD = '#b08d4f' // --gold
const LINE = '#e3dccd' // --line
const INK = '#1a1714' // --ink
const INK_SOFT = '#4a443d' // --ink-soft
const CARD = '#fffdf8' // --card

// Tooltip con la identidad Atelier.
const tooltipBox = {
  background: CARD,
  border: `1px solid ${LINE}`,
  borderRadius: 10,
  boxShadow: '0 4px 12px rgba(26, 23, 20, 0.08)',
}

// Eje Y abreviado como moneda: $2.4M, $850K, $0.
function ejeY(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function VentasChart() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getVentasPeriodo()
      .then((rows) =>
        setData((rows || []).map((d) => ({ etiqueta: d.etiqueta, total: Number(d.total) || 0 })))
      )
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  const vacio = !cargando && !error && (!data || data.length === 0)

  return (
    <Panel title="Ventas por periodo">
      {cargando && <Skeleton height={260} radius="var(--radius)" />}
      {error && (
        <div className="api-error" role="alert">
          Error: {error}
        </div>
      )}
      {vacio && <p className="empty">Aún no hay ventas registradas en este periodo.</p>}

      {!cargando && !error && data && data.length > 0 && (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="ventasFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.25} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={LINE} vertical={false} />
            <XAxis
              dataKey="etiqueta"
              tick={{ fill: INK_SOFT, fontSize: 12 }}
              stroke={LINE}
              tickLine={false}
            />
            <YAxis
              tickFormatter={ejeY}
              tick={{ fill: INK_SOFT, fontSize: 12 }}
              stroke={LINE}
              tickLine={false}
              width={56}
            />
            <Tooltip
              formatter={(v) => [cop.format(v), 'Ventas']}
              contentStyle={tooltipBox}
              labelStyle={{ color: INK_SOFT, fontWeight: 600 }}
              itemStyle={{ color: INK }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke={GOLD}
              strokeWidth={2}
              fill="url(#ventasFill)"
              dot={{ r: 3, fill: GOLD, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Panel>
  )
}

export default VentasChart
