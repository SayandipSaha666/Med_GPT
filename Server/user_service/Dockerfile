FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Assumes this service has a Prisma schema at ./prisma/schema.prisma.
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV USER_SERVICE_PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
# The schema uses a custom Prisma client output path, imported by compiled code.
COPY --from=build /app/src/generated/prisma-client ./dist/src/generated/prisma-client

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
