# panel-crm

Panel de administración web para un CRM de perfumería, construido en **React + Vite**. Es el frontend que consume la API de **crm-core** (https://github.com/cnc18/crm-core): gestiona clientes, conversaciones, pedidos e inventario.

## Características

Tablero de pedidos tipo Kanban, tabla de clientes con edición en línea, modales de detalle y cálculo de ventas totales. Todo el contacto con el backend pasa por una única capa de API con manejo de errores uniforme.

## Stack

React · Vite · JavaScript · CSS

## Estructura

**src/api/** — única capa de contacto con la API del CRM (FastAPI)

**src/components/** — componentes reutilizables: tablas, modales, Kanban

**src/pages/** — vistas de la aplicación

## Puesta en marcha

Requiere Node.js. Instalar dependencias con npm install y levantar el entorno de desarrollo con npm run dev. La URL del backend se configura en src/api/crm.js (por defecto http://localhost:8000).
