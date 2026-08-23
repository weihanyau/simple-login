# --- Build stage ---
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG PUBLIC_API_URL=http://localhost:3001
ENV PUBLIC_API_URL=$PUBLIC_API_URL
RUN echo "[debug] building frontend with PUBLIC_API_URL=$PUBLIC_API_URL"

COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
# needed at runtime so preview picks up ALLOWED_HOSTS
COPY --from=build /app/astro.config.mjs ./astro.config.mjs

EXPOSE 4321

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4321"]
