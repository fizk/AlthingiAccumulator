FROM node:10.16.3-buster-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY wait-for-it.sh ./

#COPY jest/* ./jest/
#COPY .eslintrc.json ./

RUN npm i
