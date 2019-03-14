FROM node:8.15.0-jessie

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
COPY jest.config.js ./
COPY wait-for-it.sh ./

#COPY jest/* ./jest/
#COPY .eslintrc.json ./

RUN npm i
