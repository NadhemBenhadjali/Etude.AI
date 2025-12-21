# gateway/Dockerfile

# ---- Build Angular ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps (cache-friendly)
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install

# Build
COPY frontend/ .
RUN npm run build -- --configuration production

# Normalize output into /out (supports Angular builders that produce /browser)
RUN mkdir -p /out && \
    if [ -d "dist/ains/browser" ]; then cp -r dist/ains/browser/* /out/; else cp -r dist/ains/* /out/; fi

# ---- Nginx runtime ----
FROM nginx:1.27-alpine
COPY gateway/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /out/ /usr/share/nginx/html/
