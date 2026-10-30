# Huella API

API REST de Huella, app Android de adopción de mascotas para fundaciones.
Proyecto individual de la asignatura Aplicaciones Móviles (docente Zulema León, 2026-2).
El código se sustenta en cada entrega, así que debe ser simple y fácil de explicar.

## Fuente de verdad
- `docs/SRS.md` manda sobre todo lo demás: historias de usuario (HU), rutas, reglas de
  negocio (RN), modelo de datos y plan de sprints. Léelo antes de cambiar nada.
- `docs/entregables.html`: fechas y requisitos de la asignatura.
  Sprint 1: 2 nov (virtual) · Sprint 2: 9 nov (presencial) · Final: 17 nov (APK, manual
  de usuario y manual técnico). La API debe estar desplegada en la nube, no local.
- `docs/ESTADO.md`: estado actual y orden de trabajo. Actualízalo al terminar cada fase.
- `docs/Huella_modelo_de_datos.*` está desactualizado (SQLite, una sola fundación).
  Usa la sección 7 del SRS.

## Qué es la app
- Adoptantes: se registran, exploran animales, envían solicitudes de adopción y las siguen.
- Fundaciones: varias pueden usar la app. Cada una ve y gestiona solo sus animales y
  solicitudes. Un administrador registra la fundación y crea las cuentas de sus empleados
  (contraseña temporal que deben cambiar en su primer ingreso).
- Todo animal se publica con una foto obligatoria.
- No se pide verificación de correo en ningún registro.

## Stack
Node.js, Express 5, bcryptjs, jsonwebtoken. Migración de SQLite (better-sqlite3) a
PostgreSQL en Supabase con la librería `pg` y SQL directo, sin ORM. Fotos en Supabase
Storage (la API las sube; la base guarda solo la URL). Despliegue en Render.
La app Android (Kotlin + Jetpack Compose, otro repositorio) solo habla con esta API
por HTTP; nunca con Supabase directamente.

## Estructura
src/server.js (arranque) · src/app.js (Express y rutas) · src/config ·
src/db (conexión, schema, seed) · src/middlewares (sesión y rol) · src/validators ·
src/routes (URL → controlador) · src/controllers (lógica).
Respeta esta separación en capas.

## Convenciones
- JSON en snake_case. Errores: `{ "error": "mensaje" }`.
- Códigos: 400 dato inválido, 401 sin sesión, 403 sin permiso, 404 no existe,
  409 choca con una regla de negocio.
- El usuario sale siempre del token, nunca del cuerpo. El token lleva id, rol,
  fundacion_id y es_admin.
- Consultas con parámetros (`$1, $2`), nunca texto pegado.
- Secretos (DATABASE_URL, JWT_SECRET, claves de Supabase) solo en variables de entorno.
  El archivo `.env` va fuera de git. Nada de claves escritas en el código.
- Código simple y comentado, sin exceso de comentarios. No agregar librerías si unas
  pocas líneas lo resuelven.

## Cómo trabajar
- Primero propón un plan corto y espera confirmación; luego avanza por pasos.
- Después de cada cambio di qué archivos tocaste y cómo probarlo en Postman.
- La colección de Postman del repo debe seguir funcionando; actualízala cuando cambie
  una ruta. Cada ruta tiene al menos una prueba, con su caso de error.
- Commits pequeños con mensaje claro que mencione la HU (por ejemplo
  "HU-03: GET /usuarios/me"). El repositorio remoto es
  https://github.com/Santiago-Camayo/huella-api; recuérdame hacer push al terminar
  cada paso.
- Si algo del SRS choca con el código, el SRS manda; avísame antes de apartarte de él.
- Jira: el tablero del proyecto es el registro oficial de las HU. Al terminar una HU
  recuérdame moverla a Hecho con su evidencia.
