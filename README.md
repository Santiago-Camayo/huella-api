# Huella API

API REST (Node.js + Express + SQLite) de la app de adopción de mascotas.

## Cómo correrla
1. `npm install`
2. `npm start`  (queda en http://localhost:3000)

La base `huella.db` se crea sola con datos de ejemplo la primera vez.
Para reiniciar los datos: detén el servidor, borra `huella.db` y vuelve a arrancar.

## Usuarios de prueba
- Adoptante: santiago@correo.com / santiago123
- Fundación: fundacion@huella.org / fundacion123

## Estructura
- `src/server.js`: arranca el servidor
- `src/app.js`: configura Express y monta las rutas
- `src/config/`: puerto y clave JWT
- `src/db/`: conexión, esquema (`schema.js`) y datos de ejemplo (`seed.js`)
- `src/routes/`: qué URL llama a qué controlador
- `src/controllers/`: la lógica de cada endpoint
- `src/middlewares/`: sesión (token) y permisos por rol
- `src/validators/`: validación de datos
