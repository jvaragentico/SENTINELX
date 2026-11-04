FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN ./node_modules/.bin/esbuild scripts/worker.ts --bundle --platform=node --format=esm --outfile=worker.mjs
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/worker.mjs ./worker.mjs
EXPOSE 3000
CMD ["npm","start"]
