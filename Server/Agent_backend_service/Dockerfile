FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Assumes this service has a Prisma schema at ./prisma/schema.prisma.
# If it does not use Prisma, remove this line.
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV AGENT_SERVICE_PORT=4000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
# The schema uses a custom Prisma client output path, imported by compiled code.
COPY --from=build /app/src/generated/prisma-client ./dist/src/generated/prisma-client

USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]
