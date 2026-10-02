(() => {
  "use strict";

  const STORAGE_KEY = "ultimate-clock-v1";
  const app = document.getElementById("app");
  const modalRoot = document.getElementById("modalRoot");
  const toast = document.getElementById("toast");
  const liveRegion = document.getElementById("liveRegion");
  const root = document.documentElement;

  const RULESETS = {
    wfdf: {
      label: "WFDF 2025–2028",
      gameCap: 6000,
      halfCap: 3300,
      halftime: 420,
      timeoutDuration: 75,
      timeoutLimit: 90,
      timeoutsPerTeam: 2,
      pull: { line: 45, ready: 60, release: 75 },
      call: { captain: 15, contested: 45, restart: 60 },
      ratio: 15
    },
    usau: {
      label: "USA Ultimate 2026–2027",
      gameCap: 5400,
      halfCap: 3000,
      halftime: 420,
      timeoutDuration: 70,
      timeoutLimit: 90,
      timeoutsPerTeam: 2,
      pull: { line: 50, ready: 60, release: 80 },
      call: { captain: 15, contested: 30, restart: 45 },
      ratio: 25
    },
    custom: {
      label: "Personalizado",
      gameCap: 6000,
      halfCap: 3300,
      halftime: 420,
      timeoutDuration: 75,
      timeoutLimit: 90,
      timeoutsPerTeam: 2,
      pull: { line: 45, ready: 60, release: 75 },
      call: { captain: 15, contested: 45, restart: 60 },
      ratio: 15
    }
  };

  const BUILT_IN_THEMES = [
    { id: "light", name: "Claro", swatch: "#f5c532" },
    { id: "dark", name: "Oscuro", swatch: "#78ff3c" },
    { id: "sun", name: "Sol", swatch: "#087b39" },
    { id: "amber", name: "Ámbar alto contraste", swatch: "#ffd000" },
    { id: "cyan", name: "Cian alto contraste", swatch: "#00e5ff" }
  ];

  const THEME_VARS = [
    ["bg", "Fondo", "#f4ead8"],
    ["panel", "Panel", "#fbf6e9"],
    ["ink", "Texto", "#10251f"],
    ["accent", "Acento", "#f5c532"],
    ["accent-2", "Verde profundo", "#0c4738"]
  ];

  const TEAM_DEFAULTS = [
    { name: "Equipo 1", color: "#0c4738" },
    { name: "Equipo 2", color: "#0d6d9e" }
  ];

  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));
  const seconds = value => Math.max(0, Number(value) || 0);
  const fmt = value => {
    const total = Math.max(0, Math.ceil(value));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };
  const dateLabel = value => new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const nowIso = () => new Date().toISOString();

  function relativeLuminance(hex) {
    const clean = String(hex).replace("#", "");
    const full = clean.length === 3 ? clean.split("").map(x => x + x).join("") : clean;
    const rgb = [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16) / 255);
    const linear = rgb.map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  function contrastColor(hex) {
    const lum = relativeLuminance(hex);
    const whiteRatio = (1.05) / (lum + 0.05);
    const blackRatio = (lum + 0.05) / 0.05;
    return whiteRatio >= blackRatio ? "#ffffff" : "#000000";
  }

  function getRuleset() {
    return RULESETS[state.settings.ruleset] || RULESETS.wfdf;
  }

  function makeTimer(id, label, duration, thresholds) {
    return { id, label, duration, thresholds: thresholds.map(item => ({ ...item })), elapsed: 0, running: false, startedAt: null, completed: false, alerted: [] };
  }

  function makeMatch(ruleset = "wfdf") {
    const config = RULESETS[ruleset] || RULESETS.wfdf;
    return {
      id: uid("match"),
      createdAt: nowIso(),
      savedAt: null,
      ruleset,
      status: "active",
      teams: TEAM_DEFAULTS.map(team => ({ ...team, score: 0, goals: [], adjustments: [] })),
      clock: { elapsed: 0, running: false, startedAt: null, halfAlerted: false, capAlerted: false, status: "Preparado", gameCap: config.gameCap, halfCap: config.halfCap, halftime: config.halftime },
      timers: {
        pull: makeTimer("pull", "Inicio de punto / pull", config.pull.release, [
          { at: config.pull.line, label: "Línea" },
          { at: config.pull.ready, label: "Listo" },
          { at: config.pull.release, label: "Pull" }
        ]),
        call: makeTimer("call", "Resolución de llamada", config.call.restart, [
          { at: config.call.captain, label: "Capitanes" },
          { at: config.call.contested, label: "Contestada" },
          { at: config.call.restart, label: "Reiniciar" }
        ]),
        timeout: makeTimer("timeout", "Time-out", config.timeoutLimit, [
          { at: 45, label: "30 s" },
          { at: 60, label: "15 s" },
          { at: config.timeoutDuration, label: "Ataque" },
          { at: config.timeoutLimit, label: "Check" }
        ])
      },
      timeoutState: { activeTeam: null, usages: [0, 0], mode: "" },
      callType: "Falta",
      events: []
    };
  }

  function freshState() {
    return {
      version: 1,
      settings: { theme: "light", ruleset: "wfdf", sound: true, volume: 0.85, overrides: {} },
      customThemes: [],
      activeMatch: makeMatch("wfdf"),
      savedMatches: []
    };
  }

  let state;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    state = stored ? mergeState(stored) : freshState();
  } catch {
    state = freshState();
  }

  function mergeState(stored) {
    const base = freshState();
    const merged = { ...base, ...stored, settings: { ...base.settings, ...(stored.settings || {}) } };
    if (!merged.activeMatch || !merged.activeMatch.timers) merged.activeMatch = makeMatch(merged.settings.ruleset);
    merged.customThemes = Array.isArray(merged.customThemes) ? merged.customThemes : [];
    merged.savedMatches = Array.isArray(merged.savedMatches) ? merged.savedMatches : [];
    return merged;
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { showToast("El navegador no permitió guardar en este dispositivo."); }
  }

  function themeName(id) {
    return BUILT_IN_THEMES.find(theme => theme.id === id)?.name || state.customThemes.find(theme => theme.id === id)?.name || "Personalizado";
  }

  function currentThemeVars() {
    const custom = state.customThemes.find(theme => theme.id === state.settings.theme);
    if (custom) return custom.vars;
    const styles = getComputedStyle(root);
    return Object.fromEntries(THEME_VARS.map(([key]) => [key, styles.getPropertyValue(`--${key}`).trim()]));
  }

  function applyTheme(id) {
    const custom = state.customThemes.find(theme => theme.id === id);
    if (custom) {
      root.dataset.theme = "custom";
      Object.entries(custom.vars).forEach(([key, value]) => root.style.setProperty(`--${key}`, value));
    } else {
      root.dataset.theme = id;
      THEME_VARS.forEach(([key]) => root.style.removeProperty(`--${key}`));
    }
    state.settings.theme = id;
    saveState();
    updateThemeMeta();
  }

  function updateThemeMeta() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(root).getPropertyValue("--bg").trim();
    const dot = document.querySelector(".status-dot");
    if (dot) dot.title = themeName(state.settings.theme);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 3200);
  }

  function announce(message) {
    liveRegion.textContent = "";
    window.setTimeout(() => { liveRegion.textContent = message; }, 10);
  }

  let audioContext;
  function unlockAudio() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioContext = new AudioCtx();
    }
    if (audioContext?.state === "suspended") audioContext.resume();
  }
  document.addEventListener("pointerdown", unlockAudio, { once: true });

  function beep(kind = "threshold") {
    if (!state.settings.sound || !audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = kind === "complete" ? "square" : "sine";
    oscillator.frequency.value = kind === "complete" ? 260 : 760;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(kind === "complete" ? 0.25 : 0.16, audioContext.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + (kind === "complete" ? 0.55 : 0.12));
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + (kind === "complete" ? 0.58 : 0.14));
  }

  function alertVisual(kind, timerId) {
    document.body.classList.remove("flash-threshold", "flash-complete");
    void document.body.offsetWidth;
    document.body.classList.add(kind === "complete" ? "flash-complete" : "flash-threshold");
    const card = document.querySelector(`[data-timer-card="${timerId}"]`);
    if (card) {
      card.classList.remove("alert");
      void card.offsetWidth;
      card.classList.add("alert");
    }
  }

  function triggerTimerAlert(timer, threshold, kind = "threshold") {
    if (timer.alerted.includes(threshold.at)) return;
    timer.alerted.push(threshold.at);
    beep(kind);
    alertVisual(kind, timer.id);
    announce(`${timer.label}: ${threshold.label}`);
  }

  function elapsedFor(item) {
    return item.running && item.startedAt ? item.elapsed + (Date.now() - item.startedAt) / 1000 : item.elapsed;
  }

  function updateRunningValue(item) {
    if (!item.running || !item.startedAt) return false;
    const previous = item.elapsed;
    const current = Date.now();
    item.elapsed = Math.min(item.duration, item.elapsed + (current - item.startedAt) / 1000);
    item.startedAt = current;
    item.thresholds.forEach(threshold => {
      if (previous < threshold.at && item.elapsed >= threshold.at) {
        const isLast = threshold.at >= item.duration;
        triggerTimerAlert(item, threshold, isLast ? "complete" : "threshold");
      }
    });
    if (item.elapsed >= item.duration) {
      item.running = false;
      item.startedAt = null;
      item.completed = true;
    }
    return Math.abs(item.elapsed - previous) > 0.01;
  }

  function updateClock() {
    const clock = state.activeMatch?.clock;
    if (!clock?.running || !clock.startedAt) return false;
    const previous = clock.elapsed;
    const current = Date.now();
    clock.elapsed = Math.min(clock.gameCap, clock.elapsed + (current - clock.startedAt) / 1000);
    clock.startedAt = current;
    if (!clock.halfAlerted && previous < clock.halfCap && clock.elapsed >= clock.halfCap) {
      clock.halfAlerted = true;
      beep("threshold");
      alertVisual("threshold", "clock");
      announce("Half-time cap superado");
    }
    if (!clock.capAlerted && previous < clock.gameCap && clock.elapsed >= clock.gameCap) {
      clock.capAlerted = true;
      clock.running = false;
      clock.startedAt = null;
      clock.status = "Time cap";
      beep("complete");
      alertVisual("complete", "clock");
      announce("Time cap cumplido");
    }
    return Math.abs(clock.elapsed - previous) > 0.01;
  }

  let lastPaint = 0;
  let lastPersist = 0;
  function tick(timestamp) {
    const match = state.activeMatch;
    if (match?.status === "active") {
      const changed = updateClock();
      Object.values(match.timers).forEach(timer => updateRunningValue(timer));
      if (changed || Object.values(match.timers).some(timer => timer.running)) {
        if (timestamp - lastPaint > 80) {
          updateDisplays();
          lastPaint = timestamp;
        }
        if (timestamp - lastPersist > 1000) {
          saveState();
          lastPersist = timestamp;
        }
      }
    }
    window.requestAnimationFrame(tick);
  }
  window.requestAnimationFrame(tick);

  function activeMatch() { return state.activeMatch || (state.activeMatch = makeMatch(state.settings.ruleset)); }

  function updateTimerConfig(match) {
    const config = getRuleset();
    const pull = match.timers.pull;
    pull.duration = config.pull.release;
    pull.thresholds = [{ at: config.pull.line, label: "Línea" }, { at: config.pull.ready, label: "Listo" }, { at: config.pull.release, label: "Pull" }];
    const call = match.timers.call;
    call.duration = config.call.restart;
    call.thresholds = [{ at: config.call.captain, label: "Capitanes" }, { at: config.call.contested, label: "Contestada" }, { at: config.call.restart, label: "Reiniciar" }];
    const timeout = match.timers.timeout;
    timeout.duration = config.timeoutLimit;
    timeout.thresholds = [{ at: 45, label: "30 s" }, { at: 60, label: "15 s" }, { at: config.timeoutDuration, label: "Ataque" }, { at: config.timeoutLimit, label: "Check" }];
    match.clock.gameCap = config.gameCap;
    match.clock.halfCap = config.halfCap;
    match.clock.halftime = config.halftime;
  }

  function setRunning(item, running) {
    if (running) {
      if (item.completed || item.elapsed >= item.duration) {
        item.elapsed = 0;
        item.completed = false;
        item.alerted = [];
      }
      item.running = true;
      item.startedAt = Date.now();
    } else if (item.running) {
      item.elapsed = elapsedFor(item);
      item.running = false;
      item.startedAt = null;
    }
  }

  function toggleTimer(id) {
    unlockAudio();
    const match = activeMatch();
    if (id === "clock") {
      if (match.clock.capAlerted) { showToast("El time cap ya fue alcanzado."); return; }
      if (match.clock.running) {
        match.clock.elapsed += (Date.now() - match.clock.startedAt) / 1000;
        match.clock.running = false;
        match.clock.startedAt = null;
        match.clock.status = "Pausado";
      } else {
        match.clock.running = true;
        match.clock.startedAt = Date.now();
        match.clock.status = "Corriendo";
      }
      saveState(); renderDashboard(); return;
    }
    const timer = match.timers[id];
    if (!timer) return;
    setRunning(timer, !timer.running);
    if (id === "timeout" && !timer.running) match.timeoutState.activeTeam = null;
    saveState();
    renderDashboard();
  }

  function startTimeout(teamIndex) {
    unlockAudio();
    const match = activeMatch();
    const timer = match.timers.timeout;
    if (timer.running) { showToast("Ya hay un time-out corriendo."); return; }
    const config = getRuleset();
    if (match.timeoutState.usages[teamIndex] >= config.timeoutsPerTeam) {
      showToast(`${match.teams[teamIndex].name} no tiene más time-outs disponibles.`);
      return;
    }
    match.timeoutState.activeTeam = teamIndex;
    match.timeoutState.mode = match.clock.running ? "Durante el punto" : "Entre puntos";
    match.timeoutState.usages[teamIndex] += 1;
    match.events.push({ type: "timeout", team: teamIndex, mode: match.timeoutState.mode, at: nowIso() });
    timer.elapsed = 0; timer.alerted = []; timer.completed = false;
    setRunning(timer, true);
    saveState(); renderDashboard();
  }

  function timerState(timer) {
    if (timer.completed) return { label: "Completado", className: "complete" };
    if (timer.running) return { label: "Corriendo", className: "running" };
    if (timer.elapsed > 0) return { label: "Pausado", className: "paused" };
    return { label: "Preparado", className: "" };
  }

  function clockState(clock) {
    if (clock.status === "Time cap") return { label: "Time cap", className: "complete" };
    if (clock.running) return { label: "Corriendo", className: "running" };
    if (clock.elapsed > 0) return { label: clock.halfAlerted ? "Half-time cap" : "Pausado", className: clock.halfAlerted ? "alert" : "paused" };
    return { label: "Preparado", className: "" };
  }

  function thresholdsMarkup(timer) {
    return timer.thresholds.map((threshold, index) => {
      const hit = timer.alerted.includes(threshold.at);
      const last = threshold.at >= timer.duration;
      return `<span class="threshold ${hit ? "is-hit" : ""} ${hit && last ? "is-last" : ""}">${esc(threshold.label)}<br><b>${fmt(threshold.at)}</b></span>`;
    }).join("");
  }

  function statusMarkup(status) {
    return `<span class="status-line ${status.className}">${esc(status.label)}</span>`;
  }

  function teamStyle(team) {
    return `--team-color:${esc(team.color)};--team-ink:${contrastColor(team.color)};`;
  }

  function teamMarkup(team, index) {
    return `<article class="instrument team-card" style="${teamStyle(team)}" data-team-card="${index}">
      <div class="section-kicker">Equipo ${index + 1}</div>
      <button class="team-name-button" type="button" data-action="edit-team" data-team="${index}" aria-label="Editar nombre y color de ${esc(team.name)}">
        <strong class="team-name">${esc(team.name)}</strong><span class="team-edit" aria-hidden="true">✎</span>
      </button>
      <div class="score-display" aria-label="Puntaje de ${esc(team.name)}">${String(team.score).padStart(2, "0")}</div>
      <div class="score-actions">
        <button class="score-button" type="button" data-action="goal" data-team="${index}" aria-label="Sumar un gol a ${esc(team.name)}">+</button>
        <button class="score-button" type="button" data-action="minus" data-team="${index}" aria-label="Restar un punto a ${esc(team.name)}">−</button>
      </div>
      <div class="team-meta"><span>${team.goals.length} goles registrados</span><span>${index === 0 ? "A" : "B"}</span></div>
    </article>`;
  }

  function clockMarkup(match) {
    const status = clockState(match.clock);
    return `<article class="instrument clock-card ${status.className === "running" ? "is-running" : status.className === "paused" ? "is-paused" : status.className === "complete" ? "is-complete" : ""}" data-timer-card="clock" data-action="toggle-clock" role="button" tabindex="0" aria-label="Reloj de partido. ${status.label}. Tocar para pausar o reanudar">
      <div class="section-kicker">Reloj de partido</div>
      <span class="ruleset-badge">${esc(RULESETS[match.ruleset]?.label || "Personalizado")}</span>
      <div class="clock-display" data-display="clock">${fmt(match.clock.elapsed)}</div>
      <div class="clock-details">
        <div class="clock-detail"><b data-display="game-remaining">${fmt(match.clock.gameCap - match.clock.elapsed)}</b><span>Tiempo restante total</span></div>
        <div class="clock-detail"><b data-display="half-remaining">${fmt(match.clock.halfCap - match.clock.elapsed)}</b><span>Half-time cap</span></div>
      </div>
      <div class="status-line ${status.className}" data-display="clock-status">${esc(status.label)}</div>
      <div class="clock-actions">
        <button class="button button-icon" type="button" data-action="toggle-clock" aria-label="Pausar o reanudar reloj">${match.clock.running ? "Ⅱ" : "▶"}</button>
        <button class="button button-icon" type="button" data-action="timer-settings" data-timer="clock" aria-label="Configurar reloj">⚙</button>
      </div>
    </article>`;
  }

  function timerMarkup(match, id, title, description) {
    const timer = match.timers[id];
    const status = timerState(timer);
    const display = Math.max(0, timer.duration - timer.elapsed);
    const phase = id === "pull" ? (timer.elapsed < timer.thresholds[0].at ? "Preparar línea" : timer.elapsed < timer.thresholds[1].at ? "Ataque en línea" : timer.elapsed < timer.duration ? "Ataque listo" : "Pull") : id === "call" ? (timer.elapsed < timer.thresholds[0].at ? "Escuchar" : timer.elapsed < timer.thresholds[1].at ? "Capitanes" : timer.elapsed < timer.duration ? "Resolver" : "Reiniciar") : "Organizar juego";
    return `<article class="instrument timer-card ${status.className === "paused" ? "is-paused" : status.className === "complete" ? "is-complete" : ""}" data-timer-card="${id}" data-action="toggle-timer" data-timer="${id}" role="button" tabindex="0" aria-label="${esc(title)}. ${status.label}. Tocar para pausar o reanudar">
      <div class="timer-head"><div><div class="section-kicker">Cronómetro</div><h2 class="timer-title">${esc(title)}</h2><p class="micro-label">${esc(description)}</p></div><button class="timer-gear" type="button" data-action="timer-settings" data-timer="${id}" aria-label="Configurar ${esc(title)}">⚙</button></div>
      <div class="timer-display" data-display="${id}">${fmt(display)}</div>
      <div class="timer-phase"><strong data-display="${id}-phase">${esc(phase)}</strong><span>Próximo límite<br><b data-display="${id}-next">${esc(timer.thresholds.find(t => !timer.alerted.includes(t.at))?.label || "—")}</b></span></div>
      <div class="thresholds" data-display="${id}-thresholds">${thresholdsMarkup(timer)}</div>
      ${statusMarkup(status)}
      <div class="timer-footer"><span class="micro-label">Tocar para ${timer.running ? "pausar" : "reanudar"}</span><button class="timer-action" type="button" data-action="toggle-timer" data-timer="${id}">${timer.running ? "Pausar" : "Iniciar"}</button></div>
    </article>`;
  }

  function timeoutMarkup(match) {
    const timer = match.timers.timeout;
    const status = timerState(timer);
    const config = getRuleset();
    const active = match.timeoutState.activeTeam;
    return `<article class="instrument timer-card ${status.className === "paused" ? "is-paused" : status.className === "complete" ? "is-complete" : ""}" data-timer-card="timeout" data-action="toggle-timer" data-timer="timeout" role="button" tabindex="0" aria-label="Time-out. ${status.label}. Tocar para pausar o reanudar">
      <div class="timer-head"><div><div class="section-kicker">Cronómetro</div><h2 class="timer-title">Time-out</h2><p class="micro-label">${active === null ? "Elegí el equipo que lo inicia" : `Iniciado por ${esc(match.teams[active].name)}`}</p></div><button class="timer-gear" type="button" data-action="timer-settings" data-timer="timeout" aria-label="Configurar time-out">⚙</button></div>
      <div class="timer-display" data-display="timeout">${fmt(Math.max(0, timer.duration - timer.elapsed))}</div>
      <div class="timeout-controls">
        ${match.teams.map((team, index) => `<button class="timeout-button ${active === index && timer.running ? "is-active" : ""}" style="--team-color:${esc(team.color)};--team-ink:${contrastColor(team.color)}" type="button" data-action="timeout" data-team="${index}" ${match.timeoutState.usages[index] >= config.timeoutsPerTeam && active !== index ? "disabled" : ""}>TIME-OUT<br>${esc(team.name)}</button>`).join("")}
      </div>
      <div class="timeout-meta">${match.teams.map((team, index) => `<div><b>${config.timeoutsPerTeam - match.timeoutState.usages[index]}</b><span>${esc(team.name)} disponibles</span></div>`).join("")}</div>
      <div class="thresholds" data-display="timeout-thresholds">${thresholdsMarkup(timer)}</div>
      ${statusMarkup(status)}
      <div class="timer-footer"><span class="micro-label">${esc(match.timeoutState.mode || "Sin time-out activo")}</span><button class="timer-action" type="button" data-action="toggle-timer" data-timer="timeout">${timer.running ? "Pausar" : "Iniciar"}</button></div>
    </article>`;
  }

  function renderDashboard() {
    const match = activeMatch();
    updateTimerConfig(match);
    const rules = RULESETS[match.ruleset] || RULESETS.wfdf;
    app.innerHTML = `<section id="tablero" class="dashboard-screen">
      <div class="dashboard-head"><div><p class="eyebrow">Mesa de control · UFM</p><h1 class="page-title">ULTIMATE CLOCK</h1><p class="page-subtitle">Cronómetros claros para que el partido siga vivo, incluso bajo el sol.</p></div><div class="dashboard-actions"><span class="ruleset-badge">${esc(rules.label)}</span><button class="button button-quiet" type="button" data-action="history">Historial</button><button class="button button-primary" type="button" data-action="new-match">Nuevo partido</button></div></div>
      <div class="main-grid">${teamMarkup(match.teams[0], 0)}${clockMarkup(match)}${teamMarkup(match.teams[1], 1)}</div>
      <div class="timer-grid"><div>${timerMarkup(match, "pull", "Inicio de punto / pull", `Secuencia ${rules.pull.line} · ${rules.pull.ready} · ${rules.pull.release} segundos`)}</div><div>${timerMarkup(match, "call", "Resolución de llamada", `Avisos ${rules.call.captain} · ${rules.call.contested} · ${rules.call.restart} segundos`)}</div><div>${timeoutMarkup(match)}</div></div>
    </section>`;
    updateDisplays();
    updateThemeMeta();
  }

  function updateDisplays() {
    const match = state.activeMatch;
    if (!match) return;
    const clock = match.clock;
    const set = (selector, value) => document.querySelector(`[data-display="${selector}"]`)?.replaceChildren(document.createTextNode(value));
    set("clock", fmt(clock.elapsed));
    set("game-remaining", fmt(clock.gameCap - clock.elapsed));
    set("half-remaining", fmt(clock.halfCap - clock.elapsed));
    const status = clockState(clock);
    const clockStatus = document.querySelector('[data-display="clock-status"]');
    if (clockStatus) { clockStatus.textContent = status.label; clockStatus.className = `status-line ${status.className}`; }
    const clockCard = document.querySelector('[data-timer-card="clock"]');
    if (clockCard) clockCard.className = `instrument clock-card ${status.className === "running" ? "is-running" : status.className === "paused" ? "is-paused" : status.className === "complete" ? "is-complete" : ""}`;
    Object.values(match.timers).forEach(timer => {
      const current = timer.id === "timeout" ? Math.max(0, timer.duration - timer.elapsed) : Math.max(0, timer.duration - timer.elapsed);
      set(timer.id, fmt(current));
      const next = timer.thresholds.find(t => !timer.alerted.includes(t.at));
      set(`${timer.id}-next`, next?.label || "—");
      const phase = timer.id === "pull" ? (timer.elapsed < timer.thresholds[0].at ? "Preparar línea" : timer.elapsed < timer.thresholds[1].at ? "Ataque en línea" : timer.elapsed < timer.duration ? "Ataque listo" : "Pull") : timer.id === "call" ? (timer.elapsed < timer.thresholds[0].at ? "Escuchar" : timer.elapsed < timer.thresholds[1].at ? "Capitanes" : timer.elapsed < timer.duration ? "Resolver" : "Reiniciar") : "Organizar juego";
      set(`${timer.id}-phase`, phase);
      const status = timerState(timer);
      const card = document.querySelector(`[data-timer-card="${timer.id}"]`);
      if (card) {
        card.classList.toggle("is-paused", status.className === "paused");
        card.classList.toggle("is-complete", status.className === "complete");
        const stateEl = card.querySelector(".status-line");
        if (stateEl) { stateEl.textContent = status.label; stateEl.className = `status-line ${status.className}`; }
        const thresholds = card.querySelector(`[data-display="${timer.id}-thresholds"]`);
        if (thresholds) thresholds.innerHTML = thresholdsMarkup(timer);
      }
    });
  }

  function renderSettings(focusTimer = "") {
    const config = getRuleset();
    const customTheme = state.customThemes.find(theme => theme.id === state.settings.theme);
    const vars = customTheme?.vars || {};
    const themeOptions = [...BUILT_IN_THEMES, ...state.customThemes].map(theme => `<button class="mode-option ${state.settings.theme === theme.id ? "active" : ""}" type="button" data-action="apply-theme" data-theme="${esc(theme.id)}" style="--mode-swatch:${esc(theme.swatch || theme.vars?.accent || "#f5c532")}"><strong>${esc(theme.name)}</strong><small>${state.settings.theme === theme.id ? "Activo" : "Aplicar"}</small></button>`).join("");
    const colorFields = THEME_VARS.map(([key, label, fallback]) => `<div class="field"><label for="theme-${key}">${label}</label><input id="theme-${key}" type="color" value="${esc(vars[key] || fallback)}" data-custom-theme="${key}"></div>`).join("");
    app.innerHTML = `<section class="settings-screen"><div class="dashboard-head"><div><p class="eyebrow">Configuración</p><h1 class="page-title">Prepará la cancha</h1><p class="page-subtitle">Los cambios se guardan automáticamente en este dispositivo.</p></div><button class="button button-primary" type="button" data-action="back-dashboard">Volver al tablero</button></div>
      <section class="settings-section"><h2>Reglamento y sonido</h2><div class="settings-row"><div class="field"><label for="ruleset">Perfil de reglamento</label><select id="ruleset" data-setting="ruleset">${Object.entries(RULESETS).map(([id, rule]) => `<option value="${id}" ${state.settings.ruleset === id ? "selected" : ""}>${esc(rule.label)}</option>`).join("")}</select></div><div class="field"><label for="sound">Alertas</label><select id="sound" data-setting="sound"><option value="on" ${state.settings.sound ? "selected" : ""}>Sonido y flash activos</option><option value="off" ${!state.settings.sound ? "selected" : ""}>Solo flash visual</option></select></div></div></section>
      <section class="settings-section"><h2>Perfiles visuales</h2><div class="mode-options">${themeOptions}</div><div class="form-actions"><button class="button" type="button" data-action="new-theme">＋ Nuevo modo</button></div>${customTheme ? `<div class="settings-row" id="custom-theme-fields">${colorFields}</div><p class="micro-label">Modo activo: ${esc(customTheme.name)} · cada color se guarda al cambiarlo.</p>` : `<p class="micro-label">Para modificar colores, creá un modo personalizado basado en el perfil activo.</p>`}</section>
      <section class="settings-section"><h2>Valores de cronómetros</h2><div class="timer-config-grid">${timerConfigMarkup("pull", "Inicio de punto / pull", [["pull-line", "Línea", config.pull.line], ["pull-ready", "Ataque listo", config.pull.ready], ["pull-release", "Pull", config.pull.release]])}${timerConfigMarkup("call", "Resolución de llamada", [["call-captain", "Capitanes", config.call.captain], ["call-contested", "Contestada", config.call.contested], ["call-restart", "Reiniciar", config.call.restart]])}${timerConfigMarkup("game", "Reloj de partido", [["game-cap", "Time cap", config.gameCap], ["half-cap", "Half-time cap", config.halfCap], ["halftime", "Descanso", config.halftime]])}</div><div class="settings-row">${timerConfigMarkup("timeout", "Time-out", [["timeout-duration", "Ataque listo", config.timeoutDuration], ["timeout-limit", "Check", config.timeoutLimit], ["timeouts-count", "Usos por equipo", config.timeoutsPerTeam]])}</div></section>
    </section>`;
    if (focusTimer) document.getElementById(`config-${focusTimer}`)?.scrollIntoView({ block: "center" });
  }

  function timerConfigMarkup(id, title, fields) {
    return `<div class="timer-config" id="config-${id}"><h3>${esc(title)}</h3>${fields.map(([key, label, value]) => `<div class="field"><label for="${key}">${esc(label)} (s)</label><input id="${key}" type="number" min="1" step="1" value="${esc(value)}" data-config="${key}"></div>`).join("")}</div>`;
  }

  function renderHistory() {
    const items = state.savedMatches;
    app.innerHTML = `<section class="history-screen"><div class="dashboard-head"><div><p class="eyebrow">Registro de partidos</p><h1 class="page-title">Historial</h1><p class="page-subtitle">Las planillas quedan guardadas solo en este dispositivo.</p></div><button class="button button-primary" type="button" data-action="back-dashboard">Volver al tablero</button></div>${items.length ? `<div class="history-list">${items.map(match => `<button class="history-item" type="button" data-history="${esc(match.id)}"><span><span class="history-teams">${esc(match.teams[0].name)} <small>vs</small> ${esc(match.teams[1].name)}</span><span class="history-date">${dateLabel(match.savedAt || match.createdAt)} · ${esc(RULESETS[match.ruleset]?.label || "Personalizado")}</span></span><strong class="history-score">${match.teams[0].score} — ${match.teams[1].score}</strong></button>`).join("")}</div>` : `<div class="history-empty"><p class="section-kicker">Todavía no hay partidos guardados.</p><h2 class="page-title">La planilla aparece acá al tocar guardar.</h2><div class="form-actions"><button class="button button-primary" type="button" data-action="back-dashboard">Comenzar un partido</button></div></div>`}</section>`;
  }

  function openModal(title, body, options = {}) {
    modalRoot.innerHTML = `<div class="modal-backdrop" role="presentation"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><header class="modal-header"><h2 class="modal-title" id="modalTitle">${esc(title)}</h2><button class="modal-close" type="button" data-action="close-modal" aria-label="Cerrar">×</button></header><div class="modal-body">${body}</div></section></div>`;
    modalRoot.querySelector(".modal-close")?.focus();
  }

  function closeModal() { modalRoot.innerHTML = ""; }

  function openThemes() {
    const options = [...BUILT_IN_THEMES, ...state.customThemes].map(theme => `<button class="mode-option ${state.settings.theme === theme.id ? "active" : ""}" type="button" data-action="apply-theme" data-theme="${esc(theme.id)}" style="--mode-swatch:${esc(theme.swatch || theme.vars?.accent || "#f5c532")}"><strong>${esc(theme.name)}</strong><small>${state.settings.theme === theme.id ? "Activo" : "Aplicar"}</small></button>`).join("");
    openModal("Perfil visual", `<p>Elegí una lectura para la cancha. Los modos de alto contraste están pensados para luz directa.</p><div class="mode-options">${options}</div><div class="modal-actions"><button class="button" type="button" data-action="new-theme">＋ Nuevo modo</button><button class="button button-primary" type="button" data-action="settings">Personalizar valores</button></div>`);
  }

  function openInfo() {
    openModal("Sobre Ultimate Clock", `<div class="info-copy"><p><strong>Desarrollado por Juan Martínez García</strong>, de la comunidad de <a href="https://www.instagram.com/ultimatefrisbeemza/" target="_blank" rel="noreferrer">Ultimate Frisbee Mendoza</a>.</p><p>Esta app es gratuita para la comunidad del Ultimate Frisbee.</p></div><div class="info-links"><button type="button" data-action="placeholder-link">Visitá mi sitio <span>URL pendiente</span></button><a href="https://iona.ar/" target="_blank" rel="noreferrer">Conocé más proyectos ↗</a><button type="button" data-action="placeholder-link">Apoyá este proyecto <span>Próximamente</span></button></div>`);
  }

  function openGoal(teamIndex) {
    const team = activeMatch().teams[teamIndex];
    openModal("Registrar gol", `<p class="goal-note">Sumá un punto para <strong>${esc(team.name)}</strong>. Los dos campos son opcionales.</p><form data-form="goal" data-team="${teamIndex}"><div class="field"><label for="assist">Pase</label><input id="assist" name="assist" autocomplete="off" placeholder="Quién dio el pase gol"></div><div class="field"><label for="scorer">Gol</label><input id="scorer" name="scorer" autocomplete="off" placeholder="Quién recibió y anotó"></div><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button-primary" type="submit">Registrar gol</button></div></form>`);
  }

  function openMinus(teamIndex) {
    const team = activeMatch().teams[teamIndex];
    openModal("Corregir puntaje", `<p>¿Querés restar un punto a <strong>${esc(team.name)}</strong>? La corrección queda registrada como ajuste manual.</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button-danger" type="button" data-action="confirm-minus" data-team="${teamIndex}">Restar punto</button></div>`);
  }

  function openTeamEditor(teamIndex) {
    const team = activeMatch().teams[teamIndex];
    const ink = contrastColor(team.color);
    openModal(`Equipo ${teamIndex + 1}`, `<form data-form="team" data-team="${teamIndex}"><div class="field"><label for="team-name">Nombre del equipo</label><input id="team-name" name="name" value="${esc(team.name)}" maxlength="30" autocomplete="off"></div><div class="field"><label for="team-color">Color del equipo</label><input id="team-color" name="color" type="color" value="${esc(team.color)}"></div><div class="color-preview" id="colorPreview" style="background:${esc(team.color)};color:${ink}">Vista previa</div><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button-primary" type="submit">Guardar equipo</button></div></form>`);
  }

  function openReset() {
    openModal("Reiniciar contadores", `<p>¿Reiniciar todos los contadores? El historial guardado y los perfiles no se borrarán.</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button-danger" type="button" data-action="confirm-reset">Reiniciar contadores</button></div>`);
  }

  function openNewTheme() {
    openModal("Nuevo modo", `<form data-form="theme"><div class="field"><label for="theme-name">Nombre del modo</label><input id="theme-name" name="name" maxlength="28" placeholder="Ej.: Verde cancha" required autocomplete="off"></div><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button-primary" type="submit">Crear y personalizar</button></div></form>`);
  }

  function openSheet(match) {
    const events = match.events?.length ? `<ul class="event-list">${match.events.map(event => `<li><time>${dateLabel(event.at)}</time><span>${event.type === "goal" ? `Gol de ${esc(match.teams[event.team].name)}${event.scorer ? ` · ${esc(event.scorer)}` : ""}${event.assist ? ` · pase: ${esc(event.assist)}` : ""}` : event.type === "timeout" ? `Time-out de ${esc(match.teams[event.team].name)} · ${esc(event.mode)}` : `Ajuste de puntaje: ${esc(match.teams[event.team].name)}`}</span></li>`).join("")}</ul>` : `<p class="micro-label">No hubo eventos registrados.</p>`;
    openModal("Planilla guardada", `<p class="section-kicker">${dateLabel(match.savedAt || match.createdAt)} · ${esc(RULESETS[match.ruleset]?.label || "Personalizado")}</p><h3 class="page-title">${esc(match.teams[0].name)} ${match.teams[0].score} — ${match.teams[1].score} ${esc(match.teams[1].name)}</h3><div class="sheet-grid"><div class="sheet-stat"><b>${fmt(match.clock.elapsed)}</b><span>Tiempo de partido</span></div><div class="sheet-stat"><b>${match.teams[0].goals.length + match.teams[1].goals.length}</b><span>Goles registrados</span></div><div class="sheet-stat"><b>${match.events?.length || 0}</b><span>Eventos</span></div></div><h3 class="section-kicker" style="margin-top:1.5rem">Eventos del partido</h3>${events}`);
  }

  function saveMatch() {
    const match = activeMatch();
    if (match.status === "saved") { showToast("Este partido ya está guardado."); return; }
    match.status = "saved";
    match.savedAt = nowIso();
    match.clock.running = false;
    Object.values(match.timers).forEach(timer => { timer.running = false; timer.startedAt = null; });
    state.savedMatches.unshift(clone(match));
    state.activeMatch = null;
    saveState();
    showToast("Planilla guardada en el historial.");
    renderHistory();
  }

  function resetMatch() {
    state.activeMatch = makeMatch(state.settings.ruleset);
    saveState();
    closeModal();
    renderDashboard();
    showToast("Contadores reiniciados.");
  }

  function applyConfig(key, value) {
    const config = state.settings.overrides;
    const numeric = Math.max(1, Number(value) || 1);
    const map = { "pull-line": ["pull", "line"], "pull-ready": ["pull", "ready"], "pull-release": ["pull", "release"], "call-captain": ["call", "captain"], "call-contested": ["call", "contested"], "call-restart": ["call", "restart"], "game-cap": ["clock", "gameCap"], "half-cap": ["clock", "halfCap"], halftime: ["clock", "halftime"], "timeout-duration": ["timeout", "duration"], "timeout-limit": ["timeout", "limit"], "timeouts-count": ["timeout", "count"] };
    const target = map[key];
    if (!target) return;
    config[target[0]] = { ...(config[target[0]] || {}), [target[1]]: numeric };
    state.settings.ruleset = "custom";
    const match = activeMatch();
    match.ruleset = "custom";
    const custom = clone(RULESETS.custom);
    Object.entries(config).forEach(([group, values]) => Object.assign(custom[group] || {}, values));
    RULESETS.custom = custom;
    updateTimerConfig(match);
    saveState();
    showToast("Valor guardado en modo Personalizado.");
  }

  function handleAction(actionElement) {
    const action = actionElement.dataset.action;
    if (action === "toggle-menu") {
      const menu = document.querySelector(".header-actions");
      const open = menu.classList.toggle("is-open");
      actionElement.setAttribute("aria-expanded", String(open));
    }
    if (action === "themes") openThemes();
    if (action === "settings" || action === "timer-settings") { closeModal(); renderSettings(actionElement.dataset.timer || ""); }
    if (action === "info") openInfo();
    if (action === "reset") openReset();
    if (action === "save") saveMatch();
    if (action === "history") renderHistory();
    if (action === "back-dashboard") { state.activeMatch = state.activeMatch || makeMatch(state.settings.ruleset); renderDashboard(); }
    if (action === "new-match") { state.activeMatch = makeMatch(state.settings.ruleset); saveState(); renderDashboard(); showToast("Nuevo partido preparado."); }
    if (action === "close-modal") closeModal();
    if (action === "confirm-reset") resetMatch();
    if (action === "confirm-minus") {
      const index = Number(actionElement.dataset.team); const team = activeMatch().teams[index];
      if (team.score > 0) { team.score -= 1; team.adjustments.push({ at: nowIso(), delta: -1 }); activeMatch().events.push({ type: "adjustment", team: index, at: nowIso() }); }
      closeModal(); saveState(); renderDashboard(); showToast("Puntaje corregido.");
    }
    if (action === "goal") openGoal(Number(actionElement.dataset.team));
    if (action === "minus") openMinus(Number(actionElement.dataset.team));
    if (action === "edit-team") openTeamEditor(Number(actionElement.dataset.team));
    if (action === "toggle-clock") toggleTimer("clock");
    if (action === "toggle-timer") toggleTimer(actionElement.dataset.timer);
    if (action === "timeout") startTimeout(Number(actionElement.dataset.team));
    if (action === "new-theme") openNewTheme();
    if (action === "apply-theme") { applyTheme(actionElement.dataset.theme); closeModal(); renderSettings(); showToast(`Modo ${themeName(actionElement.dataset.theme)} activo.`); }
    if (action === "placeholder-link") showToast("Este enlace queda pendiente de configurar.");
  }

  document.addEventListener("click", event => {
    const historyItem = event.target.closest("[data-history]");
    if (historyItem) { const match = state.savedMatches.find(item => item.id === historyItem.dataset.history); if (match) openSheet(match); return; }
    const action = event.target.closest("[data-action]");
    if (action) { event.preventDefault(); handleAction(action); return; }
    const timerCard = event.target.closest('[data-action="toggle-timer"], [data-action="toggle-clock"]');
    if (timerCard && !event.target.closest("button")) { toggleTimer(timerCard.dataset.timer || "clock"); }
  });

  document.addEventListener("keydown", event => {
    const card = event.target.closest('[data-action="toggle-timer"], [data-action="toggle-clock"]');
    if (card === event.target && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); toggleTimer(card.dataset.timer || "clock"); }
    if (event.key === "Escape" && modalRoot.innerHTML) closeModal();
  });

  document.addEventListener("submit", event => {
    const form = event.target;
    event.preventDefault();
    if (form.dataset.form === "goal") {
      const index = Number(form.dataset.team); const team = activeMatch().teams[index];
      const data = new FormData(form); const goal = { at: nowIso(), assist: String(data.get("assist") || "").trim(), scorer: String(data.get("scorer") || "").trim() };
      team.score += 1; team.goals.push(goal); activeMatch().events.push({ type: "goal", team: index, assist: goal.assist, scorer: goal.scorer, at: goal.at });
      closeModal(); saveState(); renderDashboard(); showToast(`Gol registrado para ${team.name}.`); announce(`Gol de ${team.name}`);
    }
    if (form.dataset.form === "team") {
      const index = Number(form.dataset.team); const data = new FormData(form); const team = activeMatch().teams[index];
      team.name = String(data.get("name") || `Equipo ${index + 1}`).trim() || `Equipo ${index + 1}`; team.color = String(data.get("color") || team.color);
      closeModal(); saveState(); renderDashboard(); showToast("Datos del equipo guardados.");
    }
    if (form.dataset.form === "theme") {
      const data = new FormData(form); const id = uid("theme"); const name = String(data.get("name") || "Modo nuevo").trim();
      state.customThemes.push({ id, name, vars: currentThemeVars() }); applyTheme(id); closeModal(); renderSettings(); showToast(`Modo ${name} creado.`);
    }
  });

  document.addEventListener("input", event => {
    if (event.target.id === "team-color") {
      const preview = document.getElementById("colorPreview");
      if (preview) { preview.style.background = event.target.value; preview.style.color = contrastColor(event.target.value); }
    }
    if (event.target.dataset.customTheme) {
      const custom = state.customThemes.find(theme => theme.id === state.settings.theme);
      if (custom) { custom.vars[event.target.dataset.customTheme] = event.target.value; applyTheme(custom.id); saveState(); }
    }
  });

  document.addEventListener("change", event => {
    if (event.target.dataset.setting === "ruleset") {
      state.settings.ruleset = event.target.value;
      if (event.target.value !== "custom") state.settings.overrides = {};
      const match = activeMatch(); match.ruleset = event.target.value; updateTimerConfig(match); saveState(); renderSettings(); showToast(`Perfil ${RULESETS[event.target.value].label} activo.`);
    }
    if (event.target.dataset.setting === "sound") { state.settings.sound = event.target.value === "on"; saveState(); showToast(state.settings.sound ? "Alertas sonoras activas." : "Alertas sonoras desactivadas."); }
    if (event.target.dataset.config) { applyConfig(event.target.dataset.config, event.target.value); }
  });

  applyTheme(state.settings.theme);
  renderDashboard();
})();
