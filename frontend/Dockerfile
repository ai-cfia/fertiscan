FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Use a minimal runtime image without npm to reduce the vulnerability surface.
FROM gcr.io/distroless/nodejs24-debian12 AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD [".output/server/index.mjs"]
