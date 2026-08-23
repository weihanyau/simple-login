# --- Build stage ---
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG PUBLIC_API_URL=http://localhost:3001
ENV PUBLIC_API_URL=$PUBLIC_API_URL

COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 4321

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4321"]
