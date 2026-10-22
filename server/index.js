'use strict';
// Arranque: UC_DB (archivo SQLite), UC_PORT (8590), UC_HOST (127.0.0.1; en el contenedor 0.0.0.0), UC_PREFIJO (/api).
const http = require('node:http');
const { abrir } = require('./db');
const { crearManejador } = require('./app');

const db = abrir(process.env.UC_DB || './ultimate-clock.sqlite');
const servidor = http.createServer(crearManejador(db, { prefijo: process.env.UC_PREFIJO || '/api' }));
servidor.listen(Number(process.env.UC_PORT || 8590), process.env.UC_HOST || '127.0.0.1', () => {
  console.log('Ultimate Clock API escuchando en ' + servidor.address().address + ':' + servidor.address().port);
});
