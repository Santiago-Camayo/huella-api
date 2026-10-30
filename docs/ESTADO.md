# Estado de Huella API

Actualizado: 30 oct 2026. Fase actual: **fase 1 (Jira) en curso**; faltan 3 días para el Sprint 1.
Detalle de cada HU, regla y ruta en `docs/SRS.md`.

## Orden de trabajo
| Fase | Qué | Quién | Estado |
| --- | --- | --- | --- |
| 1 | Tablero de Jira (proyecto HUE) | Claude con el MCP de Atlassian | Hecho: 4 épicas, 25 HU, 12 tareas (HUE-1 a HUE-41) y 3 sprints cargados (2, 9 y 17 nov). Proyecto compartido con la docente (HUE-30 en Listo) |
| 2 | Migrar la API a PostgreSQL (plan corto y confirmación antes de codificar) | Claude | Pendiente de confirmación |
| 3 | Desplegar en Render y probar | Santiago con Claude | Pendiente |
| 4 | Proyecto Android del Sprint 1 | Santiago con Claude | Pendiente |

Por ahora solo se hacen las fases 1 y 2. Las cuentas de Supabase y Render las crea Santiago.

## Entregas
- Sprint 1: 2 nov, virtual (HU definidas, código cargado, evidencia en video o documento).
- Sprint 2: 9 nov, presencial (sustentación del código y demo en vivo).
- Final: 17 nov (100% de las HU, APK, manual de usuario y manual técnico).
- La API debe estar en la nube. Jira compartido con zulema.leon.e@uniautonoma.edu.co.

Este estado sale de leer el código. La colección de Postman no se ejecutó para escribirlo,
y Jira, Supabase, Render y la app Android no se revisaron desde este repositorio.

## Dónde está el código hoy
- Node + Express 5 con SQLite (`better-sqlite3`), síncrono. Corre solo en local.
- Tablas: `usuarios`, `animales`, `solicitudes`. No existe `fundaciones` ni `fundacion_id`.
- El token lleva solo `id` y `rol`.
- `foto` es un texto opcional y no hay subida de archivos. El seed tiene animales sin foto.

## Rutas (19 en el SRS)
| Estado | Rutas |
| --- | --- |
| Existen sin cambios de contrato (6) | `POST /auth/login`, `GET /animales`, `GET /animales/{id}`, `DELETE /animales/{id}`, `POST /solicitudes`, `GET /solicitudes/{id}` |
| Existen, falta ajustar (5) | `POST /auth/register`, `POST /animales`, `PUT /animales/{id}`, `GET /solicitudes`, `PATCH /solicitudes/{id}/estado` |
| Faltan (8) | `GET /health`, `POST /auth/registro-fundacion`, `GET /usuarios/me`, `PUT /usuarios/me/password`, `GET /usuarios`, `POST /usuarios`, `PATCH /usuarios/{id}`, `GET /dashboard/resumen` |

Además, varias de las que "existen" aún no filtran por fundación (RN-18), y `GET /animales`
no tiene el filtro `fundacionId` (HU-07).

## Sprint 1: lo que falta por HU
| HU | Falta en la API | Estado |
| --- | --- | --- |
| HU-01 Registro | Validar contraseña de mínimo 8 caracteres | Parcial |
| HU-02 Login | Agregar `fundacion_id`, `es_admin` y `debe_cambiar_password` al token y al usuario | Parcial |
| HU-03 Recordar sesión | Crear `GET /usuarios/me` | Falta |
| HU-04 Cerrar sesión | Nada, es local en Android | Solo app |
| HU-06 Lista de animales | Nada aparte de la migración | Ruta lista |
| HU-08 Detalle de animal | Devolver nombre y ciudad de la fundación | Parcial |

Ninguna está cerrada: la definición de hecho exige probarla en el APK contra la API desplegada.

## Orden de trabajo del Sprint 1
1. **Seguridad:** quitar la clave de respaldo de `JWT_SECRET` en `src/config/index.js`,
   agregar `.env` a `.gitignore` y crear una clave nueva para producción.
2. **Supabase:** crear el proyecto y obtener `DATABASE_URL` (lo hace Santiago).
3. **Esquema:** pasar `src/db/schema.js` a PostgreSQL con `fundaciones` (SRS sección 7) y
   rehacer el seed con dos fundaciones y animales con foto.
4. **Migración:** cambiar a `pg` y pasar los controladores a `async/await`, `$1, $2` y
   `CURRENT_DATE`. `cambiarEstado` debe usar una transacción con un solo cliente.
5. **Errores:** agregar un manejador que responda `{ "error": ... }` en JSON. Traducir el
   índice único violado (23505) a 409 y un id no numérico (22P02) a 400 o 404.
6. **Probar:** ejecutar la colección de Postman y corregir lo que falle antes de seguir.
7. **Rutas:** `GET /health`, `GET /usuarios/me`, validación de HU-01, campos nuevos del token
   y datos de la fundación en el detalle del animal.
8. **Despliegue:** publicar en Render con sus variables de entorno y apuntar Postman a esa URL.
9. **Fuera de este repositorio:** app Android de las HU del sprint, tablero de Jira compartido
   con la docente y video de evidencia.

## Sprints siguientes
- **Sprint 2 (9 nov):** HU-05, 07, 09, 10, 12, 16, 17, 21, 22. Registro de fundación, filtro
  por fundación, fotos con Supabase Storage y parámetro `orden`.
- **Sprint 3 (17 nov):** HU-11, 13, 14, 15, 18, 19, 20, 23, 24, 25. `finalizada` con RN-11,
  409 al editar un adoptado, dashboard, equipo, cambio de contraseña y manuales.

## Puntos a tener en cuenta
- **`multipart` (HU-17, HU-18):** los campos llegan como texto, así que `validarAnimal` rechazaría
  `edad` porque exige un entero. Hay que convertirla, igual que los `bueno_con_*`.
- **Finalizar (HU-23):** RN-12 no deja finalizar con el animal retirado; `cambiarEstado` solo
  revisa eso al aprobar.
- **`README.md`:** revisarlo cuando termine la migración.

## Decisiones pendientes
- **RN-15 y RN-18 se contradicen:** RN-15 dice que la fundación ve todas las solicitudes y RN-18
  que solo las de sus animales. Se propone seguir RN-18 y corregir RN-15 en el SRS; falta confirmar.
