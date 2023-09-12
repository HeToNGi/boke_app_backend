FROM node:16

WORKDIR /app

COPY package.json .
COPY . .

RUN npm install
# RUN npm run build

EXPOSE 8080

CMD ["node", "index.js"]