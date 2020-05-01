FROM node:10-alpine

RUN apk --no-cache add ffmpeg git python make gcc g++
WORKDIR /usr/app

ENV PATH /usr/app/node_modules/.bin:$PATH
ENV NODE_ENV production
COPY package*.json /usr/app/
RUN npm ci
COPY . /usr/app

CMD [ "npm", "start" ]