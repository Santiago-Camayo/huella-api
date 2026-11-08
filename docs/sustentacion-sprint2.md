# Sustentación Sprint 2 — Huella (9 nov 2026)

Guía para la sustentación presencial: demo en vivo de lo acumulado y explicación del código del Sprint 2.
HU del sprint: **HU-05, 07, 09, 10, 12, 16, 17, 21 y 22**, más los detalles que se completaron de HU-01, 03 y 04.

---

## 1. Antes de entrar (15 min antes)

- [ ] Abrir `https://huella-api-u3fo.onrender.com/health` y esperar `{"ok":true}` (Render gratis se duerme; la primera vez tarda hasta un minuto).
- [ ] Teléfono cargado, con la app instalada desde Android Studio y con datos o wifi. Plan B: el emulador abierto en el portátil.
- [ ] Sesión cerrada en la app, para empezar desde el login.
- [ ] Abiertos en el portátil: Jira (tablero HUE), los dos repos en GitHub y Android Studio con el proyecto.
- [ ] Una foto de un perro o gato guardada en el teléfono para registrar un animal.
- [ ] Cuentas a mano:
  - Adoptante: `santiago@correo.com` / `santiago123`
  - Fundación 1 (Patitas Felices, Popayán): `fundacion@huella.org` / `fundacion123`
  - Fundación 2 (Huellas del Cauca, Cali): `fundacion2@huella.org` / `fundacion123`
- [ ] Saber de qué fundación es el animal que vas a solicitar (se ve en su detalle) para entrar después con esa cuenta.

---

## 2. Guion de la demo (6-8 minutos)

> En cada paso: haz la acción y di en una frase qué historia cubre.

**1. Arquitectura (30 s).**
> "Huella tiene tres partes: la app Android en Kotlin y Jetpack Compose, una API propia en Node.js y Express
> desplegada en Render, y la base de datos PostgreSQL con las fotos en Supabase. La app nunca habla con Supabase:
> todo pasa por la API."

**2. Splash y sesión (HU-03, 30 s).** Abre la app.
> "La splash revisa si hay un token guardado. Si es válido entra directo; si el servidor responde 401 vuelve al login
> con 'Tu sesión expiró'; y si no hay red muestra Reintentar sin borrar la sesión."

**3. Registrar una fundación (HU-05, 1 min).** Login → "Registrar fundación" → llena el formulario.
> "Un solo formulario con los datos de la fundación y del administrador. La API crea las dos cosas en una
> transacción: o se crean ambas o ninguna. Entra directo al panel, y como es nueva no tiene animales."

Cierra sesión (muestra el diálogo de confirmación: HU-04).

**4. Buscar y filtrar (HU-07, 1 min).** Entra como adoptante.
> "El adoptante ve los animales disponibles de todas las fundaciones. Puede buscar por nombre y combinar filtros
> por especie, sexo, raza y fundación, y limpiarlos."

**5. Solicitar adopción (HU-09, 1 min).** Abre un animal → "Quiero adoptarlo" → escribe el comentario → enviar.
> "El comentario debe tener entre 10 y 500 caracteres; el botón no se activa antes y no deja enviar dos veces.
> Si ya tengo una solicitud activa para ese animal, la API responde 409 y la app muestra el mensaje."

**6. Mis solicitudes (HU-10, 30 s).** "Ver mi solicitud" o pestaña Solicitudes.
> "Solo las mías, más recientes primero, con filtro por estado y deslizar para refrescar. El detalle tiene una
> línea de tiempo."

Cierra sesión.

**7. Fundación: solicitudes (HU-21 y HU-22, 1.5 min).** Entra con la fundación dueña del animal.
> "El rol decide el módulo: la fundación entra a su panel. Aquí ve solo las solicitudes de sus animales,
> las pendientes más antiguas primero."

Abre la solicitud → "Pasar a revisión" → confirmar → "Aprobar" → confirmar.
> "Cada cambio pide confirmación. Al aprobar, el animal queda apartado y ya no recibe solicitudes."

