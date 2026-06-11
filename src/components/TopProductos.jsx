import { useEffect, useState } from 'react'
import { getTopProductos } from '../api/crm'
import Panel from './Panel'
import Skeleton from './Skeleton'
import './TopProductos.css'

function TopProductos() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getTopProductos()
      .then((rows) =>
        setData(
          (rows || []).map((d) => ({ nombre: d.nombre, cantidad: Number(d.cantidad_vendida) || 0 }))
        )
      )
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  const vacio = !cargando && !error && (!data || data.length === 0)
  // El más vendido marca el 100%; el resto, proporcional.
  const max = data && data.length ? Math.max(...data.map((d) => d.cantidad), 1) : 1

  return (
    <Panel title="Productos más vendidos">
      {cargando && (
        <ol className="top">
          {Array.from({ length: 5 }).map((_, i) => (
            <li className="top__row" key={i}>
              <Skeleton width={20} height={22} radius="6px" />
              <div className="top__body">
                <Skeleton width="50%" height={14} style={{ marginBottom: 8 }} />
                <Skeleton height={8} radius="999px" />
              </div>
            </li>
          ))}
        </ol>
      )}
      {error && (
        <div className="api-error" role="alert">
          Error: {error}
        </div>
      )}
      {vacio && <p className="empty">Aún no hay ventas registradas.</p>}

      {!cargando && !error && data && data.length > 0 && (
        <ol className="top">
          {data.map((d, i) => (
            <li className="top__row" key={d.nombre ?? i}>
              <span className="top__rank">{i + 1}</span>
              <div className="top__body">
                <div className="top__head">
                  <span className="top__name">{d.nombre}</span>
                  <span className="top__units">{d.cantidad.toLocaleString('es-CO')} u.</span>
                </div>
                <div className="top__bar" role="presentation">
                  <span className="top__fill" style={{ width: `${(d.cantidad / max) * 100}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  )
}

export default TopProductos
