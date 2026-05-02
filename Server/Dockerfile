FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all backend code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose backend port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
