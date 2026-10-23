/* Ultimate Clock · archivos de Excel (.xlsx) sin librerías externas.
   Escribe libros simples con estilos, listas desplegables y paneles fijos (ZIP sin comprimir), y lee cualquier .xlsx
   (Excel, Google Sheets, LibreOffice, Numbers) descomprimiendo con DecompressionStream. Sin DOM: se prueba en Node. */
(function (root) {
  'use strict';
  const enc = new TextEncoder();
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

  /* ---------- ZIP ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(bytes) { let c = 0xffffffff; for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

  function zip(files) {
    const parts = [], central = [];
    let offset = 0;
    const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const f of files) {
      const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      const head = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, time, 2], [12, date, 2], [14, crc, 4], [18, data.length, 4], [22, data.length, 4], [26, name.length, 2], [28, 0, 2]]
        .forEach(([at, v, n]) => n === 4 ? head.setUint32(at, v, true) : head.setUint16(at, v, true));
      const cen = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, time, 2], [14, date, 2], [16, crc, 4], [20, data.length, 4], [24, data.length, 4], [28, name.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, offset, 4]]
        .forEach(([at, v, n]) => n === 4 ? cen.setUint32(at, v, true) : cen.setUint16(at, v, true));
      parts.push(new Uint8Array(head.buffer), name, data);
      central.push(new Uint8Array(cen.buffer), name);
      offset += 30 + name.length + data.length;
    }
    const cdSize = central.reduce((s, p) => s + p.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    [[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, files.length, 2], [10, files.length, 2], [12, cdSize, 4], [16, offset, 4], [20, 0, 2]]
      .forEach(([at, v, n]) => n === 4 ? end.setUint32(at, v, true) : end.setUint16(at, v, true));
    const all = [...parts, ...central, new Uint8Array(end.buffer)];
    const out = new Uint8Array(all.reduce((s, p) => s + p.length, 0));
    let at = 0; for (const p of all) { out.set(p, at); at += p.length; }
    return out;
  }

  async function inflate(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function unzip(input) {
    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('zip');
    const count = v.getUint16(eocd + 10, true);
    let p = v.getUint32(eocd + 16, true);
    const out = new Map(), dec = new TextDecoder();
    for (let i = 0; i < count; i++) {
      if (v.getUint32(p, true) !== 0x02014b50) throw new Error('zip');
      const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true);
      const nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), local = v.getUint32(p + 42, true);
      const name = dec.decode(bytes.subarray(p + 46, p + 46 + nl));
      const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      const raw = bytes.subarray(start, start + size);
      if (/\.(xml|rels|png|jpe?g|gif|webp)$/i.test(name)) out.set(name.replace(/^\//, ''), method === 8 ? await inflate(raw) : method === 0 ? raw : null);
      p += 46 + nl + xl + cl;
    }
    return out;
  }

  /* ---------- Escritura ---------- */
  /* Estilos con nombre; el orden define el índice s="n" de cada celda. */
  const STYLE_NAMES = ['default', 'title', 'label', 'input', 'header', 'note', 'subtitle', 'inputCenter', 'text', 'number', 'hint'];
  const stylesXml = (swatches, dxfs) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="${NS}">
<fonts count="8"><font><sz val="11"/><color rgb="FF0F1115"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="18"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FF0F1115"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font><font><i/><sz val="10"/><color rgb="FF5A606D"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="13"/><color rgb="FF1B47E2"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="12"/><color rgb="FF0F1115"/><name val="Calibri"/><family val="2"/></font><font><i/><sz val="10"/><color rgb="FF1B47E2"/><name val="Calibri"/><family val="2"/></font></fonts>
<fills count="${6 + swatches.length}"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1B47E2"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE9ECF1"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF7D6"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF101216"/><bgColor indexed="64"/></patternFill></fill>${swatches.map(c => `<fill><patternFill patternType="solid"><fgColor rgb="FF${c}"/><bgColor indexed="64"/></patternFill></fill>`).join('')}</fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFC4C9D2"/></left><right style="thin"><color rgb="FFC4C9D2"/></right><top style="thin"><color rgb="FFC4C9D2"/></top><bottom style="thin"><color rgb="FFC4C9D2"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${11 + swatches.length}">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="49" fontId="6" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="49" fontId="6" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="center" wrapText="1" indent="1"/></xf>${swatches.map((_, i) => `<xf numFmtId="0" fontId="0" fillId="${6 + i}" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>`).join('')}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>${dxfs.length ? `<dxfs count="${dxfs.length}">${dxfs.map(d => `<dxf><font><color rgb="FF${d.font}"/></font><fill><patternFill patternType="solid"><fgColor rgb="FF${d.fill}"/><bgColor rgb="FF${d.fill}"/></patternFill></fill></dxf>`).join('')}</dxfs>` : ''}
</styleSheet>`;

  const colName = i => { let s = ''; i++; while (i) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; };
  const colIndex = ref => { let n = 0; for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
  const safeSheetName = (name, used) => {
    let base = String(name).replace(/[\[\]:*?/\\]/g, ' ').trim().slice(0, 31) || 'Hoja', next = base, n = 2;
    while (used.has(next.toLowerCase())) next = `${base.slice(0, 28)} ${n++}`;
    used.add(next.toLowerCase());
    return next;
  };

  const hex6 = v => String(v).replace('#', '').toUpperCase();
  function sheetXml(sheet, ctx) {
    const rows = (sheet.rows || []).map((row, r) => {
      const cells = Array.isArray(row) ? row : row.cells || [];
      const ht = !Array.isArray(row) && row.ht ? ` ht="${row.ht}" customHeight="1"` : '';
      const body = cells.map((cell, c) => {
        if (cell === null || cell === undefined) return '';
        const o = typeof cell === 'object' ? cell : { v: cell };
        const ref = colName(c) + (r + 1), s = o.fill ? STYLE_NAMES.length + ctx.swatches.indexOf(hex6(o.fill)) : Math.max(0, STYLE_NAMES.indexOf(o.s || 'default'));
        const st = s ? ` s="${s}"` : '';
        if (o.v === undefined || o.v === null || o.v === '') return `<c r="${ref}"${st}/>`;
        if (typeof o.v === 'number') return `<c r="${ref}"${st}><v>${o.v}</v></c>`;
        return `<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${esc(o.v)}</t></is></c>`;
      }).join('');
      return `<row r="${r + 1}"${ht}>${body}</row>`;
    }).join('');
    const pane = sheet.freeze ? `<pane ySplit="${sheet.freeze}" topLeftCell="A${sheet.freeze + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="${sheet.select || 'A' + (sheet.freeze + 1)}" sqref="${sheet.select || 'A' + (sheet.freeze + 1)}"/>`
      : sheet.select ? `<selection activeCell="${sheet.select}" sqref="${sheet.select}"/>` : '';
    const cols = sheet.cols?.length ? `<cols>${sheet.cols.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
    const merges = sheet.merges?.length ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : '';
    const vals = sheet.validations?.length ? `<dataValidations count="${sheet.validations.length}">${sheet.validations.map(v => {
      const kind = v.ref ? `<formula1>${esc(v.ref)}</formula1>` : v.list ? `<formula1>"${esc(v.list.join(',')).slice(0, 250)}"</formula1>` : '';
      return `<dataValidation${kind ? ' type="list"' : ''} allowBlank="1" showInputMessage="1" showErrorMessage="${v.strict && kind ? 1 : 0}"${v.prompt ? ` promptTitle="${esc(v.prompt.title).slice(0, 32)}" prompt="${esc(v.prompt.text).slice(0, 255)}"` : ''} sqref="${v.sqref}">${kind}</dataValidation>`;
    }).join('')}</dataValidations>` : '';
    /* Formato condicional: la celda toma el color que dice su texto (p. ej. «Azul» se pinta de azul). */
    let prio = 1;
    const cond = (sheet.conditional || []).map(c => `<conditionalFormatting sqref="${c.sqref}">${c.rules.map(r =>
      `<cfRule type="cellIs" dxfId="${ctx.dxfs.findIndex(d => d.fill === hex6(r.fill) && d.font === hex6(r.font))}" priority="${prio++}" operator="equal"><formula>"${esc(r.text)}"</formula></cfRule>`).join('')}</conditionalFormatting>`).join('');
    const tab = sheet.tabColor ? `<sheetPr><tabColor rgb="FF${sheet.tabColor.replace('#', '').toUpperCase()}"/></sheetPr>` : '';
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="${NS}" xmlns:r="${NS_R}">${tab}<sheetViews><sheetView workbookViewId="0" showGridLines="0"${sheet.active ? ' tabSelected="1"' : ''}>${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="20" customHeight="1"/>${cols}<sheetData>${rows}</sheetData>${merges}${cond}${vals}<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>${sheet.images?.length ? '<drawing r:id="rId1"/>' : ''}</worksheet>`;
  }

  /* sheets: [{ name, rows, cols, merges, validations, freeze, tabColor, select }]. Devuelve los bytes del .xlsx. */
  function write(sheets) {
    const used = new Set();
    const list = sheets.map((s, i) => ({ ...s, name: safeSheetName(s.name, used), active: i === 0 }));
    const ctx = { swatches: [], dxfs: [] };
    for (const sh of list) {
      for (const row of sh.rows || []) for (const cell of Array.isArray(row) ? row : row.cells || []) if (cell && cell.fill && !ctx.swatches.includes(hex6(cell.fill))) ctx.swatches.push(hex6(cell.fill));
      for (const c of sh.conditional || []) for (const r of c.rules) { const d = { fill: hex6(r.fill), font: hex6(r.font) }; if (!ctx.dxfs.some(x => x.fill === d.fill && x.font === d.font)) ctx.dxfs.push(d); }
    }
    /* Imágenes: sheet.images = [{ col, row (0-based), width, height (px), ext: 'png'|'jpeg', data: Uint8Array }]. */
    const imageSheets = [], imageFiles = [];
    let imageNo = 0;
    list.forEach((sh, i) => {
      if (!sh.images?.length) return;
      const n = i + 1, rels = [];
      imageSheets.push(n);
      const anchors = sh.images.map((im, k) => {
        imageNo++;
        imageFiles.push({ name: `xl/media/image${imageNo}.${im.ext}`, data: im.data });
        rels.push(`<Relationship Id="rId${k + 1}" Type="${NS_R}/image" Target="../media/image${imageNo}.${im.ext}"/>`);
        const cx = Math.round(im.width * 9525), cy = Math.round(im.height * 9525);
        return `<xdr:oneCellAnchor><xdr:from><xdr:col>${im.col}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${im.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="${cx}" cy="${cy}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${k + 2}" name="${esc(im.name || 'Logo')} ${k + 1}"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId${k + 1}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`;
      }).join('');
      imageFiles.push({ name: `xl/drawings/drawing${n}.xml`, data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="${NS_R}">${anchors}</xdr:wsDr>` });
      imageFiles.push({ name: `xl/drawings/_rels/drawing${n}.xml.rels`, data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>` });
      imageFiles.push({ name: `xl/worksheets/_rels/sheet${n}.xml.rels`, data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${NS_R}/drawing" Target="../drawings/drawing${n}.xml"/></Relationships>` });
    });
    const files = [
      { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${list.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${imageSheets.map(n => `<Override PartName="/xl/drawings/drawing${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`).join('')}</Types>` },
      { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${NS_R}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
      { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="${NS}" xmlns:r="${NS_R}"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${list.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
      { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${list.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${NS_R}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${list.length + 1}" Type="${NS_R}/styles" Target="styles.xml"/></Relationships>` },
      { name: 'xl/styles.xml', data: stylesXml(ctx.swatches, ctx.dxfs) },
      ...list.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s, ctx) })),
      ...imageFiles
    ];
    return zip(files);
  }

  /* ---------- Lectura ---------- */
  const unxml = s => String(s).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e.toLowerCase()]);
  const attrs = s => { const o = {}; String(s).replace(/([\w:]+)\s*=\s*"([^"]*)"/g, (_, k, v) => { o[k.replace(/^\w+:(?=id$)/, 'r:')] = unxml(v); }); return o; };
  const noPrefix = xml => xml.replace(/<(\/?)[A-Za-z_][\w.-]*:/g, '<$1');
  const texts = xml => { let s = ''; xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').replace(/<t\b[^>]*>([\s\S]*?)<\/t>/g, (_, x) => { s += unxml(x); }); return s; };

  /* Devuelve [{ name, rows: [[texto, ...], ...] }] con todas las celdas como texto (vacías como ''). */
  async function read(bytes) {
    const files = await unzip(bytes);
    const dec = new TextDecoder();
    const get = name => { const b = files.get(name); return b ? noPrefix(dec.decode(b)) : ''; };
    const wb = get('xl/workbook.xml');
    if (!wb) throw new Error('xlsx');
    const rels = {};
    get('xl/_rels/workbook.xml.rels').replace(/<Relationship\b([^>]*)\/?>/g, (_, a) => { const o = attrs(a); rels[o.Id] = o.Target; });
    const shared = [];
    get('xl/sharedStrings.xml').replace(/<si\b[^>]*>([\s\S]*?)<\/si>/g, (_, x) => { shared.push(texts(x)); });
    const sheets = [];
    wb.replace(/<sheet\b([^>]*)\/?>/g, (_, a) => { const o = attrs(a); sheets.push({ name: o.name || '', rid: o['r:id'] || o.id }); });
    return sheets.map(s => {
      let target = rels[s.rid] || '';
      target = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '');
      const xml = get(target), rows = [];
      let nextRow = 0;
      xml.replace(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g, (_, ra, body) => {
        const r = Number(attrs(ra).r) - 1;
        const ri = Number.isInteger(r) && r >= 0 ? r : nextRow;
        nextRow = ri + 1;
        const row = [];
        let nextCol = 0;
        (body || '').replace(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, (__, ca, cb) => {
          const o = attrs(ca);
          const ci = o.r ? colIndex(o.r) : nextCol;
          nextCol = ci + 1;
          let value = '';
          if (cb) {
            const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(cb);
            if (o.t === 's') value = shared[Number(v?.[1])] ?? '';
            else if (o.t === 'inlineStr') value = texts(cb);
            else if (v) value = unxml(v[1]);
            if (!o.t || o.t === 'n') value = value.replace(/^(-?\d+)\.0+$/, '$1');
          }
          row[ci] = value;
        });
        for (let i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = '';
        rows[ri] = row;
      });
      for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
      return { name: s.name, rows, images: readImages(target) };
    });

    /* Imágenes ancladas a una hoja: [{ col, row, ext, data }] (cualquier tipo de anclaje que use Excel, Sheets o LibreOffice). */
    function readImages(sheetPath) {
      const dir = sheetPath.slice(0, sheetPath.lastIndexOf('/') + 1), file = sheetPath.slice(dir.length);
      const relsOf = (path) => { const d = path.slice(0, path.lastIndexOf('/') + 1), f = path.slice(d.length), out = {}; get(`${d}_rels/${f}.rels`).replace(/<Relationship\b([^>]*)\/?>/g, (_, a) => { const o = attrs(a); out[o.Id] = o; }); return out; };
      const resolve = (base, target) => { if (target.startsWith('/')) return target.slice(1); const parts = base.split('/').slice(0, -1); for (const p of target.split('/')) { if (p === '..') parts.pop(); else if (p !== '.') parts.push(p); } return parts.join('/'); };
      const out = [];
      const sheetRels = relsOf(sheetPath);
      for (const rel of Object.values(sheetRels)) {
        if (!/\/drawing$/.test(rel.Type || '')) continue;
        const dpath = resolve(sheetPath, rel.Target), dxml = get(dpath), drels = relsOf(dpath);
        dxml.replace(/<(twoCellAnchor|oneCellAnchor|absoluteAnchor)\b[\s\S]*?<\/\1>/g, (block) => {
          const blip = /<blip\b([^>]*)\/?>/.exec(block);
          if (!blip) return '';
          const target = drels[attrs(blip[1])['r:embed']]?.Target;
          const data = target && files.get(resolve(dpath, target));
          const ext = (/\.(png|jpe?g|gif|webp)$/i.exec(target || '') || [])[1];
          if (!data || !ext) return '';
          const col = Number(/<from>[\s\S]*?<col>(\d+)<\/col>/.exec(block)?.[1] ?? 0), row = Number(/<from>[\s\S]*?<row>(\d+)<\/row>/.exec(block)?.[1] ?? 0);
          out.push({ col, row, ext: ext.toLowerCase().replace('jpg', 'jpeg'), data });
          return '';
        });
      }
      return out;
    }
  }

  const isXlsx = bytes => bytes && bytes[0] === 0x50 && bytes[1] === 0x4b;
  const api = { write, read, zip, unzip, crc32, colName, colIndex, isXlsx, MIME: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  if (typeof module !== 'undefined') module.exports = api; else root.UCXlsx = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
