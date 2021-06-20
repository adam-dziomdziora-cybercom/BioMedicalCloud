# PHASE BUILD
FROM node:14-alpine as build-step
WORKDIR /app
EXPOSE 80

COPY package.json /app/package.json
RUN npm install -g @angular/cli
RUN npm install

COPY . /app
RUN npm run build
CMD npm run build

#PHASE SERVE
FROM nginx:1.21.0-alpine
COPY --from=build-step /app/dist/bio-medical-cloud /usr/share/nginx/html
