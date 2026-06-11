// Único punto de contacto con el CRM (FastAPI). Ningún componente hace fetch
// directo: todos importan funciones de este archivo. Si el CRM corre en otra
// dirección, cambia BASE_URL aquí.
const BASE_URL = 'http://localhost:8000'

// Construye el mensaje de error a partir del formato uniforme del CRM.
function mensajeError(status, data) {
  const detail = data?.detail
  // 422: `detail` es una lista de errores por campo (Pydantic).
  if (Array.isArray(detail)) {
    const campos = detail
      .map((e) => `${(e.loc || []).slice(-1)[0] || 'campo'}: ${e.msg}`)
      .join('; ')
    return `Datos inválidos (${status}): ${campos}`
  }
  if (typeof detail === 'string') return detail
  return `Error ${status} al llamar al CRM`
}

// Helper interno: hace el fetch, maneja errores de forma uniforme y devuelve JSON.
async function request(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error(`No se pudo conectar con el CRM en ${BASE_URL}. ¿Está encendido?`)
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const err = new Error(mensajeError(res.status, data))
    err.status = res.status
    throw err
  }
  return data
}

/* ── CLIENTES ───────────────────────────────────────────── */

// ⚠ El CRM aún NO expone un listado de clientes (ver README). Falta crear `GET /clientes`.
export function getClientes() {
  return request('/clientes')
}

export function getCliente(telefono) {
  return request(`/clientes/${encodeURIComponent(telefono)}`)
}

export function crearLead(datos) {
  return request('/clientes', { method: 'POST', body: datos })
}

// ⚠ El CRM aún NO expone edición de cliente (ver README). Falta crear `PUT /clientes/{telefono}`.
// Se usa, p. ej., para cambiar estado_lead desde el kanban de Clientes.
export function actualizarCliente(telefono, datos) {
  return request(`/clientes/${encodeURIComponent(telefono)}`, { method: 'PUT', body: datos })
}

/* ── PEDIDOS ────────────────────────────────────────────── */

// Lista todos los pedidos. Filtro opcional por estado (?estado=confirmado).
export function getPedidos(estado) {
  const query = estado ? `?estado=${encodeURIComponent(estado)}` : ''
  return request(`/pedidos${query}`)
}

// Pedidos de un cliente. El endpoint no filtra por teléfono y los pedidos
// referencian cliente_id, no teléfono: resolvemos el cliente para tener su id
// y filtramos en el frontend.
export async function getPedidosCliente(telefono) {
  const cliente = await getCliente(telefono)
  const pedidos = await getPedidos()
  return (pedidos || []).filter((p) => p.cliente_id === cliente.id)
}

/* ── PRODUCTOS ──────────────────────────────────────────── */

export function getProductos() {
  return request('/productos')
}

export function crearProducto(datos) {
  return request('/productos', { method: 'POST', body: datos })
}

export function editarProducto(id, datos) {
  return request(`/productos/${id}`, { method: 'PUT', body: datos })
}

export function eliminarProducto(id) {
  return request(`/productos/${id}`, { method: 'DELETE' })
}

export function getDisponibilidad(id) {
  return request(`/productos/${id}/disponibilidad`)
}

// Junta cada producto con sus unidades producibles (la lista no las trae;
// vienen por endpoint aparte). Las pide en paralelo; si una falla, ese
// producto queda con unidades en null sin romper el resto.
export async function getProductosConDisponibilidad() {
  const productos = await getProductos()
  return Promise.all(
    (productos || []).map(async (p) => {
      try {
        const disp = await getDisponibilidad(p.id)
        return {
          ...p,
          unidades_disponibles: disp?.unidades_disponibles ?? null,
          disponible: disp?.disponible ?? null,
        }
      } catch {
        return { ...p, unidades_disponibles: null, disponible: null }
      }
    })
  )
}

/* ── MATERIAS PRIMAS ────────────────────────────────────── */

export function getMateriasPrimas() {
  return request('/materias-primas')
}

export function crearMateria(datos) {
  return request('/materias-primas', { method: 'POST', body: datos })
}

export function editarMateria(id, datos) {
  return request(`/materias-primas/${id}`, { method: 'PUT', body: datos })
}

export function eliminarMateria(id) {
  return request(`/materias-primas/${id}`, { method: 'DELETE' })
}

// Enviar { stock_actual } (fija el valor) O { cantidad } (suma/resta), no ambos.
export function ajustarStock(id, datos) {
  return request(`/materias-primas/${id}/stock`, { method: 'PATCH', body: datos })
}

/* ── RECETAS ────────────────────────────────────────────── */

export function getReceta(productoId) {
  return request(`/productos/${productoId}/receta`)
}

// Reemplaza toda la receta. `insumos` = [{ materia_prima_id, cantidad, unidad }].
export function editarReceta(productoId, insumos) {
  return request(`/productos/${productoId}/receta`, { method: 'PUT', body: { insumos } })
}

// Agrega un insumo: datos = { materia_prima_id, cantidad, unidad }.
export function agregarInsumo(productoId, datos) {
  return request(`/productos/${productoId}/receta/insumos`, { method: 'POST', body: datos })
}

// Quita una línea de la receta por su id de insumo (no el materia_prima_id).
export function quitarInsumo(insumoId) {
  return request(`/receta-insumos/${insumoId}`, { method: 'DELETE' })
}

// Junta cada producto con el nº de insumos de su receta (para la lista de Recetas).
// Todo producto tiene receta (vacia al crearlo) -> normalmente devuelve insumos [].
// El 404 queda como respaldo por si un producto legacy no tuviera receta (n_insumos 0).
export async function getProductosConInsumos() {
  const productos = await getProductos()
  return Promise.all(
    (productos || []).map(async (p) => {
      try {
        const receta = await getReceta(p.id)
        return { ...p, n_insumos: (receta?.insumos || []).length }
      } catch (e) {
        if (e.status === 404) return { ...p, n_insumos: 0 }
        return { ...p, n_insumos: null }
      }
    })
  )
}

/* ── OFERTAS ────────────────────────────────────────────── */

export function getOfertas() {
  return request('/ofertas')
}

export function getOfertasActivas() {
  return request('/ofertas/activas')
}

export function crearOferta(datos) {
  return request('/ofertas', { method: 'POST', body: datos })
}

export function editarOferta(id, datos) {
  return request(`/ofertas/${id}`, { method: 'PUT', body: datos })
}

export function eliminarOferta(id) {
  return request(`/ofertas/${id}`, { method: 'DELETE' })
}

export function cambiarEstadoOferta(id, activa) {
  return request(`/ofertas/${id}/estado`, { method: 'PATCH', body: { activa } })
}

/* ── ESTADÍSTICAS (dashboard) ───────────────────────────── */

export function getResumen() {
  return request('/estadisticas/resumen')
}

// `periodo` opcional (ej. 'mes', 'semana') -> query param si se envía.
export function getVentasPeriodo(periodo) {
  const query = periodo ? `?periodo=${encodeURIComponent(periodo)}` : ''
  return request(`/estadisticas/ventas-periodo${query}`)
}

export function getLeadsEstado() {
  return request('/estadisticas/leads-estado')
}

export function getTopProductos() {
  return request('/estadisticas/top-productos')
}
