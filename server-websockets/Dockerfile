FROM node:16
WORKDIR ./
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 9000
CMD ["npm", "start"]