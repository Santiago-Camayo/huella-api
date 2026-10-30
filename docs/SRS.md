# SRS Huella: especificación de requisitos del software

Oct 29, 2026 · @santiago

## 1. Introducción

Este documento especifica qué debe hacer Huella y con qué tecnología se construye, para guiar el desarrollo de los tres sprints de la asignatura Aplicaciones Móviles (docente Zulema León, 2026-2).

**Propósito del sistema.** Huella permite que varias fundaciones publiquen animales en adopción y que las personas soliciten adoptarlos desde un celular Android, con seguimiento del estado de cada solicitud.

**Alcance.** Incluye una app Android y una API REST propia desplegada en la nube, con base de datos y almacenamiento de fotos. Queda fuera: pagos, chat entre usuarios, notificaciones push, historial clínico de los animales, versión iOS y panel web.

**Definiciones.**

| Término | Significado |
| --- | --- |
| Adoptante | Persona que se registra para solicitar la adopción de un animal |
| Fundación | Personal de la fundación que administra animales y decide sobre las solicitudes |
| Solicitud activa | Solicitud en estado pendiente, en\_revision o aprobada |
| Retirar | Ocultar un animal (`activo = false`) sin borrar su historial |
| HU | Historia de usuario |
| JWT | Token firmado que identifica al usuario y su rol en cada petición |

**Entregas de la asignatura** (según el documento de entregables):

| Entrega | Fecha | Modalidad | Qué se entrega |
| --- | --- | --- | --- |
| Sprint 1 | 2 de noviembre (festivo) | Virtual | HU del sprint definidas, código fuente cargado y evidencia (video o documento) del funcionamiento |
| Sprint 2 | 9 de noviembre | Presencial | HU del sprint 2 actualizadas, sustentación del código y demostración en vivo de lo acumulado |
| Sprint final | 17 de noviembre | Presencial | 100% de las HU cerradas, sustentación final, APK instalable, manual de usuario y manual técnico |

Todas las HU se gestionan en una herramienta de proyectos (Jira) compartida con la docente, y en cada entrega se sustenta el código. **Requisito clave:** la API que consume la app no puede ser local; debe estar desplegada en la nube.

## 2. Descripción general

Huella es una app móvil que consume una API propia; no funciona sin conexión a internet, salvo los favoritos, que se guardan en el teléfono.

**Usuarios.**

| Rol | Qué hace | Cómo se crea la cuenta |
| --- | --- | --- |
| Adoptante | Explora animales, solicita adopciones, sigue y cancela sus solicitudes, guarda favoritos | Se registra solo desde la app |
| Fundación (administrador y empleados) | Publica y edita los animales de su fundación (con foto), retira publicaciones, revisa y resuelve las solicitudes de sus animales y ve el resumen. El administrador además gestiona al personal | Un representante registra la fundación desde la app y queda como administrador; el administrador crea las cuentas de los empleados desde Equipo |

Todos usan el mismo inicio de sesión. La API devuelve el rol y la app abre el módulo que corresponde.

**Entorno de operación.** App Android (API 26 o superior) y una API en la nube accesible por HTTPS. El APK final debe funcionar en un teléfono real, no solo en el emulador.

**Restricciones.**

- La API debe estar desplegada en la nube y haber sido desarrollada por el equipo (requisito de la asignatura).
- Hay que sustentar el código en cada entrega, por lo que la solución debe ser simple y entendible.
- Proyecto individual con 19 días hasta la entrega final: se prioriza lo esencial.
- Se usan servicios con capa gratuita, sin costo para el proyecto.

**Supuestos.**

- Varias fundaciones pueden usar la app: cada una ve y gestiona solo sus animales y solicitudes, y los adoptantes ven los animales de todas.
- Todo animal publicado tiene una foto principal obligatoria.
- La contraseña temporal de un empleado nuevo se la entrega el administrador en persona, y el empleado debe cambiarla en su primer ingreso.
- Ningún registro exige confirmar el correo con un código o un enlace: el adoptante crea su cuenta y entra de inmediato. Tampoco hay un administrador de la plataforma que apruebe fundaciones: la que se registra queda activa.

## 3. Decisiones de tecnología y arquitectura

Se decidió migrar de SQLite a PostgreSQL, publicar la API en la nube y guardar las fotos en un almacenamiento de archivos, no en la base. El resto de la API se conserva.

