'use strict';
// Arranque: UC_DB (ruta del archivo SQLite), UC_PORT (por defecto 8590), UC_PREFIJO (por defecto /api).
const http = require('node:http');
const { abrir } = require('./db');
const { crearManejador } = require('./app');

const db = abrir(process.env.UC_DB || './ultimate-clock.sqlite');
const servidor = http.createServer(crearManejador(db, { prefijo: process.env.UC_PREFIJO || '/api' }));
servidor.listen(Number(process.env.UC_PORT || 8590), '127.0.0.1', () => {
  console.log('Ultimate Clock API escuchando en 127.0.0.1:' + servidor.address().port);
});
