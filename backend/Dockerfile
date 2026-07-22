# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY backend/package.json ./backend/
COPY database/prisma ./database/prisma
WORKDIR /app/backend
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY database ./database
WORKDIR /app/backend
RUN npx prisma generate --schema ../database/prisma/schema.prisma
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json ./
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/database ./database
EXPOSE 4000
CMD ["node", "dist/server.js"]