| Tema | Decisión | Alternativas descartadas | Motivo |
| --- | --- | --- | --- |
| Base de datos | **PostgreSQL** | SQLite, MySQL, MongoDB | Los datos son relacionales (usuarios, animales, solicitudes). Postgres soporta los índices únicos parciales que hoy protegen las reglas de negocio; MySQL no los tiene. Mongo obligaría a reescribir esas reglas en código. SQLite es un archivo local y se perdería en un servidor en la nube |
| Alojamiento de la base | **Supabase** (PostgreSQL gestionado) | Neon, instalar Postgres propio | Da la base y el almacenamiento de archivos en una sola cuenta, con capa gratuita |
| Alojamiento de la API | **Render** (servicio web Node) | Railway, Fly.io | Despliega directo desde el repositorio de GitHub, con variables de entorno y HTTPS incluido |
| Fotos | Archivo en **Supabase Storage**; la base solo guarda la URL en `animales.foto` | Guardar la imagen en la base, Cloudinary | Una base con imágenes crece y se vuelve lenta; guardar solo la URL es lo estándar |
| Subida de fotos | La app envía la imagen a la API (`multipart`) y la API la sube al almacenamiento | Subir directo desde la app | Las claves del almacenamiento quedan solo en el servidor |
| Acceso a datos | Librería `pg` con SQL directo | ORM (Prisma, Sequelize) | Mantiene el código actual casi igual y es fácil de explicar en la sustentación |
| Autenticación | JWT con rol dentro (ya implementado) | Sesiones en servidor | Sin estado y simple para una app móvil |
| App Android | **Kotlin + Jetpack Compose**, arquitectura MVVM | Vistas XML | Es el estándar actual de Android y reduce código de pantallas |
| Red en Android | **Retrofit + OkHttp** (un interceptor agrega el token) | Volley | Convierte cada ruta de la API en una función tipada |
| Imágenes en Android | **Coil** | Glide | Pensada para Compose |
| Datos locales | **DataStore** para el token y **Room** para favoritos | SharedPreferences | Los favoritos son locales por decisión de diseño |
| Inyección de dependencias | Manual, sin Hilt | Hilt | Menos configuración; el proyecto es pequeño |
| Repositorios | Dos: `huella-api` y `huella-android` | Uno solo | Cada parte se despliega y se sustenta por separado |
| Metodología | Scrum ligero con tres sprints, tablero en Jira | Kanban | Coincide con las tres entregas de la asignatura |

**Arquitectura en capas.**

1. La app Android (Compose + ViewModel + Repository) pide datos con Retrofit por HTTPS.
2. La API en Render recibe la petición y pasa por rutas, middlewares de sesión y rol, y controladores.
3. El controlador consulta PostgreSQL en Supabase.
4. Para las fotos, el controlador sube el archivo a Supabase Storage y guarda su URL en la base.
5. La API responde en JSON y la app lo muestra.

**Consecuencia técnica de cambiar de base.** `better-sqlite3` es síncrono y `pg` es asíncrono: cada controlador pasa a usar `async/await`. Express 5 ya maneja los errores de funciones asíncronas. Los marcadores `?` del SQL pasan a `$1, $2`, y `date('now')` pasa a `CURRENT_DATE`.

## 4. Requisitos funcionales

Son 25 historias de usuario: 6 de acceso, 9 del adoptante y 10 de la fundación. En la columna Ruta, **(nueva)** marca lo que falta crear en la API y **(ajustar)** lo que existe pero necesita un cambio. Prioridad: A = esencial, M = importante, B = si alcanza el tiempo. Sprint: S1 = 2 nov, S2 = 9 nov, S3 = 17 nov.

### 4.1 Acceso (todos los roles)

