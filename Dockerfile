FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