**8. Fundación: animales y foto (HU-16 y HU-17, 1.5 min).** Pestaña Animales.
> "La fundación ve solo sus animales en todos los estados, también los retirados, con búsqueda y filtro."

Abre un animal (se ven sus solicitudes) → vuelve → **+** → llena el formulario → "Subir foto" → registrar.
> "La foto es obligatoria: JPG, PNG o WEBP de hasta 5 MB. La app la envía a la API, la API la sube a
> Supabase Storage y en la base solo se guarda la URL."

**9. Aislamiento entre fundaciones (RN-18, 30 s).** Cierra sesión y entra con la **otra** fundación.
> "Esta fundación no ve los animales ni las solicitudes de la otra. Y no es solo la app: la API responde 403
> si alguien intenta tocar algo de otra fundación."

**10. Cancelar (HU-12, 30 s).** Entra como adoptante → la solicitud aparece Aprobada → "Cancelar solicitud" → confirmar.
> "Se puede cancelar si está pendiente, en revisión o aprobada. Si estaba aprobada, el animal vuelve a estar disponible."

**11. Cierre (15 s).**
> "Todas las rutas están probadas con una colección de Postman de 80 peticiones y 124 validaciones, y cada HU
> está registrada en Jira."

---

## 3. Explicación del código

### Cómo viaja una petición en la API
`src/routes` (qué URL llama a qué) → `src/middlewares` (sesión, rol, foto) → `src/controllers` (lógica y SQL) → PostgreSQL.

| Tema | Dónde está | Qué decir |
| --- | --- | --- |
| Token y roles | `src/middlewares/auth.js`: `requerirSesion`, `requerirFundacion`, `requerirAdoptante` | El token JWT lleva `id`, `rol`, `fundacion_id` y `es_admin`. El usuario siempre sale del token, nunca del cuerpo (RN-03). |
| Aislamiento por fundación (RN-18) | `src/controllers/solicitudes.js`: `esDeOtraFundacion`; `src/controllers/animales.js`: `esDeMiFundacion` y `listar` | Antes de ver o cambiar algo, se compara la fundación del animal con la del token. Si no coincide: 403. En los listados se filtra con `WHERE a.fundacion_id = $1`. |
| Orden de solicitudes (HU-21) | `src/controllers/solicitudes.js`: `listar`, parámetro `orden` | `orden=antiguas` ordena por fecha ascendente; por defecto, descendente. Un valor raro responde 400. |
| Cambio de estado (HU-22, HU-12) | `src/controllers/solicitudes.js`: `TRANSICIONES` y `cambiarEstado` | Un objeto dice desde qué estado se puede pasar a cuál y quién puede hacerlo. El cambio de la solicitud y del animal va en una **transacción** (`BEGIN`/`COMMIT`/`ROLLBACK`) para que nunca quede uno cambiado y el otro no. |
| Registro de fundación (HU-05) | `src/controllers/auth.js`: `registroFundacion` | Inserta la fundación y el usuario administrador en una sola transacción (RN-20). La contraseña se guarda con `bcrypt`. |
| Fotos (HU-17) | `src/middlewares/foto.js` (`recibirFoto`) y `src/db/storage.js` (`subirFoto`) | `multer` lee el formulario multipart, revisa tipo y tamaño y deja el archivo en memoria. `subirFoto` lo envía a Supabase Storage con `fetch` y devuelve la URL pública. En multipart todo llega como texto, por eso `leerFormulario` convierte la edad y los sí/no. |
| Errores | `src/middlewares/errores.js` | Todo error sale como `{ "error": "mensaje" }` con el código correcto: 400, 401, 403, 404, 409. |
| Seguridad del SQL | Todos los controladores | Siempre consultas con parámetros (`$1, $2`), nunca texto pegado: evita inyección SQL. |

