FROM node:24-alpine
WORKDIR /app
COPY server/*.js ./server/
RUN mkdir -p /data && chown node:node /data
ENV UC_DB=/data/ultimate-clock.sqlite UC_PORT=8590 UC_HOST=0.0.0.0 UC_PREFIJO=/ultimateclock/api
EXPOSE 8590
USER node
CMD ["node", "server/index.js"]
