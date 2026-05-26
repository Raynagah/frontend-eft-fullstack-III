# Usa una imagen oficial y ligera de Node.js
FROM node:20-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia primero los archivos de dependencias para aprovechar la caché de Docker
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código fuente del proyecto
COPY . .

# Expone el puerto por defecto de Vite
EXPOSE 5173

# Comando para iniciar el servidor de desarrollo.
# El flag "--host" es OBLIGATORIO en Vite dentro de Docker para exponer la red hacia tu navegador local.
CMD ["npm", "run", "dev", "--", "--host"]