| ID | Historia | Criterios de aceptación | Ruta de la API | Prio | Sprint |
| --- | --- | --- | --- | --- | --- |
| HU-01 | Como visitante, quiero registrarme para poder solicitar adopciones | Pide nombre, correo, teléfono opcional y contraseña de mínimo 8 caracteres con confirmación; crea siempre un adoptante; entra directo a Inicio; correo repetido muestra error | `POST /auth/register` (ajustar: validar mínimo 8 caracteres) | A | S1 |
| HU-02 | Como usuario, quiero iniciar sesión para entrar a mi módulo | Un solo formulario; el rol decide el módulo; el error de credenciales no revela si falló el correo o la clave; cuenta desactivada muestra aviso | `POST /auth/login` | A | S1 |
| HU-03 | Como usuario, quiero que la app recuerde mi sesión para no iniciar sesión cada vez | Con token vigente entra directo; si el servidor responde 401 vuelve al login con "Tu sesión expiró"; sin red muestra Reintentar | `GET /usuarios/me` (nueva) | A | S1 |
| HU-04 | Como usuario, quiero cerrar sesión para proteger mi cuenta | Pide confirmación; borra el token y los favoritos locales; vuelve al login | Ninguna (local) | M | S1 |
| HU-05 | Como representante de una fundación, quiero registrar mi fundación y mi cuenta de administrador desde la app | Un solo formulario con los datos de la fundación (nombre, ciudad, teléfono) y del administrador (nombre, correo, contraseña de mínimo 8 caracteres); crea ambos a la vez; entra directo al panel; correo repetido muestra error | `POST /auth/registro-fundacion` (nueva) | A | S2 |
| HU-25 | Como empleado de una fundación, quiero cambiar mi contraseña temporal en mi primer ingreso para proteger mi cuenta | Si la cuenta tiene contraseña temporal, la app obliga a cambiarla antes de continuar; la nueva tiene mínimo 8 caracteres y es distinta de la actual; también se puede cambiar después desde el perfil | PUT /usuarios/me/password (nueva) | M | S3 |

### 4.2 Adoptante

| ID | Historia | Criterios de aceptación | Ruta de la API | Prio | Sprint |
| --- | --- | --- | --- | --- | --- |
| HU-06 | Como adoptante, quiero ver los animales disponibles para elegir a quien adoptar | Lista con foto, nombre, especie y edad; solo animales disponibles y activos de todas las fundaciones; estados de carga, vacío y error con Reintentar | `GET /animales?estado=disponible` | A | S1 |
| HU-07 | Como adoptante, quiero buscar y filtrar para encontrar el animal que me interesa | Filtros combinables por nombre, especie, sexo, raza y fundación; botón para limpiar; mensaje cuando no hay resultados | `GET /animales?nombre&especie&sexo&raza&fundacionId&estado` | A | S2 |
| HU-08 | Como adoptante, quiero ver el detalle de un animal para decidir si lo adopto | Foto, nombre y ciudad de la fundación, descripción, personalidad y convivencia con niños, perros y gatos; botón Adoptar solo si está disponible; si fue retirado, muestra "Publicación no disponible" | `GET /animales/{id}` | A | S1 |
| HU-09 | Como adoptante, quiero enviar una solicitud para adoptar un animal | Comentario de 10 a 500 caracteres; no permite doble envío; error claro si el animal ya no está disponible o ya tengo una solicitud activa; pantalla de confirmación | `POST /solicitudes` | A | S2 |
| HU-10 | Como adoptante, quiero ver mis solicitudes para saber en qué van | Solo las mías, más recientes primero, filtro por estado, deslizar para refrescar | `GET /solicitudes?estado=` | A | S2 |
| HU-11 | Como adoptante, quiero ver el detalle de mi solicitud para entender su estado | Línea de tiempo y texto claro por estado; nadie más puede abrirla | `GET /solicitudes/{id}` | M | S3 |
| HU-12 | Como adoptante, quiero cancelar mi solicitud si cambio de opinión | Disponible en pendiente, en revisión y aprobada; pide confirmación; si estaba aprobada el animal vuelve a disponible | `PATCH /solicitudes/{id}/estado` con `cancelada` | M | S2 |
| HU-13 | Como adoptante, quiero guardar favoritos para volver a verlos | Se guardan en el teléfono; si el animal ya fue adoptado o retirado se marca "Ya no disponible"; se borran al cerrar sesión | `GET /animales/{id}` para refrescar el estado | M | S3 |
| HU-14 | Como adoptante, quiero ver mi perfil | Nombre, correo y teléfono; accesos a Mis solicitudes y Favoritos | `GET /usuarios/me` (nueva) | M | S3 |

### 4.3 Fundación

