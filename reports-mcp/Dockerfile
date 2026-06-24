FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy only the compiled output and dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=3015

EXPOSE 3015

CMD ["node", "dist/index.js"]
