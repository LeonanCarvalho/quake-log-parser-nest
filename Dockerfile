# --- Builder ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci
COPY . .

RUN npx prisma generate

RUN npm run build

# --- Runner ---
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma/dev.db ./prisma/

EXPOSE 3000

CMD ["node", "dist/main"]