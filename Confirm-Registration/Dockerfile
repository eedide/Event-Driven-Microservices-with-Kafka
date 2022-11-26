FROM node:14
RUN mkdir /appdev
WORKDIR /appdev
#Production image
#ENV NODE_ENV=production
COPY package.json ./
RUN npm install
COPY . ./
VOLUME [ "/appdev/node_modules" ]
CMD ["npm", "start"]