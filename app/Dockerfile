# Imagen base oficial con versión fija (no "latest")
FROM node:22.11-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar primero los manifiestos para aprovechar la caché de capas
COPY package.json package-lock.json ./

# Instalar solo dependencias de producción, de forma reproducible
RUN npm ci --omit=dev && npm cache clean --force

# Copiar el código fuente
COPY src ./src

ENV NODE_ENV=production \
    PORT=3000

# Ejecutar como usuario sin privilegios (incluido en la imagen oficial)
USER node

# Puerto expuesto por la API
EXPOSE 3000

# Comando de inicio
CMD ["node", "src/index.js"]
