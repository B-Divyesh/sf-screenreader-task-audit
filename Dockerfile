FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY frontend ./frontend
ARG BUILD_SHA=dev
ENV VITE_BUILD_SHA=$BUILD_SHA
RUN npm run build

FROM rust:1-alpine AS backend
WORKDIR /app
RUN apk add --no-cache musl-dev
COPY Cargo.toml Cargo.lock* ./
COPY src/main.rs ./src/main.rs
ARG BUILD_SHA=dev
RUN cargo build --release

FROM alpine:3.22
RUN addgroup -S app && adduser -S -G app app && mkdir -p /app/data && chown -R app:app /app
WORKDIR /app
COPY --from=backend /app/target/release/screenreader-task-audit /app/server
COPY --from=frontend /app/dist /app/dist
USER app
ENV PORT=8080 DATA_DIR=/app/data
EXPOSE 8080
ARG BUILD_SHA=dev
ENV BUILD_SHA=$BUILD_SHA
CMD ["/app/server"]
