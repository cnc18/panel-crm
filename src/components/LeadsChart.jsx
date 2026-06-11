import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from 'recharts'
import { getLeadsEstado } from '../api/crm'
import Panel from './Panel'
import Skeleton from './Skeleton'

// Colores del sistema por estado (Recharts necesita valores, no var()).
const COLORS = {
  nuevo: '#a8895f', // --accent-soft
  interesado: '#9a5b2c', // --low
  cliente: '#3f6f4f', // --ok
}
const FALLBACK = ['#a8895f', '#9a5b2c', '#3f6f4f']
const LINE = '#e3dccd' // --line
const INK = '#1a1714' // --ink
const INK_SOFT = '#4a443d' // --ink-soft
const CARD = '#fffdf8' // --card

const tooltipBox = {
  background: CARD,
  border: `1px solid ${LINE}`,
  borderRadius: 10,
  boxShadow: '0 4px 12px rgba(26, 23, 20, 0.08)',
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const colorFor = (estado, i) => COLORS[String(estado).toLowerCase()] ?? FALLBACK[i % FALLBACK.length]

function LeadsChart() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getLeadsEstado()
      .then((rows) =>
        setData((rows || []).map((d) => ({ estado: d.estado, cantidad: Number(d.cantidad) || 0 })))
      )
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  const vacio = !cargando && !error && (!data || data.length === 0)
  const alto = data ? Math.max(140, data.length * 56) : 140

  return (
    <Panel title="Leads por estado">
      {cargando && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0' }}>
          {[60, 90, 45].map((w, i) => (
            <Skeleton key={i} width={`${w}%`} height={22} radius="6px" />
          ))}
        </div>
      )}
      {error && (
        <div className="api-error" role="alert">
          Error: {error}
        </div>
      )}
      {vacio && <p className="empty">Aún no hay leads registrados.</p>}

      {!cargando && !error && data && data.length > 0 && (
        <ResponsiveContainer width="100%" height={alto}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="estado"
              tickFormatter={cap}
              tick={{ fill: INK_SOFT, fontSize: 13 }}
              stroke={LINE}
              tickLine={false}
              width={96}
            />
            <Tooltip
              cursor={{ fill: 'rgba(26,23,20,0.04)' }}
              formatter={(v) => [v, 'Cantidad']}
              labelFormatter={cap}
              contentStyle={tooltipBox}
              labelStyle={{ color: INK_SOFT, fontWeight: 600 }}
              itemStyle={{ color: INK }}
            />
            <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={22}>
              {data.map((d, i) => (
                <Cell key={d.estado ?? i} fill={colorFor(d.estado, i)} />
              ))}
              <LabelList dataKey="cantidad" position="right" fill={INK_SOFT} fontSize={13} fontWeight={600} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Panel>
  )
}

export default LeadsChart
