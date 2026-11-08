# Estado de Huella

Actualizado: 8 nov 2026. Fase actual: **Sprint 2 terminado en código**, falta probarlo en el teléfono
antes de la sustentación del 9 nov. Detalle de cada HU, regla y ruta en `docs/SRS.md`.

## Repositorios y servicios
- API: este repositorio (`huella-api`), desplegada en https://huella-api-u3fo.onrender.com
- App Android (Kotlin + Jetpack Compose, diseño de Figma "Huella app diseño completo"):
  https://github.com/Santiago-Camayo/huella-app
- Base de datos PostgreSQL y fotos (bucket público `animales`) en Supabase.
- Jira: proyecto HUE, compartido con zulema.leon.e@uniautonoma.edu.co.

## Entregas
- Sprint 1: 2 nov, virtual. **Entregado** (enlaces en `docs/entrega-sprint1.txt`).
- Sprint 2: 9 nov, presencial (sustentación del código y demo en vivo).
- Final: 17 nov (100% de las HU, APK, manual de usuario y manual técnico).

## Dónde está el código hoy
- Node + Express 5 con PostgreSQL por `pg`, SQL directo y `async/await`. Variables obligatorias:
  `DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` (sin claves en el código).
- El token lleva `id`, `rol`, `fundacion_id` y `es_admin`. Errores siempre como `{ "error": ... }`.
- **RN-18 aplicada:** cada fundación ve y modifica solo sus animales y las solicitudes de sus animales (403 si no).
- Fotos: `POST /animales` recibe `multipart/form-data` con la foto obligatoria (JPG, PNG o WEBP, máx. 5 MB);
  la API la sube a Supabase Storage con `fetch` y guarda la URL. Única librería nueva: `multer`.
- Postman: 80 peticiones y 124 validaciones, todas pasan contra una base local recién sembrada
  (las pruebas de foto suben una imagen real al bucket). Archivos de prueba en `postman/`.

## Rutas (19 en el SRS)
| Estado | Rutas |
| --- | --- |
| Listas (14) | `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/registro-fundacion`, `GET /usuarios/me`, `GET /animales` (filtros y `fundacionId`), `GET /animales/{id}`, `POST /animales` (multipart), `PUT /animales/{id}`, `DELETE /animales/{id}`, `POST /solicitudes`, `GET /solicitudes` (`orden`), `GET /solicitudes/{id}`, `PATCH /solicitudes/{id}/estado` |
| Falta ajustar (Sprint 3) | `PATCH /solicitudes/{id}/estado` con `finalizada` (RN-11, RN-12), `PUT /animales/{id}` con 409 si está adoptado (RN-14) |
| Faltan (Sprint 3) | `PUT /usuarios/me/password`, `GET /usuarios`, `POST /usuarios`, `PATCH /usuarios/{id}`, `GET /dashboard/resumen` |

## HU por sprint
| Sprint | HU | Estado |
| --- | --- | --- |
| 1 | HU-01, 02, 03, 04, 06, 08 | Hechas en la app. En Jira: 02, 06 y 08 en Listo; 01, 03 y 04 En curso hasta probar en el teléfono los detalles que se agregaron el 7 nov (confirmar contraseña, sesión expirada y Reintentar, confirmación al cerrar sesión) |
| 2 | HU-05, 07, 09, 10, 12, 16, 17, 21, 22 | Hechas en API y app (compila). **Sin probar en el teléfono.** En Jira siguen Por hacer |
| 3 | HU-11, 13, 14, 15, 18, 19, 20, 23, 24, 25 | Pendientes |

La definición de hecho exige probar cada HU en el APK contra la API desplegada antes de moverla a Listo.

## Siguiente
1. Probar en el teléfono todo el Sprint 2 (guion de prueba en la conversación) y corregir lo que falle.
2. Mover las HU probadas a Listo en Jira con su evidencia.
3. Sprint 3: finalizar adopción, editar y retirar animal en la app, dashboard, equipo y cambio de
   contraseña, favoritos, perfil, APK y manuales.

## Puntos a tener en cuenta
- **Fotos de ejemplo:** los 6 animales del seed tienen fotos de ejemplo (picsum) que la app no muestra:
  se ven con su emoji, como en el diseño. Los animales registrados desde la app sí muestran su foto.
- **Búsqueda (HU-07):** la app filtra la lista ya cargada; la API también acepta los filtros por parámetro.
- **Finalizar (HU-23):** RN-12 no deja finalizar con el animal retirado; `cambiarEstado` solo revisa eso al aprobar.
- **Reiniciar la colección de Postman:** correrla otra vez pide la base recién sembrada.
- **Render gratis se duerme:** abrir `/health` antes de cada demo.

## Decisiones tomadas
- **RN-15 vs RN-18:** se sigue RN-18 (la fundación ve solo las solicitudes de sus animales) y se corrigió RN-15 en el SRS.