| ID | Historia | Criterios de aceptación | Ruta de la API | Prio | Sprint |
| --- | --- | --- | --- | --- | --- |
| HU-15 | Como fundación, quiero ver un resumen para saber cómo va todo | Animales disponibles, solicitudes pendientes, solicitudes en revisión, adopciones completadas y las últimas 5 solicitudes | `GET /dashboard/resumen` (nueva) | M | S3 |
| HU-16 | Como fundación, quiero listar mis animales para administrarlos | Solo los animales de mi fundación, en todos los estados; filtro por estado y nombre; botón para registrar uno nuevo | `GET /animales?estado&nombre` | A | S2 |
| HU-17 | Como fundación, quiero registrar un animal con su foto para publicarlo | Nombre, especie ("Otro" pide cuál), sexo y edad de 0 a 30 obligatorios; la foto es obligatoria (JPG, PNG o WEBP de hasta 5 MB) y no se puede publicar sin ella; queda disponible y asociado a mi fundación | `POST /animales` con `multipart/form-data` (ajustar: incluye la foto) | A | S2 |
| HU-18 | Como fundación, quiero editar un animal para corregir sus datos | El estado no se edita a mano; un animal adoptado no se puede editar; se puede cambiar la foto | `PUT /animales/{id}` con `multipart/form-data` (ajustar: foto opcional y 409 si está adoptado) | M | S3 |
| HU-19 | Como fundación, quiero retirar un animal de la publicación sin perder su historial | Siempre se permite; avisa que las solicitudes se conservan; el adoptante ve "Publicación no disponible" | `DELETE /animales/{id}` | M | S3 |
| HU-20 | Como fundación, quiero ver las solicitudes de un animal | Dentro del detalle del animal, con estado y adoptante | `GET /solicitudes?animalId=` | M | S3 |
| HU-21 | Como fundación, quiero listar todas las solicitudes para atenderlas | Solo las solicitudes de los animales de mi fundación; filtro por estado; las pendientes más antiguas primero | `GET /solicitudes?estado&animalId` (ajustar: parámetro de orden) | A | S2 |
| HU-22 | Como fundación, quiero pasar a revisión, aprobar o rechazar una solicitud | Botones según el estado actual; confirmación antes de cada cambio; al aprobar, el animal queda apartado | `GET /solicitudes/{id}` y `PATCH /solicitudes/{id}/estado` | A | S2 |
| HU-23 | Como fundación, quiero finalizar una adopción aprobada para cerrar el proceso | El animal pasa a adoptado y las demás solicitudes activas de ese animal se rechazan | `PATCH /solicitudes/{id}/estado` con `finalizada` (ajustar) | A | S3 |
| HU-24 | Como administrador de mi fundación, quiero gestionar mi equipo para dar o quitar acceso | Solo el administrador ve Equipo; lista el personal de mi fundación, agrega un empleado con contraseña temporal, activa o desactiva cuentas (no la propia); correo repetido da error | `GET /usuarios`, `POST /usuarios`, `PATCH /usuarios/{id}` (nuevas) | M | S3 |

## 5. Reglas de negocio

Las reglas las aplica la API y, cuando es posible, también la base de datos con restricciones, para que una falla en el código no deje datos incorrectos.

| ID | Regla | Respuesta si se incumple |
| --- | --- | --- |
| RN-01 | El registro público solo crea adoptantes; el rol lo fija el servidor | Se ignora cualquier rol enviado |
| RN-02 | El correo es único | 409 |
| RN-03 | El usuario de una petición sale del token, nunca del cuerpo | 401 si no hay token válido |
| RN-04 | Solo la fundación crea, edita y retira animales y resuelve solicitudes; solo el adoptante crea solicitudes | 403 |
| RN-05 | Solo se solicita un animal disponible y activo | 409 |
| RN-06 | Un adoptante no puede tener dos solicitudes activas del mismo animal; tras cancelar o ser rechazado sí puede volver a solicitar | 409 |
| RN-07 | El comentario de la solicitud es obligatorio y mide entre 10 y 500 caracteres | 400 |
| RN-08 | Solo puede haber una solicitud aprobada por animal | 409 |
| RN-09 | Aprobar exige animal disponible y activo; el animal pasa a apartado. Aprobar no rechaza las demás solicitudes | 409 |
| RN-10 | Si una solicitud aprobada se rechaza o cancela, el animal vuelve a disponible | Automático |
| RN-11 | Finalizar una adopción pasa el animal a adoptado y rechaza automáticamente las demás solicitudes activas de ese animal | Automático |
| RN-12 | Con el animal retirado no se puede aprobar ni finalizar, pero sí rechazar o cancelar | 409 |
| RN-13 | Retirar un animal solo pone `activo = false`; se conserva el historial | 204 |
| RN-14 | Un animal adoptado no se edita | 409 |
| RN-15 | Un adoptante solo ve sus solicitudes; la fundación ve todas | 403 al abrir una ajena |
| RN-16 | Una cuenta desactivada no puede iniciar sesión; el administrador no puede desactivar su propia cuenta | 403 |
| RN-17 | Las fotos son JPG, PNG o WEBP de hasta 5 MB | 400 |
| RN-18 | Cada fundación ve y gestiona solo sus propios animales y solicitudes; los adoptantes ven los animales de todas las fundaciones | 403 |
| RN-19 | Todo animal se publica con foto; no puede existir un animal sin foto | 400 |
| RN-20 | Registrar una fundación crea la fundación y su administrador en una sola operación; el correo no puede repetirse | 409 |
| RN-21 | Solo el administrador de la fundación crea, activa y desactiva cuentas de empleados; el empleado no accede a Equipo | 403 |
| RN-22 | Un empleado nuevo recibe una contraseña temporal y la app le obliga a cambiarla en su primer ingreso; la nueva tiene mínimo 8 caracteres | 400 al cambiarla con una clave inválida |

