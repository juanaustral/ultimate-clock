/* Ultimate Clock · plantilla de Excel del torneo. Lógica pura (sin DOM).
   Formato: una hoja INSTRUCCIONES, una hoja TORNEO (nombre y tipo de fixture) y una hoja por equipo
   (nombre, color y jugadores: número de camiseta opcional y nombre). También se acepta una sola hoja con columnas
   Equipo · Número · Jugador, como la que exporta un formulario. La lectura busca los títulos, no posiciones fijas. */
(function (root) {
  'use strict';
  const TN = root.UCTournament || (typeof require !== 'undefined' ? require('./tournament.js') : null);
  const PLAYER_ROWS = 60, TEMPLATE_TEAMS = 8, HEAD_ROW = 7;
  /* Colores con nombre (es / en). En la planilla también vale un código como #1B47E2. */
  const COLORS = [
    ['Azul', 'Blue', '#1b47e2'], ['Naranja', 'Orange', '#f59e0b'], ['Verde', 'Green', '#16a34a'], ['Rojo', 'Red', '#c62525'],
    ['Negro', 'Black', '#16171b'], ['Blanco', 'White', '#ffffff'], ['Amarillo', 'Yellow', '#facc15'], ['Violeta', 'Purple', '#7c3aed'],
    ['Rosa', 'Pink', '#ec4899'], ['Celeste', 'Light blue', '#38bdf8'], ['Gris', 'Grey', '#6b7280'], ['Bordó', 'Maroon', '#7f1d1d'],
    ['Azul marino', 'Navy', '#1e3a8a'], ['Turquesa', 'Teal', '#14b8a6'], ['Verde oscuro', 'Dark green', '#14532d'], ['Verde lima', 'Lime', '#84cc16'],
    ['Menta', 'Mint', '#86efac'], ['Dorado', 'Gold', '#ca8a04'], ['Marrón', 'Brown', '#78350f'], ['Beige', 'Beige', '#d6c7a1'],
    ['Salmón', 'Salmon', '#fda4af'], ['Fucsia', 'Fuchsia', '#c026d3'], ['Lila', 'Lilac', '#a78bfa'], ['Gris claro', 'Light grey', '#d1d5db']
  ];
  /* Texto legible sobre un color de fondo. */
  const inkOn = hex => { const h = hex.replace('#', ''), n = parseInt(h, 16), l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)); return l > 150 ? '#16171b' : '#ffffff'; };
  const fold = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const isHex = v => /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v).trim());
  function colorFromText(value) {
    const v = String(value ?? '').trim();
    if (!v) return null;
    if (isHex(v)) { const h = v.replace('#', ''); return '#' + (h.length === 3 ? h.split('').map(c => c + c).join('') : h).toLowerCase(); }
    const f = fold(v);
    const hit = COLORS.find(c => fold(c[0]) === f || fold(c[1]) === f || (f === 'bordo' && c[0] === 'Bordó') || (f === 'morado' && c[0] === 'Violeta') || (f === 'verde claro' && c[0] === 'Menta') || (f === 'dark blue' && c[0] === 'Azul marino') || (f === 'azul oscuro' && c[0] === 'Azul marino') || (f === 'cyan' && c[0] === 'Celeste'));
    return hit ? hit[2] : undefined;
  }
  const colorLabel = (hex, lang) => { const c = COLORS.find(x => x[2] === String(hex).toLowerCase()); return c ? c[lang === 'en' ? 1 : 0] : String(hex || '').toUpperCase(); };

  /* ---------- Plantilla ---------- */
  /* tournament (opcional): se precargan su nombre, tipo y equipos para completar o corregir. */
  function template({ t = s => s, lang = 'es', tournament = null } = {}) {
    const tr = (s, v) => (v ? t(s, v) : t(s));
    const typeLabels = [tr('Todos contra todos'), tr('Eliminación simple')];
    const colorNames = COLORS.map(c => c[lang === 'en' ? 1 : 0]);
    const colorsSheetName = tr('COLORES');
    const colorsRef = `'${colorsSheetName.replace(/'/g, "''")}'!$B$5:$B$${4 + COLORS.length}`;
    /* La celda del color se pinta sola con el color elegido. */
    const colorRules = COLORS.map(c => ({ text: c[lang === 'en' ? 1 : 0], fill: c[2], font: inkOn(c[2]) }));
    const steps = [
      tr('Hoja TORNEO: escribí el nombre del torneo y elegí el tipo de fixture.'),
      tr('Cada hoja EQUIPO es un equipo: nombre, color y sus jugadores, uno por fila. El número de camiseta es opcional.'),
      tr('Completá solo las celdas amarillas. No cambies los títulos. A la derecha de cada celda amarilla hay una flecha ← que dice qué poner.'),
      tr('Para elegir el color: tocá la celda del color y abrí la lista con la flecha ▼. La celda se pinta del color que elegiste. La hoja COLORES muestra todos.'),
      tr('¿Más equipos? Copiá una hoja de equipo: clic derecho en la pestaña → Mover o copiar → Crear una copia. Las hojas de equipo vacías se ignoran.'),
      tr('Guardá el archivo como Excel (.xlsx). En Google Sheets: Archivo → Descargar → Microsoft Excel.'),
      tr('En Ultimate Clock: MENU → VER TORNEO → IMPORTAR EXCEL, y elegí este archivo.')
    ];
    const guide = {
      name: tr('INSTRUCCIONES'), tabColor: '#0f8a3c', cols: [6, 90],
      merges: ['A1:B1', 'A2:B2', 'A4:B4', `A${6 + steps.length}:B${6 + steps.length}`, `A${10 + steps.length}:B${10 + steps.length}`],
      rows: [
        { ht: 40, cells: [{ v: tr('ULTIMATE CLOCK · PLANTILLA DE TORNEO'), s: 'title' }, { s: 'title' }] },
        { ht: 22, cells: [{ v: tr('Completá este archivo y después importalo en la app. Así se cargan todos los equipos y jugadores de una vez.'), s: 'note' }] },
        [],
        { ht: 24, cells: [{ v: tr('CÓMO SE USA'), s: 'subtitle' }] },
        [],
        ...steps.map((s, i) => ({ ht: 40, cells: [{ v: i + 1, s: 'number' }, { v: s, s: 'text' }] })),
        { ht: 24, cells: [{ v: tr('TIPOS DE FIXTURE'), s: 'subtitle' }] },
        { ht: 34, cells: [{ v: '⇄', s: 'number' }, { v: `${typeLabels[0]}: ${tr('cada equipo juega una vez contra cada uno; gana el que suma más puntos.')}`, s: 'text' }] },
        { ht: 34, cells: [{ v: '⇥', s: 'number' }, { v: `${typeLabels[1]}: ${tr('cuadro de llaves; el que pierde queda afuera hasta llegar a la final.')}`, s: 'text' }] },
        [],
        { ht: 24, cells: [{ v: tr('COLORES'), s: 'subtitle' }] },
        { ht: 34, cells: [{ v: '●', s: 'number' }, { v: tr('Hay 24 colores en la hoja COLORES, cada uno con su muestra. También podés escribir un código como #1B47E2.'), s: 'text' }] }
      ]
    };
    const colorsSheet = {
      name: colorsSheetName, tabColor: '#ec4899', cols: [12, 24, 14], merges: ['A1:C1', 'A2:C2'],
      rows: [
        { ht: 40, cells: [{ v: tr('COLORES'), s: 'title' }, { s: 'title' }, { s: 'title' }] },
        { ht: 34, cells: [{ v: tr('Estos son los colores que se pueden elegir en la celda Color de cada equipo. No hace falta completar nada acá.'), s: 'note' }] },
        [],
        { ht: 26, cells: [{ v: tr('Muestra'), s: 'header' }, { v: tr('Color'), s: 'header' }, { v: tr('Código'), s: 'header' }] },
        ...COLORS.map(c => ({ ht: 26, cells: [{ v: '', fill: c[2] }, { v: c[lang === 'en' ? 1 : 0], s: 'text' }, { v: c[2].toUpperCase(), s: 'text' }] }))
      ]
    };
    const type = tournament?.format === 'elim' || tournament?.fixture?.type === 'elim' ? typeLabels[1] : typeLabels[0];
    const tour = {
      name: tr('TORNEO'), tabColor: '#1b47e2', cols: [28, 44, 62], merges: ['A1:C1', 'A6:C6'], select: 'B3',
      rows: [
        { ht: 40, cells: [{ v: tr('TORNEO'), s: 'title' }, { s: 'title' }, { s: 'title' }] },
        [],
        { ht: 28, cells: [{ v: tr('Nombre del torneo'), s: 'label' }, { v: tournament?.name || '', s: 'input' }, { v: tr('← Escribí el nombre del torneo. Ej.: Torneo Apertura 2026'), s: 'hint' }] },
        { ht: 28, cells: [{ v: tr('Tipo de fixture'), s: 'label' }, { v: type, s: 'input' }, { v: tr('← Tocá la celda y elegí de la lista (▼): todos contra todos o eliminación.'), s: 'hint' }] },
        [],
        { ht: 34, cells: [{ v: tr('El tipo de fixture se puede cambiar después en la app, mientras no haya partidos jugados.'), s: 'note' }] }
      ],
      validations: [
        { sqref: 'B3', prompt: { title: tr('Nombre del torneo'), text: tr('Escribí el nombre del torneo. Ej.: Torneo Apertura 2026') } },
        { sqref: 'B4', list: typeLabels, strict: true, prompt: { title: tr('Tipo de fixture'), text: tr('Elegí de la lista.') } }
      ]
    };
    const teams = tournament?.teams?.length ? tournament.teams : Array.from({ length: TEMPLATE_TEAMS }, () => null);
    const teamSheets = teams.map((team, i) => {
      const players = team ? TN.sortPlayers(team.players) : [];
      const rows = [
        { ht: 40, cells: [{ v: `${tr('EQUIPO')} ${i + 1}`, s: 'title' }, { s: 'title' }, { s: 'title' }] },
        [],
        { ht: 28, cells: [{ v: tr('Equipo'), s: 'label' }, { v: team?.name || '', s: 'input' }, { v: tr('← Escribí el nombre del equipo. Ej.: Los Cóndores'), s: 'hint' }] },
        { ht: 28, cells: [{ v: tr('Color'), s: 'label' }, { v: team ? colorLabel(team.color, lang) : colorNames[i % colorNames.length], s: 'input' }, { v: tr('← Elegí de la lista (▼): la celda se pinta de ese color. También sirve un código como #1B47E2.'), s: 'hint' }] },
        { ht: 30, cells: [null, { v: tr('Los colores con su muestra están en la hoja COLORES.'), s: 'note' }] },
        [],
        { ht: 26, cells: [{ v: tr('N.º camiseta'), s: 'header' }, { v: tr('Nombre y apellido del jugador'), s: 'header' }, { v: tr('Cómo completar'), s: 'header' }] }
      ];
      const tips = [tr('← Un jugador por fila, de arriba hacia abajo.'), tr('← El número de camiseta es opcional (hasta 3 dígitos).'), tr('← Las filas que dejes vacías se ignoran.')];
      for (let r = 0; r < PLAYER_ROWS; r++) {
        const p = players[r];
        rows.push([{ v: p?.number || '', s: 'inputCenter' }, { v: p?.name || '', s: 'input' }, r < tips.length ? { v: tips[r], s: 'hint' } : null]);
      }
      const firstRow = HEAD_ROW + 1, lastRow = HEAD_ROW + PLAYER_ROWS;
      return {
        name: team ? team.name : `${tr('EQUIPO')} ${i + 1}`, tabColor: team?.color && team.color.toLowerCase() !== '#ffffff' ? team.color : '#f59e0b',
        cols: [16, 46, 58], merges: ['A1:C1'], freeze: HEAD_ROW, select: 'B3', rows,
        conditional: [{ sqref: 'B4', rules: colorRules }],
        validations: [
          { sqref: 'B3', prompt: { title: tr('Nombre del equipo'), text: tr('Escribí el nombre del equipo. Ej.: Los Cóndores') } },
          { sqref: 'B4', ref: colorsRef, strict: false, prompt: { title: tr('Color'), text: tr('Elegí de la lista (▼) o escribí un código como #1B47E2.') } },
          { sqref: `A${firstRow}:A${lastRow}`, prompt: { title: tr('N.º camiseta'), text: tr('Número de camiseta, hasta 3 dígitos. Es opcional.') } },
          { sqref: `B${firstRow}:B${lastRow}`, prompt: { title: tr('Jugador'), text: tr('Nombre y apellido del jugador. Un jugador por fila.') } }
        ]
      };
    });
    return [guide, tour, ...teamSheets, colorsSheet];
  }

  /* ---------- Lectura ---------- */
  const LABEL = {
    tournament: /^(nombre del torneo|tournament name)$/,
    type: /^(tipo de fixture|tipo|fixture type|fixture|format|formato)$/,
    team: /^(equipo|nombre del equipo|team|team name)$/,
    color: /^(color|colour)$/,
    number: /^(n\.?\s*º?\s*(de )?(camiseta)?|nro\.?|numero( de camiseta)?|num\.?|#|number|no\.?|jersey( number)?|n\.?º camiseta|dorsal)$/,
    player: /^(nombre y apellido( del jugador)?|jugador(a)?|jugador o jugadora|nombre|player( name| full name)?|name|full name)$/
  };
  const clean = s => fold(s).replace(/[:*]+$/, '').trim();
  const matches = (re, s) => re.test(clean(s));
  const valueRight = (row, col) => { for (let c = col + 1; c < row.length; c++) { const v = String(row[c] ?? '').trim(); if (v && !v.startsWith('←')) return v; } return ''; };
  function findLabel(rows, re, maxRows = 12) {
    for (let r = 0; r < Math.min(rows.length, maxRows); r++) for (let c = 0; c < (rows[r] || []).length; c++) if (matches(re, rows[r][c])) return { r, c };
    return null;
  }
  function findHeader(rows) {
    for (let r = 0; r < Math.min(rows.length, 20); r++) {
      const row = rows[r] || [];
      const name = row.findIndex(v => matches(LABEL.player, v));
      if (name < 0) continue;
      return { r, name, number: row.findIndex(v => matches(LABEL.number, v)), team: row.findIndex(v => matches(LABEL.team, v)), color: row.findIndex(v => matches(LABEL.color, v)) };
    }
    return null;
  }
  const typeFrom = v => { const f = fold(v); return /elim|knock|llave|cuadro|playoff/.test(f) ? 'elim' : /todos|round|liga|league/.test(f) ? 'rr' : null; };
  const isDefaultSheetName = n => /^(equipo|team)\s*\d+$/i.test(String(n).trim());

  /* sheets: salida de UCXlsx.read. Devuelve { name, type, teams: [{ name, color, players: [{ name, number }] }], warnings }. */
  function parse(sheets) {
    const out = { name: '', type: null, teams: [], warnings: [] };
    const warn = (sheet, key, vars = {}) => out.warnings.push({ sheet, key, vars });
    const byName = new Map();
    const addTeam = (sheet, name, colorText, players) => {
      const label = String(name).trim().slice(0, TN.LIMITS.name);
      let color = colorFromText(colorText);
      if (color === undefined) { warn(sheet, 'No se reconoce el color "{color}": se usa uno de la lista.', { color: colorText }); color = null; }
      const key = fold(label);
      const existing = byName.get(key);
      if (existing) { warn(sheet, 'El equipo {team} aparece en más de una hoja: se juntaron sus jugadores.', { team: label }); existing.players.push(...players); if (color && !existing.color) existing.color = color; return; }
      if (out.teams.length >= TN.LIMITS.teams) { warn(sheet, 'Se superó el máximo de {n} equipos: el resto no se importa.', { n: TN.LIMITS.teams }); return; }
      const team = { name: label, color, players };
      byName.set(key, team); out.teams.push(team);
    };
    for (const sheet of sheets || []) {
      if (/^(colores|colors)$/.test(fold(sheet.name))) continue; // lista de colores de la plantilla
      const rows = sheet.rows || [];
      const tl = findLabel(rows, LABEL.tournament);
      if (tl && !findLabel(rows, LABEL.team, 6)) {
        out.name ||= valueRight(rows[tl.r], tl.c);
        const ty = findLabel(rows, LABEL.type);
        if (ty) { const v = valueRight(rows[ty.r], ty.c); out.type = typeFrom(v) || out.type; }
        continue;
      }
      const head = findHeader(rows);
      if (!head) continue; // instrucciones u otras hojas
      const cell = (row, c) => (c >= 0 ? String(row?.[c] ?? '').trim() : '');
      const body = rows.slice(head.r + 1);
      if (head.team >= 0) {
        /* Una sola hoja con todos: columnas Equipo · Número · Jugador (· Color). */
        const groups = new Map();
        body.forEach((row, i) => {
          const team = cell(row, head.team), name = cell(row, head.name), number = cell(row, head.number);
          if (!team && !name) return;
          if (!team) { warn(sheet.name, 'Fila {row}: falta el equipo de {player}.', { row: head.r + i + 2, player: name }); return; }
          const g = groups.get(fold(team)) || { name: team, color: cell(row, head.color), players: [] };
          if (name) g.players.push({ name, number });
          groups.set(fold(team), g);
        });
        for (const g of groups.values()) addTeam(sheet.name, g.name, g.color, g.players);
        continue;
      }
      const tlab = findLabel(rows, LABEL.team, head.r);
      const clab = findLabel(rows, LABEL.color, head.r);
      const players = [];
      body.forEach((row, i) => {
        const name = cell(row, head.name), number = cell(row, head.number);
        if (!name) { if (number) warn(sheet.name, 'Fila {row}: hay un número sin nombre.', { row: head.r + i + 2 }); return; }
        if (number && !TN.cleanNumber(number)) warn(sheet.name, 'Fila {row}: "{number}" no es un número de camiseta (hasta 3 dígitos); se deja vacío.', { row: head.r + i + 2, number });
        players.push({ name, number });
      });
      let name = tlab ? valueRight(rows[tlab.r], tlab.c) : '';
      const colorText = clab ? valueRight(rows[clab.r], clab.c) : '';
      if (!name && !players.length) continue; // hoja de equipo sin usar
      if (!name) {
        if (isDefaultSheetName(sheet.name)) { warn(sheet.name, 'La hoja {sheet} tiene jugadores pero no el nombre del equipo: se usa el nombre de la hoja.', { sheet: sheet.name }); }
        name = sheet.name;
      }
      if (players.length > TN.LIMITS.players) { warn(sheet.name, '{team}: más de {n} jugadores; se importan los primeros {n}.', { team: name, n: TN.LIMITS.players }); players.length = TN.LIMITS.players; }
      addTeam(sheet.name, name, colorText, players);
    }
    const palette = COLORS.map(c => c[2]);
    out.teams.forEach((team, i) => {
      team.color ||= palette[i % palette.length];
      if (!team.players.length) warn(team.name, 'El equipo {team} no tiene jugadores.', { team: team.name });
    });
    return out;
  }

  /* Aplica lo leído a un torneo (nuevo o existente). Los equipos se reconocen por nombre; los jugadores también, para
     conservar sus ids (y sus goles). Un jugador que ya no está en la planilla se quita, salvo que tenga goles o pases. */
  function applyToTournament(tournament, parsed, matches = []) {
    const stats = TN.stats(tournament, matches);
    const scored = new Set(stats.map(r => r.player.id));
    const summary = { added: 0, updated: 0, players: 0, kept: 0 };
    for (const incoming of parsed.teams) {
      let team = tournament.teams.find(x => fold(x.name) === fold(incoming.name));
      if (!team) {
        if (tournament.teams.length >= TN.LIMITS.teams) break;
        team = TN.makeTeam(incoming.name, incoming.color);
        if (!team) continue;
        tournament.teams.push(team); summary.added++;
      } else summary.updated++;
      if (incoming.color) team.color = incoming.color;
      const next = [], used = new Set();
      for (const p of incoming.players.slice(0, TN.LIMITS.players)) {
        const prev = team.players.find(x => !used.has(x.id) && fold(x.name) === fold(p.name));
        const player = prev ? { ...prev, number: TN.cleanNumber(p.number) } : TN.makePlayer(p.name, p.number);
        if (!player) continue;
        used.add(player.id); next.push(player); summary.players++;
      }
      for (const old of team.players) if (!used.has(old.id) && scored.has(old.id) && next.length < TN.LIMITS.players) { next.push(old); summary.kept++; }
      team.players = next;
    }
    if (parsed.type && !tournament.fixture) tournament.format = parsed.type;
    return summary;
  }

  const api = { template, parse, applyToTournament, colorFromText, colorLabel, COLORS, PLAYER_ROWS };
  if (typeof module !== 'undefined') module.exports = api; else root.UCTournamentSheet = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
