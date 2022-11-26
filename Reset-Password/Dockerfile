FROM node:14
RUN mkdir /appresetpw
WORKDIR /appresetpw
#Production image
#ENV NODE_ENV=production
COPY package.json ./
RUN npm install
COPY . ./
VOLUME [ "/appresetpw/node_modules" ]
CMD ["npm", "start"]