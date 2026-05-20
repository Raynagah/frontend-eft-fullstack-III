# Usamos una imagen ligera de Node.js
FROM node:20-alpine

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias primero (para aprovechar la caché de Docker)
COPY package*.json ./

# Instalamos las dependencias
RUN npm install

# Copiamos el resto del código del frontend
COPY . .

# Comando por defecto al levantar el contenedor (corre las pruebas una sola vez)
CMD ["npx", "vitest", "run"]