**Transiciones de estado de una solicitud.** Cualquier otra transición responde 409.

| Desde | Hacia | Quién puede |
| --- | --- | --- |
| pendiente | en\_revision, rechazada | Fundación |
| en\_revision | aprobada, rechazada | Fundación |
| aprobada | finalizada, rechazada | Fundación |
| pendiente, en\_revision, aprobada | cancelada | Adoptante dueño |
| rechazada, cancelada, finalizada | (ninguna, son estados finales) | Nadie |

**Efecto de cada estado sobre el animal:** aprobada → apartado; finalizada → adoptado; aprobada que se rechaza o cancela → disponible.

## 6. Contrato de la API

La API tendrá 19 rutas: 11 ya existen (varias con un ajuste menor, sobre todo limitar los resultados a la fundación del usuario) y 8 son nuevas.

**Convenciones.**

- URL base: la que entregue Render al desplegar (por definir), siempre por HTTPS.
- Formato JSON; los campos del cuerpo y de las respuestas van en minúsculas con guión bajo (`animal_id`, `especie_otra`). Los filtros de la URL de solicitudes son `estado`, `animalId` y `usuarioId`.
- Las rutas protegidas llevan el encabezado `Authorization: Bearer <token>`.
- Todo error responde `{"error": "mensaje"}` con el código que corresponda: 400 dato inválido, 401 sin sesión, 403 sin permiso, 404 no existe, 409 choca con una regla de negocio.

| Método y ruta | Quién | Entrada | Éxito | Errores | Estado |
| --- | --- | --- | --- | --- | --- |
| `GET /health` | Público | — | 200 `{"ok": true}` | — | Nueva |
| `POST /auth/register` | Público | `nombre`, `correo`, `telefono?`, `password` (mínimo 8) | 201 `{token, usuario}` | 400, 409 | Ajustar |
| `POST /auth/login` | Público | `correo`, `password` | 200 `{token, usuario}` | 400, 401, 403 | Existe |
| `POST /auth/registro-fundacion` | Público | `fundacion` (`nombre`, `ciudad`, `telefono?`) y `admin` (`nombre`, `correo`, `password`) | 201 `{token, usuario}` | 400, 409 | Nueva |
| `GET /usuarios/me` | Sesión | — | 200 `usuario` | 401 | Nueva |
| PUT /usuarios/me/password | Sesión | password\_actual, password\_nueva (mínimo 8) | 200 {ok: true} | 400, 401 | Nueva |
| `GET /usuarios` | Administrador | — | 200 lista del personal de su fundación | 401, 403 | Nueva |
| `POST /usuarios` | Administrador | `nombre`, `correo`, `password` temporal | 201 `usuario` | 400, 403, 409 | Nueva |
| `PATCH /usuarios/{id}` | Administrador | `activo` (true o false) | 200 `usuario` | 403, 404, 409 (la propia cuenta) | Nueva |
| `GET /animales` | Sesión | Filtros: `nombre`, `especie`, `sexo`, `raza`, `fundacionId`, `estado` | 200 lista (solo activos; la fundación ve solo los suyos) | 401 | Existe |
| `GET /animales/{id}` | Sesión | — | 200 animal (incluye retirados) | 401, 404 | Existe |
| `POST /animales` | Fundación | `multipart/form-data`: datos del animal y `foto` obligatoria | 201 animal | 400, 403 | Ajustar |
| `PUT /animales/{id}` | Fundación | `multipart/form-data`: datos del animal y `foto` opcional | 200 animal | 400, 403, 404, 409 (adoptado) | Ajustar |
| `DELETE /animales/{id}` | Fundación | — | 204 | 403, 404 | Existe |
| `POST /solicitudes` | Adoptante | `animal_id`, `comentario` | 201 solicitud | 400, 403, 404, 409 | Existe |
| `GET /solicitudes` | Sesión | Filtros: `estado`, `animalId`, `usuarioId`, `orden` (asc o desc) | 200 lista (el adoptante solo ve las suyas) | 401 | Ajustar |
| `GET /solicitudes/{id}` | Dueño o fundación | — | 200 solicitud | 403, 404 | Existe |
| `PATCH /solicitudes/{id}/estado` | Según transición | `estado` | 200 solicitud | 403, 404, 409 | Ajustar (agregar `finalizada`) |
| `GET /dashboard/resumen` | Fundación | — | 200 `{disponibles, pendientes, en_revision, adopciones_completadas, ultimas}` | 403 | Nueva |

