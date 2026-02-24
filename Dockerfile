FROM node:18

WORKDIR /usr/src/app

# 1. Copiamos archivos de dependencias
COPY package*.json ./

# 2. Copiamos la carpeta prisma ANTES de instalar 
# Esto es vital para que 'prisma generate' encuentre el esquema
COPY prisma ./prisma/

# 3. Instalamos dependencias (ahora sí encontrará el schema.prisma)
RUN npm install

# 4. Copiamos el resto del código
COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]