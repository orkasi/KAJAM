FROM node:20-slim AS client-build
WORKDIR /app
COPY client/package*.json client/
RUN npm --prefix client ci
COPY client/ client/
RUN npm --prefix client run build

FROM node:20-slim AS server
WORKDIR /app
COPY server/package*.json server/
RUN npm --prefix server ci --omit=dev
COPY server/ server/
COPY --from=client-build /app/client/dist /app/client/dist

ENV NODE_ENV=production
ENV SERVE_CLIENT=true
EXPOSE 2567
CMD ["npm", "--prefix", "server", "start"]
