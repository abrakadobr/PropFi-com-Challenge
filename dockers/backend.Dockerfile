FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm install

COPY backend/ .

EXPOSE 5007

CMD ["npm", "start"]
