import { useCallback, useEffect, useState } from 'react'
import { getProductosConInsumos, getMateriasPrimas } from '../api/crm'
import Card from '../components/Card'
import Button from '../components/Button'
import Skeleton from '../components/Skeleton'
import RecetaProductoList from '../components/RecetaProductoList'
import RecetaEditor from '../components/RecetaEditor'
import './Recetas.css'

function Recetas() {
  const [productos, setProductos] = useState(null)
  const [materias, setMaterias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [seleccionadoId, setSeleccionadoId] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [prods, mats] = await Promise.all([getProductosConInsumos(), getMateriasPrimas()])
      setProductos(prods)
      setMaterias(mats || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Tras un cambio en el editor, refresca solo los contadores de la lista.
  const refrescarLista = useCallback(async () => {
    try {
      setProductos(await getProductosConInsumos())
    } catch {
      /* el editor ya muestra sus propios errores */
    }
  }, [])

  // Se deriva de la lista para mantener el nombre/precio frescos tras refrescar.
  const seleccionado = (productos || []).find((p) => p.id === seleccionadoId) || null

  return (
    <div className="recetas">
      <header className="page-head">
        <h1>Recetas</h1>
      </header>

      {cargando ? (
        <div className="recetas__cols">
          <Card>
            <div className="recetas__lista-skel">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={44} radius="10px" />
              ))}
            </div>
          </Card>
          <Card>
            <div className="recetas__editor-skel">
              <Skeleton height={42} radius="10px" />
              <Skeleton height={160} radius="10px" />
            </div>
          </Card>
        </div>
      ) : error ? (
        <div className="api-error" role="alert">
          <p>Error al cargar: {error}</p>
          <Button variant="ghost" onClick={cargar}>
            Reintentar
          </Button>
        </div>
      ) : productos.length === 0 ? (
        <p className="empty">No hay productos. Crea productos primero para definir sus recetas.</p>
      ) : (
        <div className="recetas__cols">
          <Card className="recetas__lista">
            <RecetaProductoList
              productos={productos}
              seleccionadoId={seleccionadoId}
              onSelect={(p) => setSeleccionadoId(p.id)}
            />
          </Card>

          <Card>
            {seleccionado ? (
              <RecetaEditor producto={seleccionado} materias={materias} onChanged={refrescarLista} />
            ) : (
              <p className="empty">Selecciona un producto para ver y editar su receta.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default Recetas
