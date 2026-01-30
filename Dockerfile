FROM node:22-slim AS client-build
WORKDIR /app
COPY client/package*.json client/
RUN npm --prefix client ci
COPY client/ client/
RUN npm --prefix client run build

FROM node:22-slim AS server
WORKDIR /app
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
COPY server/package*.json server/
RUN npm --prefix server ci --omit=dev
COPY server/ server/
COPY --from=client-build /app/client/dist /app/client/dist

ENV NODE_ENV=production
ENV SERVE_CLIENT=true
EXPOSE 2567
CMD ["npm", "--prefix", "server", "start"]