Los ajustes son pequeños: validar la contraseña en el registro, el 409 al editar un animal adoptado y, en solicitudes, un parámetro `orden` en el listado y una línea más en la tabla de transiciones para `finalizada`. La ruta `/health` sirve para que Render compruebe que la API está viva.

**Por fundación.** El token incluye `fundacion_id` y `es_admin`, y el objeto `usuario` que devuelven el login, el registro y `/usuarios/me` trae además `fundacion_id`, `es_admin` y `debe_cambiar_password`. Con eso la API limita a la fundación del usuario los animales, solicitudes y cuentas que puede ver o cambiar, y la app decide si muestra Equipo y si exige cambiar la contraseña.

**Fotos.** Se envían dentro del alta y de la edición del animal (`multipart/form-data`); la API las sube a Supabase Storage y guarda la URL en `foto`. No hay una ruta aparte para fotos.

## 7. Modelo de datos (PostgreSQL)

El modelo conserva las tres tablas actuales y agrega la tabla fundaciones. Cambian los tipos: los campos que eran 0 o 1 pasan a `BOOLEAN` y las fechas a `TIMESTAMPTZ`. Una fundación tiene muchos usuarios (su administrador y sus empleados) y muchos animales; un usuario tiene muchas solicitudes y un animal tiene muchas solicitudes.

**fundaciones**

| Campo | Tipo | Regla |
| --- | --- | --- |
| id | `BIGINT` identidad | Llave primaria |
| nombre | `TEXT` | Obligatorio |
| ciudad | `TEXT` | Obligatorio |
| telefono | `TEXT` | Opcional |
| activo | `BOOLEAN` | Por defecto `true` |
| fecha\_registro | `TIMESTAMPTZ` | Por defecto la fecha actual |

**usuarios**

| Campo | Tipo | Regla |
| --- | --- | --- |
| id | `BIGINT` identidad | Llave primaria |
| nombre | `TEXT` | Obligatorio |
| correo | `TEXT` | Obligatorio y único |
| telefono | `TEXT` | Opcional |
| password\_hash | `TEXT` | Obligatorio, cifrado con bcrypt |
| rol | `TEXT` | `adoptante` o `fundacion` |
| activo | `BOOLEAN` | Por defecto `true` |
| fecha\_registro | `TIMESTAMPTZ` | Por defecto la fecha actual |
| fundacion\_id | BIGINT | Llave foránea a fundaciones; obligatoria si el rol es fundacion, vacía para adoptantes |
| es\_admin | BOOLEAN | Por defecto false; true para quien registró la fundación |
| debe\_cambiar\_password | BOOLEAN | Por defecto false; true para empleados con contraseña temporal |

**animales**

| Campo | Tipo | Regla |
| --- | --- | --- |
| id | `BIGINT` identidad | Llave primaria |
| nombre | `TEXT` | Obligatorio |
| especie | `TEXT` | `perro`, `gato` u `otro` |
| especie\_otra | `TEXT` | Obligatorio si la especie es `otro` |
| raza | `TEXT` | Opcional |
| edad | `INTEGER` | De 0 a 30 años |
| sexo | `TEXT` | `macho` o `hembra` |
| descripcion, personalidad | `TEXT` | Opcionales |
| bueno\_con\_ninos, bueno\_con\_perros, bueno\_con\_gatos | `BOOLEAN` | Opcionales; vacío significa "no se sabe" |
| foto | `TEXT` | Obligatoria; URL de la imagen en el almacenamiento |
| estado | `TEXT` | `disponible`, `apartado` o `adoptado`; por defecto `disponible` |
| activo | `BOOLEAN` | Por defecto `true`; `false` = retirado |
| fecha\_registro | `TIMESTAMPTZ` | Por defecto la fecha actual |
| fundacion\_id | BIGINT | Llave foránea a fundaciones; obligatoria, indica quién publica el animal |

**solicitudes**

