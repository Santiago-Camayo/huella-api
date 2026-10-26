# Huella: contexto, historias de usuario y rutas de la API

Oct 26, 2026 · @santiago

## Qué es Huella

Huella es una app Android para una fundación de adopción de mascotas, apoyada en una API REST propia (Android → API → base de datos SQLite). Es el proyecto individual de Dispositivos Móviles (docente Zulema León, 2026-2).

**Dos roles, un mismo login.** La API devuelve el rol y la app decide a qué módulo entrar.

- **Adoptante:** explora animales, envía solicitudes de adopción y sigue su estado. El registro público solo crea adoptantes.
- **Fundación:** gestiona los animales (crear, editar, retirar) y decide sobre las solicitudes.

**Tecnología de la API:** Node.js, Express 5, better-sqlite3, bcryptjs (contraseñas cifradas) y jsonwebtoken (token Bearer de 7 días con el rol dentro). Repositorio: https://github.com/Santiago-Camayo/huella-api. Desde el emulador de Android se accede en `http://10.0.2.2:3000`.

**Convenciones de la API:** el usuario y su rol salen siempre del token, nunca del cuerpo de la petición. Los errores se devuelven como `{"error": "mensaje"}`. Códigos usados: 200, 201, 204, 400, 401, 403, 404 y 409.

**Estados del animal:** disponible, apartado, adoptado (más `activo`, que oculta el animal sin borrarlo).

**Estados de la solicitud:** pendiente, en\_revision, aprobada, rechazada, cancelada y finalizada. Una solicitud *activa* es pendiente, en\_revision o aprobada.

**Reglas de negocio:**

1. Un adoptante no puede tener dos solicitudes activas sobre el mismo animal (409).
2. Solo se puede solicitar un animal disponible y activo (409).
3. Solo puede haber una solicitud aprobada por animal (409).
4. Aprobar deja al animal *apartado*. Rechazar o cancelar una aprobada lo devuelve a *disponible*.
5. Retirar un animal solo pone `activo = 0` y conserva el historial de solicitudes.
6. El comentario de la solicitud es obligatorio y mide entre 10 y 500 caracteres.
7. Favoritos son locales en la app Android (no hay tabla ni ruta en la API).

## Historias del adoptante

De las 12 pantallas del adoptante, 8 tienen su ruta lista en la API, 2 dependen de `GET /usuarios/me` (que falta) y 2 no necesitan API. Estado: **Listo** = ruta implementada y probada en Postman; **Falta** = ruta no creada; **Sin API** = se resuelve en la app.

| Pantalla | Historia de usuario | Ruta de la API | Estado | Nota |
| --- | --- | --- | --- | --- |
| A01 Splash | Como adoptante, si ya inicié sesión, quiero entrar directo a mi módulo | `GET /usuarios/me` | Falta | Hoy se podría usar el rol guardado del login, pero la ruta no existe |
| A02 Login | Quiero iniciar sesión con mi correo y contraseña | `POST /auth/login` | Listo | 400 faltan datos, 401 credenciales, 403 cuenta desactivada |
| A03 Registro | Quiero crear mi cuenta y entrar de inmediato | `POST /auth/register` | Listo | Siempre crea rol adoptante; 409 correo repetido; devuelve token |
| A04 Inicio | Quiero ver los animales disponibles | `GET /animales?estado=disponible` | Listo | No hay parámetro de límite; la app puede mostrar los primeros |
| A05 Explorar | Quiero buscar y filtrar por nombre, especie, sexo y raza | `GET /animales?nombre&especie&sexo&raza&estado` | Listo | Filtro por edad no existe (decisión pendiente) |
| A06 Detalle del animal | Quiero ver toda la información de un animal | `GET /animales/{id}` | Listo | Devuelve también retirados (`activo = 0`) para mostrar "Publicación no disponible"; 404 si no existe |
| A07 Solicitud | Quiero pedir adoptar un animal con un comentario | `POST /solicitudes` | Listo | Cuerpo: `animal_id` y `comentario`; 201; 400, 404 y 409 (no disponible o duplicada) |
| A08 Confirmación | Quiero ver que mi solicitud fue enviada | Ninguna | Sin API | Usa la respuesta del paso anterior |
| A09 Favoritos | Quiero guardar animales que me gustan | Ninguna | Sin API | Locales en Android, se limpian al cerrar sesión |
| A10 Mis solicitudes | Quiero ver mis solicitudes y filtrar por estado | `GET /solicitudes?estado=` | Listo | El adoptante solo recibe las suyas, más recientes primero |
| A11 Detalle de solicitud | Quiero ver el estado de mi solicitud y poder cancelarla | `GET /solicitudes/{id}` y `PATCH /solicitudes/{id}/estado` con `{"estado": "cancelada"}` | Listo | 403 si no es suya; cancelar vale desde pendiente, en\_revision o aprobada; 409 en otros casos |
| A12 Perfil | Quiero ver mis datos y cerrar sesión | `GET /usuarios/me` | Falta | Los datos ya llegan en `usuario` al hacer login o registro; cerrar sesión es local |

