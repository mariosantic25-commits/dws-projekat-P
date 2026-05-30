FROM node:18-alpine

WORKDIR /app

RUN npm install -g json-server

COPY db.json .

EXPOSE 5000

CMD ["json-server", "--watch", "db.json", "--port", "5000", "--host", "0.0.0.0"]