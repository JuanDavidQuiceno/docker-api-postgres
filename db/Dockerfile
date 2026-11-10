# Imagen base oficial de MySQL con versión fija (no "latest")
FROM mysql:8.4.3

# Scripts de inicialización: MySQL los ejecuta al crear la base por primera vez
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql

# Las credenciales (MYSQL_ROOT_PASSWORD, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD)
# se inyectan como variables de entorno desde docker-compose / .env, nunca en la imagen.

# Los datos se guardan en este directorio, que se monta como volumen
VOLUME ["/var/lib/mysql"]

EXPOSE 3306
