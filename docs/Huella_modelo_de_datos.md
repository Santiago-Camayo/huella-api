# **Huella: Modelo de datos** 

_Proyecto individual de Dispositivos Móviles. Aplicación de adopción de mascotas con API REST y base de datos SQLite._ 

## **1. Entidades** 

El modelo tiene tres entidades: USUARIO, ANIMAL y SOLICITUD. Los dos roles (adoptante y fundación) comparten la tabla USUARIO y se distinguen por el campo rol. 

### **1.1 USUARIO** 

|**Campo**|**Tipo**|**Notas**|
|---|---|---|
|id|INTEGER (PK)|Autoincremental|
|nombre|TEXT|Obligatorio|
|correo|TEXT|Único|
|telefono|TEXT||
|password_hash|TEXT|Nunca se guarda la contraseña en texto plano|
|rol|TEXT|adoptante o fundacion|
|fecha_registro|TEXT|ISO 8601|
|activo|INTEGER|1 activo, 0 desactivado|



### **1.2 ANIMAL** 

|**Campo**|**Tipo**|**Notas**|
|---|---|---|
|id|INTEGER (PK)|Autoincremental|
|nombre|TEXT|Obligatorio|
|especie|TEXT|perro, gato u otro|
|especie_otra|TEXT|Solo si la especie es otro|
|raza|TEXT||
|edad|INTEGER|Entre 0 y 30 años|
|sexo|TEXT|macho o hembra|
|descripcion|TEXT||
|personalidad|TEXT||
|bueno_con_ninos|INTEGER|1, 0 o NULL (sin dato)|
|bueno_con_perros|INTEGER|1, 0 o NULL (sin dato)|
|bueno_con_gatos|INTEGER|1, 0 o NULL (sin dato)|



|**Campo**|**Tipo**|**Notas**|
|---|---|---|
|foto|TEXT|URL (por ahora)|
|estado|TEXT|disponible, apartado o adoptado|
|fecha_registro|TEXT|ISO 8601|
|activo|INTEGER|1 activo, 0 retirado|



### **1.3 SOLICITUD** 

|**Campo**|**Tipo**|**Notas**|
|---|---|---|
|id|INTEGER (PK)|Autoincremental|
|animal_id|INTEGER (FK)|Referencia a animales.id|
|usuario_id|INTEGER (FK)|Referencia a usuarios.id (el adoptante)|
|fecha|TEXT|ISO 8601|
|estado|TEXT|pendiente, en_revision, aprobada, rechazada, cancelada o<br>finalizada|
|comentario|TEXT|Entre 10 y 500 caracteres (se valida en la API)|



## **2. Relaciones** 

Un ANIMAL puede tener muchas SOLICITUDES. Un USUARIO con rol adoptante puede tener muchas SOLICITUDES. Cada SOLICITUD pertenece a un ANIMAL y a un USUARIO. 

Cardinalidad: ANIMAL 1 a N SOLICITUD, USUARIO 1 a N SOLICITUD. 

## **3. Estados** 

### **3.1 Estados del animal** 

disponible, apartado, adoptado. Retirar un animal no crea un estado nuevo: pone activo = 0. 

### **3.2 Estados de la solicitud** 

pendiente, en_revision, aprobada, rechazada, cancelada, finalizada. Una solicitud es activa si está en pendiente, en_revision o aprobada. 

## **4. Reglas de negocio que el modelo protege** 

1. Solo una solicitud aprobada por animal (índice único parcial). 

2. Un adoptante no puede tener dos solicitudes activas para el mismo animal (índice único parcial). 

3. Un animal con estado apartado o adoptado no recibe nuevas solicitudes (validación en la API). 

4. Retirar un animal no borra sus solicitudes (activo = 0). 

## **5. Esquema SQL (SQLite)** 

CREATE TABLE usuarios ( id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, correo TEXT NOT NULL UNIQUE, telefono TEXT, password_hash TEXT NOT NULL, rol TEXT NOT NULL CHECK (rol IN ('adoptante', 'fundacion')), fecha_registro TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)) ); 

CREATE TABLE animales ( id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, especie TEXT NOT NULL CHECK (especie IN ('perro', 'gato', 'otro')), especie_otra TEXT, raza TEXT, edad INTEGER NOT NULL CHECK (edad BETWEEN 0 AND 30), sexo TEXT NOT NULL CHECK (sexo IN ('macho', 'hembra')), descripcion TEXT, personalidad TEXT, bueno_con_ninos INTEGER CHECK (bueno_con_ninos IN (0, 1)), bueno_con_perros INTEGER CHECK (bueno_con_perros IN (0, 1)), bueno_con_gatos INTEGER CHECK (bueno_con_gatos IN (0, 1)), foto TEXT, estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'apartado', 'adoptado')), fecha_registro TEXT NOT NULL, activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)) ); 

CREATE TABLE solicitudes ( id INTEGER PRIMARY KEY AUTOINCREMENT, animal_id INTEGER NOT NULL REFERENCES animales(id), usuario_id INTEGER NOT NULL REFERENCES usuarios(id), fecha TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'cancelada', 'finalizada')), comentario TEXT NOT NULL ); -- Un adoptante no puede tener dos solicitudes activas para el mismo animal CREATE UNIQUE INDEX uq_solicitud_activa ON solicitudes (animal_id, usuario_id) WHERE estado IN ('pendiente', 'en_revision', 'aprobada'); -- Solo una solicitud aprobada por animal CREATE UNIQUE INDEX uq_una_aprobada_por_animal ON solicitudes (animal_id) 

WHERE estado = 'aprobada'; 

