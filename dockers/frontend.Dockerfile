FROM node:18-alpine

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ .

ARG VITE_API_URL=http://localhost:5007
ENV VITE_API_URL=$VITE_API_URL

EXPOSE 5007

CMD ["npm", "run", "dev"]
