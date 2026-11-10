# docker-api-postgres

[![Docker CI](https://github.com/JuanDavidQuiceno/docker-api-postgres/actions/workflows/docker-ci.yml/badge.svg)](https://github.com/JuanDavidQuiceno/docker-api-postgres/actions/workflows/docker-ci.yml)

Proyecto de la Entrega 1 (Escenario 3) de Integración Continua: dos contenedores Docker que se comunican entre sí dentro de una red propia, orquestados con Docker Compose y construidos automáticamente con GitHub Actions.

| Servicio | Rol | Imagen base | Puerto |
|----------|-----|-------------|--------|
| `app` | API REST (Node.js + Express) | `node:22.11-alpine` | `3000` (publicado) |
| `db`  | Base de datos MySQL con volumen | `mysql:8.4.3` | `3306` (solo red interna) |

## Arquitectura

```
          Usuario / curl
                │  http://localhost:3000
                ▼
┌──────────────────── red Docker: notes_net (bridge) ────────────────────┐
│                                                                         │
│   ┌──────────────────────┐   host "db":3306   ┌──────────────────────┐ │
│   │ app (notes-app)      │ ─────────────────▶ │ db (notes-db)        │ │
│   │ Node.js 22 + Express │ ◀───────────────── │ MySQL 8.4            │ │
│   └──────────────────────┘     resultados     └──────────┬───────────┘ │
│                                                          │             │
└──────────────────────────────────────────────────────────┼─────────────┘
                                                           ▼
                                               volumen: notes_db_data
```

La app se conecta a la base de datos usando el **nombre del servicio** (`DB_HOST=db`), que Docker resuelve con su DNS interno. No se usa `localhost` ni una IP fija.

## Estructura

```
.
├── .github/workflows/docker-ci.yml   # Pipeline de CI (GitHub Actions)
├── app/                              # Contenedor 1: API
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json / package-lock.json
│   ├── .env.example                  # Variables para correr la API en local sin Docker
│   └── src/
│       ├── index.js                  # Rutas /health y /notes
│       └── db.js                     # Conexión a MySQL por variables de entorno
├── db/                               # Contenedor 2: base de datos
│   ├── Dockerfile
│   ├── .dockerignore
│   └── init.sql                      # Crea la tabla notes
├── docker-compose.yml                # Orquestación: red, volumen, variables, depends_on
├── .env.example                      # Plantilla de variables (el .env real NO se sube)
└── README.md
```

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose v2)

## Cómo levantar el proyecto

```bash
# 1. Clonar el repositorio
git clone https://github.com/JuanDavidQuiceno/docker-api-postgres.git
cd docker-api-postgres

# 2. Crear el archivo de variables y cambiar la contraseña
cp .env.example .env

# 3. Construir y levantar los dos contenedores
docker compose up --build -d

# 4. Ver los contenedores en ejecución
docker ps
```

Para apagar todo:

```bash
docker compose down        # conserva los datos del volumen
docker compose down -v     # borra también el volumen
```

## Ejecutar la API en local (sin Docker)

La conexión a la base de datos se configura con variables de entorno:

| Variable | Docker (`docker-compose.yml`) | Local (`app/.env`) |
|----------|-------------------------------|--------------------|
| `DB_HOST` | `db` (nombre del servicio, fijo) | `127.0.0.1` u otro host |
| `DB_PORT` | `3306` | `3306` |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | desde el `.env` de la raíz | los de tu MySQL local |

Necesitas Node.js 22 y un MySQL al que puedas conectarte. Por ejemplo, con Homebrew:

```bash
brew install mysql && brew services start mysql
mysql -u root -e "CREATE DATABASE notes_db; CREATE USER 'notes_user'@'localhost' IDENTIFIED BY 'tu_clave'; GRANT ALL ON notes_db.* TO 'notes_user'@'localhost';"
mysql -u root notes_db < db/init.sql
```

Luego:

```bash
cd app
cp .env.example .env      # ajusta DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
npm install
npm run start:local       # o: npm run dev (se reinicia al guardar cambios)
```

`app/.env` tampoco se sube al repositorio.

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/health` | Estado de la API y de la conexión con `db` |
| `POST` | `/notes`  | Guarda una nota: `{"text": "..."}` |
| `GET`  | `/notes`  | Lista las notas guardadas |

## Prueba de comunicación (ida y vuelta)

```bash
# Estado: muestra db_host = "db", la versión y la hora devueltas por MySQL
curl http://localhost:3000/health

# Ida: guardar un dato en la base de datos a través de la API
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -d '{"text":"Hola desde el contenedor app"}'

# Vuelta: leer los datos guardados
curl http://localhost:3000/notes
```

Verificar el dato directamente dentro del contenedor de base de datos:

```bash
docker exec -it notes-db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -e "SELECT * FROM notes;"'
```

Comprobar que la app resuelve el nombre del servicio `db` dentro de la red:

```bash
docker exec notes-app getent hosts db
```

## Comandos para las evidencias

```bash
docker build -t notes-app:1.0.0 ./app        # Construir la imagen de la app
docker build -t notes-db:1.0.0 ./db          # Construir la imagen de la base de datos
docker compose up --build                    # Levantar los servicios
docker ps                                    # Contenedores en ejecución
docker network inspect notes_net             # Red y contenedores conectados
docker volume inspect notes_db_data          # Volumen de datos
docker compose logs app                      # Log: "Conectado a MySQL en db:3306"
```

## Buenas prácticas y seguridad

- Imágenes base oficiales con versión fija (sin `latest`).
- `.dockerignore` en cada servicio para no copiar `node_modules`, `.env` ni `.git` a las imágenes.
- Credenciales solo en `.env`, que está en `.gitignore`. Se versiona `.env.example` sin secretos.
- Ningún secreto en el código: la app lee la conexión desde variables de entorno.
- La app corre con el usuario sin privilegios `node`.
- La base de datos no publica puertos al host: solo es accesible dentro de la red `notes_net`.
- `depends_on` con `healthcheck` (`mysqladmin ping`) para que la app arranque cuando la base esté lista.

## Integración continua

El workflow [`.github/workflows/docker-ci.yml`](.github/workflows/docker-ci.yml) se ejecuta en cada push y pull request:

1. Crea un `.env` temporal con una contraseña aleatoria.
2. Valida el `docker-compose.yml`.
3. Construye las imágenes de `app` y `db`.
4. Levanta los contenedores con `docker compose up --wait`.
5. Guarda y lee una nota a través de la API y verifica la respuesta.
6. Apaga los contenedores y borra el volumen.
