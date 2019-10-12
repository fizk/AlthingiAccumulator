FROM node:10.16.3-buster-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY utils/wait-for-it.sh ./

RUN npm i