| Campo | Tipo | Regla |
| --- | --- | --- |
| id | `BIGINT` identidad | Llave primaria |
| animal\_id | `BIGINT` | Llave foránea a `animales` |
| usuario\_id | `BIGINT` | Llave foránea a `usuarios` |
| estado | `TEXT` | `pendiente`, `en_revision`, `aprobada`, `rechazada`, `cancelada` o `finalizada`; por defecto `pendiente` |
| comentario | `TEXT` | Obligatorio, de 10 a 500 caracteres |
| fecha | `TIMESTAMPTZ` | Por defecto la fecha actual |

**Restricciones que protegen las reglas de negocio** (se conservan tal cual, Postgres las soporta):

```sql
CREATE UNIQUE INDEX uq_solicitud_activa
  ON solicitudes (animal_id, usuario_id)
  WHERE estado IN ('pendiente', 'en_revision', 'aprobada');

CREATE UNIQUE INDEX uq_una_aprobada_por_animal
  ON solicitudes (animal_id)
  WHERE estado = 'aprobada';
```

**Impacto en la app:** como `activo` y los campos `bueno_con_*` pasan de 0 o 1 a `true` o `false`, la app Android los debe leer como booleanos.

## 8. Requisitos no funcionales

Se definen pocos y verificables, acordes con un proyecto académico.

| ID | Categoría | Requisito | Cómo se verifica |
| --- | --- | --- | --- |
| RNF-01 | Seguridad | Las contraseñas se guardan cifradas (bcrypt); nunca se devuelven en una respuesta | Revisar la tabla y las respuestas de la API |
| RNF-02 | Seguridad | Toda comunicación con la API va por HTTPS | La URL de Render empieza con `https` |
| RNF-03 | Seguridad | La clave del token y las credenciales de la base y del almacenamiento están en variables de entorno, no en el código ni en GitHub | Revisar el repositorio |
| RNF-04 | Seguridad | Todas las consultas usan parámetros (`$1, $2`), nunca texto pegado | Revisar el código |
| RNF-05 | Disponibilidad | La API está en la nube y responde sin tener ninguna PC del equipo encendida | Probar desde el APK en un teléfono real |
| RNF-06 | Rendimiento | Las listas responden en menos de 3 segundos con la API activa | Probar en Postman |
| RNF-07 | Usabilidad | Toda pantalla que carga datos muestra estado de carga, vacío y error con opción de reintentar | Recorrer cada pantalla |
| RNF-08 | Usabilidad | Las acciones que no se pueden deshacer piden confirmación | Cancelar, retirar, cerrar sesión y cambiar estado |
| RNF-09 | Compatibilidad | La app funciona en Android 8.0 (API 26) o superior | Instalar el APK en un teléfono real |
| RNF-10 | Mantenibilidad | El código está separado por capas (rutas, middlewares, controladores, base) y la app por MVVM | Revisar la estructura de carpetas |
| RNF-11 | Mantenibilidad | Cada cambio de código se sube a GitHub con un mensaje claro, ligado a una HU de Jira | Historial de commits |
| RNF-12 | Pruebas | Cada ruta tiene al menos una prueba en la colección de Postman, con su caso de error | Ejecutar la colección completa |

Una limitación a tener en cuenta: en la capa gratuita de Render el servicio puede "dormirse" tras un rato sin uso, y la primera petición tarda más. Conviene despertarlo antes de cada demo.

## 9. Plan de sprints

Las 25 historias se reparten en tres sprints que coinciden con las fechas de entrega: 6 en el primero, 9 en el segundo y 10 en el tercero. Cada sprint termina con algo que se puede demostrar, no con piezas sueltas. Hoy es 29 de octubre: al primer sprint le quedan 4 días.

| Sprint | Entrega | Objetivo | Historias | Trabajo técnico | Evidencia |
| --- | --- | --- | --- | --- | --- |
| 1 | 2 nov, virtual | Base funcionando de punta a punta: la app, conectada a la API en la nube, permite registrarse, entrar y ver animales | HU-01, 02, 03, 04, 06, 08 | Crear el tablero de Jira y compartirlo con la docente; migrar la API a PostgreSQL con la tabla de fundaciones y datos de ejemplo; desplegar en Render; agregar `/health` y `GET /usuarios/me`; crear el proyecto Android con Retrofit, token y navegación | Video corto de la app en el teléfono, código en GitHub, historias movidas a Hecho en Jira |
| 2 | 9 nov, presencial | Flujo completo de adopción: el adoptante busca y solicita, la fundación publica con foto y resuelve | HU-05, 07, 09, 10, 12, 16, 17, 21, 22 | Registro de fundación (crea fundación y administrador); fotos en Supabase Storage dentro del alta del animal (`POST /animales`); parámetro `orden` en solicitudes; pantallas de la fundación | Demo en vivo del flujo solicitar → revisar → aprobar; sustentación del código del sprint |
| 3 | 17 nov, presencial | Cierre del 100% de las historias, APK y documentación | HU-11, 13, 14, 15, 18, 19, 20, 23, 24, 25 | `finalizada`, 409 al editar un adoptado, dashboard, equipo y cambio de contraseña; APK firmado e instalable; revisión final de la API desplegada | APK, manual de usuario, manual técnico, Jira con todo en Hecho, sustentación final |

