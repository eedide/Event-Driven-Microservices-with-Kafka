FROM node:14
RUN mkdir /appact
WORKDIR /appact
#Production image
#ENV NODE_ENV=production
COPY package.json ./
RUN npm install
COPY . ./
VOLUME [ "/appact/node_modules" ]
CMD ["npm", "start"]