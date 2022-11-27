FROM node:14
WORKDIR /app
#Production image
#ENV NODE_ENV=production
COPY package.json .
RUN npm install
COPY . ./
VOLUME [ "/app/node_modules" ]
CMD ["npm", "start"]