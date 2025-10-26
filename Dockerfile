# ---------------------------------
# ETAPA 1: Compilación (Builder)
# ---------------------------------
# Usamos la imagen oficial de Bun
FROM oven/bun:latest AS builder

# Establecemos el directorio de trabajo
WORKDIR /usr/src/app

# Copiamos package.json y bun.lock (el lockfile de Bun)
COPY package.json bun.lock ./

# Instalamos TODAS las dependencias para poder compilar
RUN bun install

# Copiamos el resto del código fuente
COPY . .

# Compilamos la aplicación para producción
RUN bun run build

# ---------------------------------
# ETAPA 2: Producción (Final)
# ---------------------------------
# Empezamos desde una nueva imagen base limpia
FROM oven/bun:latest AS production

WORKDIR /usr/src/app

# Copiamos los archivos de paquetes
COPY package.json bun.lock ./

# Instalamos SOLAMENTE las dependencias de producción
# --production: Omite devDependencies
# --frozen-lockfile: Falla si el package.json no coincide con el lockfile (equivalente a 'npm ci')
RUN bun install --production --frozen-lockfile

# Copiamos la carpeta 'dist' (el JS compilado) desde la etapa 'builder'
COPY --from=builder /usr/src/app/dist ./dist

# Exponemos el puerto en el que corre NestJS (usualmente 3000)
EXPOSE 3000

# El comando para iniciar la aplicación usando el runtime de Bun
CMD ["bun", "dist/main.js"]
