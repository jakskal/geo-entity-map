# Stage 1: build the static app.
FROM node:26.13.0-alpine3.24 AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve it with nginx, which also forwards /api to the backend.
FROM nginx:1.29.3-alpine3.22
# Where /api requests go; override to point at a different backend.
ENV BACKEND_URL=http://backend:8080
# The nginx image runs envsubst on /etc/nginx/templates/*.template at start
# and writes the result to /etc/nginx/conf.d/. Only BACKEND_URL is substituted.
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
