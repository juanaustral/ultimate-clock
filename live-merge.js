/* Ultimate Clock · partido compartido en vivo. Lógica pura (sin DOM) para que varios dispositivos de la misma cuenta
   controlen el MISMO partido a la vez.
   Cada dispositivo guarda su copia del partido en curso. Al bajar la copia de otro dispositivo con el mismo id, se juntan:
   - Lo que se SUMA (goles, ajustes, eventos) se une por id: nunca se pierde ni se duplica lo que anotó el otro.
   - Un gol deshecho queda en `removedGoals` (lápidas), para que no reaparezca desde la copia del otro.
   - Lo que es el ESTADO del control (reloj, cuentas, mitad, time out) se queda con la copia de quien lo tocó último
     (`ctlAt`); `ctlSig` detecta cuándo cambió de verdad, sin contar el paso del tiempo.
   - TOMAR EL CONTROL deja `control = {device, at}`: los otros dispositivos que lo ven dejan ese partido. */
(function (root) {
  'use strict';
  const TIMERS = ['pull', 'call', 'call2', 'timeout'];
  const clone = v => JSON.parse(JSON.stringify(v));

  /* Firma del estado de control: cambia al iniciar, pausar, reiniciar o completar un reloj o cuenta, cambiar de mitad o
     usar un time out; no cambia con el paso del tiempo (un reloj corriendo es siempre «R»). */
  function signature(m) {
    const one = x => (x ? (x.running ? 'R' : 'P' + Math.round((Number(x.elapsed) || 0) * 10)) + (x.completed ? 'C' : '') : '-');
    return [one(m.clock), ...TIMERS.map(k => one(m.timers && m.timers[k])), one(m.breakTimer), m.half, JSON.stringify(m.timeoutState || null), JSON.stringify(m.callTypes || null)].join('|');
  }
  /* Marca de «quién lo tocó último»: se llama en cada guardado. Devuelve true si el control cambió. */
  function stamp(m, now = Date.now()) {
    const sig = signature(m);
    if (m.ctlSig === sig) return false;
    m.ctlSig = sig; m.ctlAt = now;
    return true;
  }

  const eventKey = e => (e.id ? e.id : e.type === 'limit' ? `limit|${e.timer || ''}|${e.label || ''}` : JSON.stringify(e));
  const adjKey = a => (a.id ? a.id : `${a.at}|${a.delta}`);

  /* Une dos listas por clave. Conserva el orden de la local y suma al final lo nuevo; ordena solo si agregó algo. */
  function union(local, remote, keyOf, sortBy) {
    const seen = new Map();
    for (const x of local) seen.set(keyOf(x), x);
    const added = [];
    for (const x of remote) if (!seen.has(keyOf(x))) { seen.set(keyOf(x), x); added.push(clone(x)); }
    const out = local.concat(added);
    if (added.length && sortBy) out.sort((a, b) => String(sortBy(a)).localeCompare(String(sortBy(b))));
    return out;
  }

  /* Junta la copia local con la de otro dispositivo (mismo id de partido).
     Devuelve { match, changed, saved, lostControl }. No modifica los argumentos. */
  function merge(local, remote, me) {
    if (!local || !remote || local.id !== remote.id) return { match: local, changed: false };
    /* Si el otro ya lo guardó, ese es el oficial. */
    if (remote.status === 'saved' && local.status !== 'saved') return { match: clone(remote), changed: true, saved: true };
    if (local.status === 'saved') return { match: local, changed: false };
    const out = clone(local);
    const removed = Array.from(new Set([...(local.removedGoals || []), ...(remote.removedGoals || [])]));
    if (removed.length) out.removedGoals = removed;
    const dead = new Set(removed);

    out.teams.forEach((team, i) => {
      const other = (remote.teams || [])[i] || { goals: [], adjustments: [] };
      const goals = union(team.goals || [], other.goals || [], g => g.id, g => g.at || '').filter(g => !dead.has(g.id));
      /* El mismo gol editado en los dos: queda el último editado. */
      for (const rg of other.goals || []) {
        const g = goals.find(x => x.id === rg.id);
        if (g && (Number(rg.editedAt) || 0) > (Number(g.editedAt) || 0)) Object.assign(g, clone(rg));
      }
      team.goals = goals;
      team.adjustments = union(team.adjustments || [], other.adjustments || [], adjKey, a => a.at || '');
      team.score = Math.max(0, team.goals.length + team.adjustments.reduce((s, a) => s + (Number(a.delta) || 0), 0));
    });

    /* Los eventos de un gol deshecho se van; los del gol editado en el otro toman sus nombres. */
    let events = union(local.events || [], remote.events || [], eventKey, e => e.at || '').filter(e => !(e.goal && dead.has(e.goal)));
    const goalById = new Map(out.teams.flatMap(t => t.goals).map(g => [g.id, g]));
    events = events.map(e => {
      const g = e.goal && goalById.get(e.goal);
      return g && (e.assist !== g.assist || e.scorer !== g.scorer) ? { ...e, assist: g.assist, assistId: g.assistId, scorer: g.scorer, scorerId: g.scorerId } : e;
    });
    out.events = events;

    /* Reloj y cuentas: gana quien los tocó último. */
    if ((Number(remote.ctlAt) || 0) > (Number(local.ctlAt) || 0)) {
      for (const k of ['clock', 'timers', 'breakTimer', 'timeoutState', 'callTypes', 'half']) out[k] = clone(remote[k]);
      out.ctlAt = remote.ctlAt; out.ctlSig = remote.ctlSig;
    }

    /* Si el otro dispositivo tomó el control después, este deja el partido. */
    const ro = remote.control, lo = local.control;
    let lostControl = false;
    if (ro && ro.device !== me && (!lo || Number(ro.at) > Number(lo.at))) { out.control = clone(ro); lostControl = true; }
    out.shared = true;
    return { match: out, changed: JSON.stringify(out) !== JSON.stringify(local), lostControl };
  }

  /* Anota que el gol se deshizo (lápida) y que el gol se editó (para elegir la última edición). */
  function removeGoal(m, goalId) { m.removedGoals = Array.from(new Set([...(m.removedGoals || []), goalId])); }

  const api = { merge, signature, stamp, removeGoal, eventKey };
  if (typeof module !== 'undefined') module.exports = api; else root.UCLive = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
