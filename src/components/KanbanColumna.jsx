import LeadCard from './LeadCard'
import './KanbanColumna.css'

const ESTADO_LABEL = { nuevo: 'Nuevo', interesado: 'Interesado', cliente: 'Cliente' }

// Una columna del pipeline. Header con color suave por estado + conteo, y la
// lista de LeadCard con scroll propio si hay muchas tarjetas.
function KanbanColumna({ estado, leads = [], seleccionadoTelefono, onSelect, onCambiarEstado }) {
  return (
    <section className={`kanban-col kanban-col--${estado}`}>
      <header className="kanban-col__header">
        <span className="kanban-col__nombre">{ESTADO_LABEL[estado] ?? estado}</span>
        <span className="kanban-col__count">{leads.length}</span>
      </header>

      <div className="kanban-col__body">
        {leads.length === 0 ? (
          <p className="empty kanban-col__vacio">Sin leads en esta etapa.</p>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.telefono}
              lead={lead}
              seleccionado={lead.telefono === seleccionadoTelefono}
              onSelect={onSelect}
              onCambiarEstado={onCambiarEstado}
            />
          ))
        )}
      </div>
    </section>
  )
}

export default KanbanColumna
