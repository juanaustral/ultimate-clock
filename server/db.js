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
CREATE TABLE IF NOT EXISTS registros (
  cuenta_id INTEGER NOT NULL REFERENCES cuentas(id),
  tabla TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT,
  version INTEGER NOT NULL,
  dispositivo TEXT NOT NULL,
  actualizado INTEGER NOT NULL,
  borrado INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (cuenta_id, tabla, id)
);
CREATE TABLE IF NOT EXISTS cambios (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  cuenta_id INTEGER NOT NULL,
  tabla TEXT NOT NULL,
  id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS cambios_cuenta ON cambios(cuenta_id, seq);
CREATE TABLE IF NOT EXISTS aplicados (
  cuenta_id INTEGER NOT NULL,
  cambio TEXT NOT NULL,
  PRIMARY KEY (cuenta_id, cambio)
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
