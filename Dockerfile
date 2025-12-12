FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
