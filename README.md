# Huella API

API REST (Node.js + Express 5 + PostgreSQL) de la app de adopción de mascotas para fundaciones.
Los requisitos, rutas y reglas de negocio están en `docs/SRS.md`.

## Variables de entorno
| Variable | Qué es |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión de PostgreSQL (Supabase) |
| `JWT_SECRET` | Clave para firmar los tokens. Larga y aleatoria; nunca se sube a git |
| `PORT` | Opcional. Render la define sola; en local es 3000 |

La API no arranca si falta `DATABASE_URL` o `JWT_SECRET`.

Para generar un `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Cómo correrla en local
1. `npm install`
2. Crea un archivo `.env` en la raíz (está en `.gitignore`):
   ```
   DATABASE_URL=postgresql://usuario:clave@host:5432/postgres
   JWT_SECRET=una-clave-larga-y-aleatoria
   ```
3. `npm start` (queda en http://localhost:3000). Requiere Node 20.12 o superior.

Al arrancar crea las tablas si no existen y, si no hay ningún usuario, carga datos de ejemplo
(2 fundaciones, 3 usuarios y 6 animales con foto de ejemplo).
Para reiniciar los datos, vacía el esquema `public` de la base y vuelve a arrancar.

## Base de datos en Supabase
1. Crea un proyecto en Supabase y guarda la contraseña de la base.
2. En **Connect** copia la cadena del **Session pooler** (puerto 5432). La conexión directa
   solo funciona por IPv6 y Render no la alcanza.
3. Úsala como `DATABASE_URL`, reemplazando `[YOUR-PASSWORD]` por la contraseña.

## Desplegar en Render
1. Sube el repositorio a GitHub.
2. En Render: **New > Web Service**, conecta el repositorio `huella-api`.
3. Configura:
   - Runtime: **Node**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/health`
4. En **Environment** agrega `DATABASE_URL` y `JWT_SECRET` (una clave nueva, distinta de la de local).
5. Cuando termine el despliegue, abre `https://<tu-servicio>.onrender.com/health`: debe responder `{"ok":true}`.
6. En Postman cambia la variable `baseUrl` de la colección a esa URL.

En la capa gratuita de Render el servicio se duerme tras un rato sin uso y la primera petición tarda.
Conviene abrir `/health` antes de cada demo.

## Usuarios de prueba (datos de ejemplo)
- Adoptante: santiago@correo.com / santiago123
- Fundación 1 (administrador): fundacion@huella.org / fundacion123
- Fundación 2 (administrador): fundacion2@huella.org / fundacion123

## Pruebas en Postman
Importa `Huella - API.postman_collection.json` y ejecútala completa y en orden con la base recién
sembrada. Cada ruta tiene al menos una prueba, con su caso de error. La variable `baseUrl`
apunta a local por defecto.

## Estructura
- `src/server.js`: prepara la base y arranca el servidor
- `src/app.js`: configura Express y monta las rutas
- `src/config/`: variables de entorno
- `src/db/`: conexión (`index.js`), esquema (`schema.js`) y datos de ejemplo (`seed.js`)
- `src/routes/`: qué URL llama a qué controlador
- `src/controllers/`: la lógica de cada endpoint
- `src/middlewares/`: sesión (token), permisos por rol y manejo de errores
- `src/validators/`: validación de datos
