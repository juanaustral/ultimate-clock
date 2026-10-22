'use strict';
// Administración de cuentas (la hace Juan en el servidor, no la app):
//   UC_DB=/ruta/db.sqlite node server/cuentas.js crear Mendoza
//   UC_DB=/ruta/db.sqlite node server/cuentas.js clave Mendoza
// La contraseña se pide por la terminal (sin eco) o se lee de la variable UC_CLAVE;
// nunca por argumento, para que no quede en el historial del shell.
const readline = require('node:readline');
const { abrir } = require('./db');
const auth = require('./auth');

function pedirClave() {
  if (process.env.UC_CLAVE) return Promise.resolve(process.env.UC_CLAVE);
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = () => {};
    process.stdout.write('Contraseña: ');
    rl.question('', (c) => { rl.close(); process.stdout.write('\n'); resolve(c); });
  });
}

(async () => {
  const [orden, usuario] = process.argv.slice(2);
  if (!['crear', 'clave'].includes(orden) || !usuario) {
    console.error('Uso: node server/cuentas.js crear|clave <usuario>');
    process.exit(2);
  }
  const db = abrir(process.env.UC_DB || './ultimate-clock.sqlite');
  const clave = await pedirClave();
  try {
    if (orden === 'crear') auth.crearCuenta(db, usuario, clave);
    else auth.cambiarClave(db, usuario, clave);
    console.log(orden === 'crear' ? 'Cuenta creada: ' + usuario : 'Contraseña cambiada (sesiones cerradas): ' + usuario);
  } catch (e) {
    console.error('Error: ' + e.message);
    process.exit(1);
  }
})();
