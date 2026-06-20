FROM node:22-bookworm-slim

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

RUN mkdir -p /app/uploads

EXPOSE 5000

CMD ["npm", "start"]
