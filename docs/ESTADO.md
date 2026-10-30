# Estado de Huella API

Actualizado: 30 oct 2026. Fase actual: **fase 2 terminada en código**, falta probarla contra Supabase
y desplegar (fase 3). Faltan 3 días para el Sprint 1. Detalle de cada HU, regla y ruta en `docs/SRS.md`.

## Orden de trabajo
| Fase | Qué | Quién | Estado |
| --- | --- | --- | --- |
| 1 | Tablero de Jira (proyecto HUE) | Claude con el MCP de Atlassian | Hecho: 4 épicas, 25 HU, 12 tareas (HUE-1 a HUE-41) y 3 sprints (2, 9 y 17 nov). Compartido con la docente (HUE-30 en Listo) |
| 2 | Migrar la API a PostgreSQL | Claude | Hecho en código y probado contra un PostgreSQL local. No probado todavía contra Supabase |
| 3 | Desplegar en Render y probar | Santiago con Claude | Pendiente: falta el proyecto de Supabase y el servicio de Render |
| 4 | Proyecto Android del Sprint 1 | Santiago con Claude | Pendiente |

Las cuentas de Supabase y Render las crea Santiago. Pasos en `README.md`.

## Entregas
- Sprint 1: 2 nov, virtual (HU definidas, código cargado, evidencia en video o documento).
- Sprint 2: 9 nov, presencial (sustentación del código y demo en vivo).
- Final: 17 nov (100% de las HU, APK, manual de usuario y manual técnico).
- La API debe estar en la nube. Jira compartido con zulema.leon.e@uniautonoma.edu.co.

## Dónde está el código hoy
- Node + Express 5 con PostgreSQL por `pg`, SQL directo y `async/await`. Variables `DATABASE_URL` y
  `JWT_SECRET` obligatorias; sin clave escrita en el código.
- Tablas del SRS sección 7: `fundaciones`, `usuarios`, `animales`, `solicitudes`, con los dos índices únicos
  parciales. El esquema se crea al arrancar; el seed (2 fundaciones, 3 usuarios, 6 animales con foto de
  ejemplo) solo si no hay usuarios.
- El token lleva `id`, `rol`, `fundacion_id` y `es_admin`. Los errores salen siempre como `{ "error": ... }`.
- `fecha` y `fecha_registro` ahora son `TIMESTAMPTZ` (llegan como texto ISO, no `AAAA-MM-DD`): la app
  Android debe leerlas así. `activo` y `bueno_con_*` llegan como booleanos.
- Colección de Postman rehecha: 62 peticiones, 92 validaciones, todas pasan contra el PostgreSQL local.
  La anterior solo tenía nombres, sin URLs ni pruebas.

## Rutas (19 en el SRS)
| Estado | Rutas |
| --- | --- |
| Listas (9) | `GET /health`, `POST /auth/register`, `POST /auth/login`, `GET /usuarios/me`, `GET /animales`, `GET /animales/{id}`, `DELETE /animales/{id}`, `POST /solicitudes`, `GET /solicitudes/{id}` |
| Existen, falta ajustar (4) | `POST /animales` (foto por `multipart`), `PUT /animales/{id}` (`multipart` y 409 si está adoptado), `GET /solicitudes` (parámetro `orden`), `PATCH /solicitudes/{id}/estado` (`finalizada`) |
| Faltan (6) | `POST /auth/registro-fundacion`, `PUT /usuarios/me/password`, `GET /usuarios`, `POST /usuarios`, `PATCH /usuarios/{id}`, `GET /dashboard/resumen` |

## Sprint 1 por HU (API)
| HU | Estado en la API |
| --- | --- |
| HU-01 Registro | Listo, con contraseña de mínimo 8 |
| HU-02 Login | Listo, con `fundacion_id`, `es_admin` y `debe_cambiar_password` |
| HU-03 Recordar sesión | Listo (`GET /usuarios/me`) |
| HU-04 Cerrar sesión | Solo app |
| HU-06 Lista de animales | Listo |
| HU-08 Detalle de animal | Listo, con nombre y ciudad de la fundación |

Ninguna está cerrada: la definición de hecho exige probarla en el APK contra la API desplegada.

## Siguiente (fase 3)
1. Santiago crea el proyecto de Supabase y pasa `DATABASE_URL` (Session pooler) en un `.env` local.
2. Arrancar la API contra Supabase y correr la colección de Postman.
3. Santiago crea el servicio en Render (pasos en `README.md`) con una `JWT_SECRET` nueva.
4. Correr la colección contra la URL de Render y guardar evidencias en `docs/evidencias`.
5. Fuera de este repositorio: app Android del Sprint 1 y video de evidencia.

## Sprints siguientes
- **Sprint 2 (9 nov):** HU-05, 07, 09, 10, 12, 16, 17, 21, 22. Registro de fundación, filtro
  por fundación, fotos con Supabase Storage y parámetro `orden`.
- **Sprint 3 (17 nov):** HU-11, 13, 14, 15, 18, 19, 20, 23, 24, 25. `finalizada` con RN-11,
  409 al editar un adoptado, dashboard, equipo, cambio de contraseña y manuales.

## Puntos a tener en cuenta
- **Falta aislar por fundación (RN-18, HUE-36, Sprint 2):** hoy cualquier cuenta de fundación puede editar o
  retirar animales de otra fundación y cambiar el estado de solicitudes de otra, y `GET /solicitudes` le
  muestra todas. Es aceptable en Sprint 1 con una sola fundación activa, pero hay que cerrarlo antes de
  abrir el registro de fundaciones (HU-05).
- **Foto (HU-17):** por ahora `POST /animales` exige `foto` como URL en el JSON. La subida por `multipart`
  a Supabase Storage es del Sprint 2; ahí `validarAnimal` rechazaría `edad` porque llegaría como texto.
- **Finalizar (HU-23):** RN-12 no deja finalizar con el animal retirado; `cambiarEstado` solo
  revisa eso al aprobar.
- **Reiniciar la colección de Postman:** correrla otra vez pide la base recién sembrada.

## Decisiones pendientes
- **RN-15 y RN-18 se contradicen:** RN-15 dice que la fundación ve todas las solicitudes y RN-18
  que solo las de sus animales. Se propone seguir RN-18 y corregir RN-15 en el SRS; falta confirmar.