**Orden de recorte si falta tiempo.** Primero se sacan HU-24 (equipo) y HU-25 (cambio de contraseña), que van juntas: sin empleados, el administrador sigue usando la app. Luego HU-15 (dashboard). El resto es el núcleo de la app y no se recorta.

**Documentación final.**

- **Manual técnico:** reutiliza las secciones 3 (tecnologías y arquitectura), 6 (API) y 7 (datos) de este documento, más los patrones usados: capas en la API, MVVM y repositorios en la app.
- **Manual de usuario:** recorrido paso a paso con capturas, uno para el adoptante y otro para la fundación.

**Definición de hecho.** Una historia se da por terminada cuando sus criterios de aceptación se cumplen en el APK contra la API desplegada, tiene su evidencia adjunta en Jira y el código está en GitHub.

## 10. Riesgos y decisiones

**Decisiones que estaban abiertas y quedan cerradas en este documento.**

| Tema | Decisión |
| --- | --- |
| Almacenamiento de fotos | Una foto principal por animal, en Supabase Storage; la base guarda la URL |
| Valor de "Otros" | La especie se guarda como `otro` más el texto `especie_otra`; el filtro de categoría "Otros" usa `especie=otro` |
| Filtro por edad | Fuera de esta versión; la edad se guarda en años enteros |
| Contraseña del personal nuevo | La fundación asigna una contraseña temporal y la entrega en persona |
| Finalizar una adopción | Rechaza automáticamente las demás solicitudes activas de ese animal (RN-11) |
| Animales retirados en la lista de la fundación | No se muestran; el prototipo de Figma los mostraba atenuados, así que ese detalle de diseño se ajusta |
| Tecnología Android | Kotlin con Jetpack Compose |
| Varias fundaciones | La app la usan varias fundaciones; cada una gestiona solo sus animales y solicitudes (tabla fundaciones y campo fundacion\_id) |
| Cuentas de fundación y empleados | Un representante registra la fundación y queda como administrador; el administrador crea empleados con contraseña temporal que deben cambiar en su primer ingreso |
| Foto de cada animal | Obligatoria; se envía en el mismo alta del animal |
| Verificación de correo | No se pide en ningún tipo de cuenta |

**Riesgos.**

| Riesgo | Efecto | Qué se hace |
| --- | --- | --- |
| Poco tiempo: 4 días para el sprint 1 y 19 para el final | No cerrar todas las historias | Plan por prioridad y orden de recorte definido en la sección 9 |
| La migración a PostgreSQL pasa el código de síncrono a asíncrono | Errores al reescribir los controladores | Migrar y probar con la colección de Postman, que ya existe, antes de tocar la app |
| El servicio gratuito de Render se duerme tras un rato sin uso | La primera petición de una demo tarda | Despertarlo antes de cada demo; la app muestra estado de carga |
| Los límites de las capas gratuitas de Supabase y Render pueden cambiar | Perder acceso a la base o a las fotos | Verificar los límites vigentes antes de desplegar y guardar una copia del esquema SQL en el repositorio |
| El diseño de Figma y el prototipo no coinciden en todo con esta especificación | Retrabajo en pantallas | Este SRS manda; los ajustes de diseño se anotan en la historia correspondiente |
| Subir fotos desde el celular puede ser lento o fallar | Mala experiencia al registrar animales | Límite de 5 MB, formatos fijos y mensaje de error claro; reducir el tamaño antes de enviar si hace falta |
| Varias fundaciones agregan una tabla y un filtro por fundación en casi todas las rutas | Más trabajo en los sprints 1 y 2, y riesgo de que una fundación vea datos de otra | Aplicar el filtro por fundacion\_id en un solo lugar reutilizable y probarlo en Postman con dos fundaciones |
