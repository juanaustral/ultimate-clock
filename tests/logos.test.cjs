const test = require('node:test');
const assert = require('node:assert/strict');
const X = require('../xlsx.js');
const S = require('../tournament-sheet.js');
const TN = require('../tournament.js');

/* PNG de 2×2 píxeles. */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAA6UlEQVR42u2Z0Q3CMAxEW6tTAD+dBokdGIMpGIMdWAcJVczRCYpix3Zs+fIb6Xwvdmornc/X75R50ZR8AQAA1QEWC9HteT/aujxeurFmxc/oH992JAoALN/qJDTWfb+CPAP91lVSQUHcizUpiHuxMsVxL9OnUO4FUSqNEj7Hz42VPgOtfYB1/Kfb52jr9151OwPG6RQAnteXGxclBAAAACABgPpTAjpxwWHOvx831m2lEvK8yu2xil1inySwopCpurV7YQnZMQiUyS2SkWbv87pKc+g5DhoYW0UBf2iYJKH/kWEaBQAABqwddR1VAX7FeaEAAAAASUVORK5CYII=', 'base64');
const tour = () => ({ name: 'Copa', format: 'rr', teams: [
  { id: 'a', name: 'Pumas', color: '#1b47e2', players: [{ id: 'p1', name: 'Ana', number: '7' }] },
  { id: 'b', name: 'Toros', color: '#d4282c', players: [] }] });

test('xlsx: una imagen incrustada se escribe y se vuelve a leer idéntica, con su celda', async () => {
  const bytes = X.write([{ name: 'Uno', rows: [['x']], images: [{ col: 3, row: 2, width: 96, height: 96, ext: 'png', data: new Uint8Array(PNG) }] }, { name: 'Dos', rows: [['y']] }]);
  const sheets = await X.read(bytes);
  assert.equal(sheets[0].images.length, 1);
  assert.deepEqual([sheets[0].images[0].col, sheets[0].images[0].row, sheets[0].images[0].ext], [3, 2, 'png']);
  assert.ok(Buffer.from(sheets[0].images[0].data).equals(PNG));
  assert.equal(sheets[1].images.length, 0);
  assert.equal(sheets[0].rows[0][0], 'x');
});

test('plantilla de torneo: el logo de cada equipo viaja en su hoja y se recupera al importar', async () => {
  const bytes = X.write(S.template({ tournament: tour(), logos: { a: { ext: 'png', data: new Uint8Array(PNG) } } }));
  const parsed = S.parse(await X.read(bytes));
  const pumas = parsed.teams.find(t => t.name === 'Pumas'), toros = parsed.teams.find(t => t.name === 'Toros');
  assert.ok(Buffer.from(pumas.image.data).equals(PNG));
  assert.equal(toros.image, undefined);
  const dest = tour(); pumas.logo = 'data:image/webp;base64,AAAA';
  S.applyToTournament(dest, parsed);
  assert.equal(dest.teams[0].logo, 'data:image/webp;base64,AAAA');
  assert.equal(dest.teams[1].logo, undefined);
});

test('cleanLogo solo acepta imágenes embebidas chicas', () => {
  assert.equal(TN.cleanLogo('data:image/png;base64,AAAA'), 'data:image/png;base64,AAAA');
  assert.equal(TN.cleanLogo('https://x.com/a.png'), '');
  assert.equal(TN.cleanLogo('data:image/svg+xml;base64,AAAA'), '');
  assert.equal(TN.cleanLogo('data:image/png;base64,' + 'A'.repeat(TN.LOGO_MAX)), '');
  const clean = TN.sanitize({ name: 'T', teams: [{ id: 't1', name: 'Uno', color: '#112233', logo: 'javascript:alert(1)', players: [] }, { id: 't2', name: 'Dos', color: '#112233', logo: 'data:image/png;base64,AAAA', players: [] }] });
  assert.equal(clean.teams[0].logo, undefined);
  assert.equal(clean.teams[1].logo, 'data:image/png;base64,AAAA');
});
