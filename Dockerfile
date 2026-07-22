FROM node:24-alpine AS build
WORKDIR /app
ARG COMMIT_SHA=dev
ENV VITE_COMMIT_SHA=$COMMIT_SHA
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html/pwa_app
COPY nginx.pwa.conf /etc/nginx/conf.d/default.conf