### La app
| Tema | Dónde está | Qué decir |
| --- | --- | --- |
| Conexión con la API | `data/Api.kt`: `ApiService`, `Api`, `llamar` | Retrofit define las rutas. Un interceptor agrega el token a cada petición. `llamar` convierte la respuesta en `Resultado.Ok` o `Resultado.Error` con el mensaje de la API. |
| Sesión | `data/Sesion.kt` y `ui/AuthViewModel.kt`: `restaurarSesion` | El token se guarda en `SharedPreferences`. Al abrir, `GET /usuarios/me` dice si sigue válido. |
| Estado de las pantallas | `ui/*ViewModel.kt` | Cada ViewModel guarda el estado con `mutableStateOf`; Compose redibuja solo cuando cambia. `null` significa "cargando". |
| Navegación y roles | `ui/HuellaApp.kt`: `NavHost`, `inicioDe`, pestañas | `inicioDe` manda a la fundación a su módulo y al adoptante al suyo. Cada módulo tiene su barra de pestañas. |
| Solicitar (HU-09) | `ui/SolicitarScreen.kt` y `SolicitudesViewModel.enviar` | El botón se activa con 10 caracteres; `enviando` evita el doble envío. |
| Foto (HU-17) | `ui/RegistrarAnimalScreen.kt` y `AnimalesViewModel.crear` | El selector de fotos del sistema no pide permisos. Se revisa tipo y tamaño antes de enviar el formulario multipart. |
| Filtros (HU-07) | `ui/AnimalesScreen.kt` | Se filtra la lista ya cargada, así responde al instante sin volver a pedir a la API (la API también acepta los filtros). |

---

## 4. Preguntas probables

**¿Por qué la clave de Supabase no está en la app?**
La clave `service_role` salta toda la seguridad de Supabase. Solo la tiene la API, en variables de entorno de Render. La app solo conoce la URL de la API.

**¿Cómo evitas que una fundación toque lo de otra si alguien llama a la API sin la app?**
La regla está en el servidor: la API compara la fundación del token con la del animal y responde 403. La app solo esconde lo que no corresponde.

**¿Por qué una transacción al aprobar?**
Porque se cambian dos tablas: la solicitud y el animal. Si falla la segunda, el `ROLLBACK` deshace la primera y los datos no quedan a medias.

**¿Por qué agregaste `multer`?**
Leer un formulario con archivos (multipart) a mano no son "pocas líneas". `multer` es la librería estándar de Express para eso. La subida a Supabase se hizo sin librería, con `fetch`.

**¿Qué pasa si suben un archivo que no es imagen o muy grande?**
La API responde 400 con "La foto debe ser JPG, PNG o WEBP" o "La foto no puede pesar más de 5 MB". La app también lo revisa antes de enviar.

**¿Qué pasa si dos adoptantes piden el mismo animal?**
Ambos pueden; la fundación decide. Solo puede haber una aprobada por animal (RN-08): hay un índice único en la base y la API responde 409.

**¿Por qué los animales de ejemplo se ven con emoji?**
Así está en el diseño de Figma. Los animales registrados desde la app sí muestran su foto real.

**¿Por qué `SharedPreferences` y no `DataStore`?**
Solo se guarda un texto (el token). `SharedPreferences` lo resuelve en pocas líneas y es fácil de explicar.

**¿Qué significa cada código de error?**
400 dato inválido, 401 sin sesión, 403 sin permiso, 404 no existe, 409 choca con una regla de negocio.

**¿Cómo probaste la API?**
Con una colección de Postman (80 peticiones, 124 validaciones) que corre completa con `npx newman@6 run "Huella - API.postman_collection.json"` contra una base recién sembrada. Cada ruta tiene su caso de error.

---

## 5. Lo que queda para el Sprint 3 (dilo si preguntan)
Finalizar la adopción (HU-23), editar y retirar animales desde la app, dashboard de la fundación, gestión del
equipo y cambio de contraseña, favoritos y perfil completo, APK firmado y los manuales.

## 6. Plan B
- **Render no responde:** espera un minuto y vuelve a abrir `/health`. Mientras tanto, muestra el código.
- **El teléfono falla:** usa el emulador desde Android Studio.
- **Falla la red del salón:** muestra el video del Sprint 1 y explica el código del Sprint 2 en Android Studio.
