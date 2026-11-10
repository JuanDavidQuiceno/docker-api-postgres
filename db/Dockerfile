# Imagen base oficial de PostgreSQL con versión fija (no "latest")
FROM postgres:16.4-alpine

# Scripts de inicialización: PostgreSQL los ejecuta al crear la base por primera vez
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql

# Las credenciales (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB) se inyectan
# como variables de entorno desde docker-compose / .env, nunca en la imagen.

# Los datos se guardan en este directorio, que se monta como volumen
VOLUME ["/var/lib/postgresql/data"]

EXPOSE 5432
