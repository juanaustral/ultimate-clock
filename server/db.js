'use strict';
// SQLite embebido en Node (node:sqlite): sin dependencias externas.
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS cuentas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT NOT NULL UNIQUE COLLATE NOCASE,
  hash TEXT NOT NULL,
  creada INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cuenta_id INTEGER NOT NULL REFERENCES cuentas(id),
  token_hash TEXT NOT NULL UNIQUE,
  creada INTEGER NOT NULL,
  vence INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS intentos (
  usuario TEXT NOT NULL COLLATE NOCASE,
  momento INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS intentos_usuario ON intentos(usuario, momento);
`;

function abrir(ruta) {
  const db = new DatabaseSync(ruta);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

module.exports = { abrir };
