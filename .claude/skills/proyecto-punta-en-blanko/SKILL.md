---
name: proyecto-punta-en-blanko
description: Contexto del proyecto Punta en Blanko (POS de escritorio). Cargar al empezar a trabajar en este repo para conocer stack, arquitectura, convenciones y puntos delicados antes de tocar código.
---

# Punta en Blanko — contexto del proyecto

App de punto de venta (POS) de escritorio para Windows, para uso sin internet. Empaquetada con Electron; front en React (Vite); backend Express propio embebido en el mismo ejecutable; base de datos SQLite manejada con `sql.js` (SQLite compilado a WASM, no `better-sqlite3` ni driver nativo).

## Stack y estructura

- **Frontend**: React 19 + Vite + React Router + Bootstrap 5 + react-toastify + chart.js. Código en `src/`.
  - `src/pages/`: una página por sección (Home, Productos, NuevaVenta, Presupuestos, Clientes, FacturacionDia, FacturacionMes, Backups), con subcarpetas `productos/`, `presupuesto/`, `clientes/` para alta/edición.
  - `src/config.js`: expone `API_URL` (viene de `VITE_API_URL` env var).
  - Rutas definidas en `src/App.jsx`.
- **Backend**: Express en `backend/`, corre embebido (no es un servicio aparte para el usuario final).
  - `backend/server.cjs`: monta las rutas y el manejador de errores central.
  - `backend/routes/`: `productos.cjs`, `ventas.cjs`, `presupuestos.cjs`, `clientes.cjs`, `backups.cjs`.
  - `backend/db.cjs`: wrapper sobre `sql.js` que imita la API de `better-sqlite3` (`prepare().all()/.get()/.run()`, `exec`, `transaction`). Cada escritura exportа y reescribe el archivo `.db` entero a disco (`save()` en cada `exec`, salvo dentro de una transacción).
  - `backend/config.cjs`: `PORT`, `DB_PATH`/`DB_FILE`/`CONFIG_FILE`. `DB_PATH` sale de `process.env.DB_PATH`, que fija `electron/main.cjs`.
  - `backend/utils/utils.cjs`: helpers compartidos de validación (`validarItems`, `validarTotal`, `capitalizarNombre`).
- **Electron**: `electron/main.cjs` (proceso principal) + `electron/preload.cjs` (bridge `window.electronAPI` con `contextIsolation: true`).
  - En dev: `DB_PATH` = `backend/` del repo, front sirve desde `http://localhost:5173`.
  - Empaquetado (`app.isPackaged`): `DB_PATH` = `app.getPath("userData")`, backend se copia a `resourcesPath/backend`, front se carga desde `dist/index.html`.
  - Backup de carpeta default: `~/Documents/PuntaEnBlanko/Backups` (vía IPC `obtener-ruta-default-backups`).

## Scripts (`package.json` raíz)

- `npm run dev` — corre backend (`node backend/server.cjs`) y frontend (`vite`) juntos, para desarrollo web puro.
- `npm run dev:electron` — levanta Vite y Electron juntos (dev real de la app de escritorio).
- `npm run build` / `npm run dist` — build de producción y empaquetado con `electron-builder` (target NSIS para Windows).

## Convenciones del backend

- **Errores**: forma de respuesta unificada `{ error, message }` con el mismo texto en ambas claves (ver manejador central en `server.cjs`). El front a veces lee `error`, a veces `message` — no asumir cuál sin mirar el caller.
- **Validación**: server-side, centralizada en `backend/utils/utils.cjs` (`validarItems`, `validarTotal`) y funciones locales por ruta (ej. `validarCliente` en `clientes.cjs`). Devuelven `string` de error o `null`; el handler responde 400 con `{ message: err }`.
- **Stock**: ventas y conversión de presupuesto a venta chequean stock contra la base en el momento de confirmar (no confían en lo que mandó el front), porque el stock pudo cambiar entre que se armó el presupuesto/carrito y se confirmó.
- **Migraciones de esquema**: `db.cjs` tiene `migrate()` con array `migrations` versionado por `PRAGMA user_version`. Para cambios de esquema futuros: sumar función al final del array, nunca reordenar ni borrar las anteriores.
- **DB como archivo único**: no hay servidor de base de datos: es un archivo `.db` que se reescribe entero en cada escritura (vía `sql.js`). Esto importa para el sistano de backups (copian ese archivo) y para el rendimiento en operaciones muy grandes (evitar loops de escrituras individuales sin transacción).

## Backups

- `backend/routes/backups.cjs` + `backend/backup-config.json` (destino, automático sí/no, `maxBackups`).
- El front dispara un backup automático al montar `App.jsx` (`POST /backups/auto`), sujeto a la config guardada.
- La sección `/backups` (`src/pages/Backups.jsx`) permite elegir carpeta (vía diálogo nativo de Electron), activar/desactivar automático, limitar cantidad de copias conservadas y disparar backup manual.

## Puntos delicados / a tener en cuenta

- `backend/punta_en_blanko.db` (base real) y `backend/backup-config.json` quedan versionados en el repo — pisar con cuidado, no son fixtures descartables.
- No usar `better-sqlite3` ni asumir API nativa: todo pasa por el wrapper de `db.cjs` sobre `sql.js`.
- Cambios de esquema van por `migrate()`, no por editar los `CREATE TABLE IF NOT EXISTS` existentes de forma que rompan bases ya creadas en máquinas de usuarios.
- `notas.txt` en la raíz es un archivo de trabajo personal del usuario, está en `.gitignore` — no commitear ni recrear.