## Historias de la fundación

De las 7 pantallas de la fundación, 4 están completas, 2 están casi listas (les falta una regla puntual) y 1 no existe. Además, las dos pantallas de cuenta y equipo definidas después no tienen ninguna ruta.

| Pantalla | Historia de usuario | Ruta de la API | Estado | Nota |
| --- | --- | --- | --- | --- |
| F01 Dashboard | Como fundación, quiero ver un resumen de animales y solicitudes | `GET /dashboard/resumen` | Falta | Debe dar disponibles, pendientes, en revisión, adopciones completadas y últimas 5 solicitudes |
| F02 Animales | Quiero listar los animales y filtrar por estado y nombre | `GET /animales?estado&nombre` | Listo | Solo muestra activos; la fundación no ve los retirados en esta lista |
| F03 Registrar animal | Quiero publicar un animal nuevo | `POST /animales` | Listo | Valida nombre, especie, sexo y edad 0–30; el estado inicial es disponible; solo fundación |
| F04 Editar animal | Quiero corregir los datos de un animal | `GET /animales/{id}` y `PUT /animales/{id}` | Casi | Falta rechazar con 409 la edición de un animal adoptado; el estado no se cambia por aquí |
| F05 Detalle del animal | Quiero ver un animal con sus solicitudes y poder retirarlo | `GET /animales/{id}`, `GET /solicitudes?animalId=` y `DELETE /animales/{id}` | Listo | DELETE pone `activo = 0` y responde 204; siempre se permite; conserva las solicitudes |
| F06 Solicitudes | Quiero ver todas las solicitudes y filtrarlas por estado | `GET /solicitudes?estado&animalId` | Listo | La API ordena de más nueva a más antigua; la app puede reordenar |
| F07 Detalle de solicitud | Quiero pasar a revisión, aprobar, rechazar o finalizar una solicitud | `GET /solicitudes/{id}` y `PATCH /solicitudes/{id}/estado` | Casi | Funcionan pendiente→en\_revision, en\_revision→aprobada y rechazar; falta aprobada→finalizada |
| Registro de fundación | Quiero crear la primera cuenta del personal | `POST /auth/registro-fundacion` | Falta | 409 si ya existe una fundación |
| Cuenta | Quiero ver los datos de mi cuenta | `GET /usuarios/me` | Falta | Es la misma ruta que usan A01 y A12 |
| Equipo | Quiero ver, agregar y activar o desactivar al personal | `GET /usuarios?rol=fundacion`, `POST /usuarios`, `PATCH /usuarios/{id}` | Falta | Correo repetido → 409; no se puede desactivar la propia cuenta. El login ya rechaza cuentas desactivadas |

## Resumen: qué hay y qué falta

La API tiene 11 rutas funcionando y el núcleo de la app (catálogo, solicitudes y su flujo de estados) está cubierto. Faltan 5 piezas, ordenadas aquí de más a menos necesaria para la entrega final.

**Rutas implementadas (11):** `POST /auth/register`, `POST /auth/login`, `GET /animales`, `GET /animales/{id}`, `POST /animales`, `PUT /animales/{id}`, `DELETE /animales/{id}`, `POST /solicitudes`, `GET /solicitudes`, `GET /solicitudes/{id}`, `PATCH /solicitudes/{id}/estado`.

| # | Pendiente | Ruta propuesta | Por qué importa | Esfuerzo |
| --- | --- | --- | --- | --- |
| 1 | Transición finalizada | `PATCH /solicitudes/{id}/estado` con `finalizada` | Sin ella ningún animal llega a *adoptado* desde la app | Bajo: una línea en `TRANSICIONES` y un `UPDATE` del animal |
| 2 | Datos de mi cuenta | `GET /usuarios/me` | Splash y Perfil la usan | Bajo |
| 3 | Resumen del dashboard | `GET /dashboard/resumen` | Es la pantalla de inicio de la fundación | Medio: unos `COUNT` y las últimas 5 solicitudes |
| 4 | Registro de fundación y equipo | `POST /auth/registro-fundacion`, `GET/POST /usuarios`, `PATCH /usuarios/{id}` | Permite crear cuentas de fundación desde la app | Medio |
| 5 | Regla de animal adoptado en edición | `PUT /animales/{id}` | Cumple la especificación de F04 | Bajo |

**Decisiones abiertas que afectan a la API:** cómo guardar las fotos, cómo representar "Otros" en el filtro, si habrá filtro por edad, la contraseña del personal nuevo y si finalizar una adopción rechaza automáticamente las otras solicitudes activas del animal (propuesta tuya sin confirmar).

**Detalle a tener en cuenta al construir la app:** la API usa nombres en minúsculas con guión bajo (`animal_id`, `especie_otra`, `bueno_con_ninos`), no en camelCase.
