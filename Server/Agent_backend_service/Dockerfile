FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Assumes this service has a Prisma schema at ./prisma/schema.prisma.
# If it does not use Prisma, remove this line.
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV AGENT_SERVICE_PORT=4000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
# Safe when the build stage generated Prisma client files.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]
