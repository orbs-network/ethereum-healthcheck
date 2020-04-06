FROM node:13-alpine

ARG ETHEREUM_ENDPOINT

ADD . /opt/orbs/

WORKDIR /opt/orbs

RUN npm install

CMD node server.js