(() => {
  "use strict";

  const RULES_URL = "https://usaultimate.org/rules/";
  const STORAGE_KEY = "punto-por-punto-v1";
  const CHAPTERS = [
    { id: "inicio", short: "Antes", title: "Antes del pull", range: "§§1–9", tone: "pear", description: "Cómo empieza el punto, quiénes juegan y qué pasa antes del pull." },
    { id: "disco", short: "Disco", title: "El disco en juego", range: "§§10–14", tone: "cyan", description: "Reinicios, límites, end zones, goles y cambios de posesión." },
    { id: "marca", short: "Marca", title: "Pivote y marca", range: "§§15–19", tone: "mint", description: "Stall, marking violations, llamadas, travels y picks." },
    { id: "seguridad", short: "Seguro", title: "Jugar con cuidado", range: "§§20–21", tone: "coral", description: "Contacto, faltas, juego peligroso y derechos de espacio." },
    { id: "spirit", short: "Spirit", title: "Spirit y variantes", range: "§§22–23 · A–G", tone: "cyan", description: "Observers, etiqueta y adaptaciones para otros formatos." }
  ];

  const SCENARIOS = [
    {
      id: "basics", chapter: "inicio", sections: [1, 2], title: "La idea del juego",
      context: "Tu equipo recibe el disco y busca avanzar hacia la zona de anotación rival.",
      prompt: "¿Cómo avanza el disco?",
      options: ["Pasándolo a otra persona", "Corriendo con el disco", "Pateándolo hacia adelante"], answer: 0,
      hint: "Pensá en qué acción hace avanzar al disco y en el principio de juego sin contacto.",
      explain: "Ultimate se juega entre dos equipos de siete. El disco avanza mediante pases; quien lo tiene no puede correr con él. El autoarbitraje y el Spirit of the Game ponen la responsabilidad del juego limpio en cada persona.",
      source: "USAU §§1–2", diagram: "pass"
    },
    {
      id: "simultaneous-catch", chapter: "inicio", sections: [3], title: "Dos manos en el disco",
      context: "Una atacante y una defensora atrapan el disco al mismo tiempo.",
      prompt: "¿Quién conserva la posesión?",
      options: ["La atacante", "La defensora", "Se repite el pull"], answer: 0,
      hint: "La definición oficial resuelve expresamente una captura simultánea entre ataque y defensa.",
      explain: "Si jugadores de ataque y defensa atrapan el disco simultáneamente, la persona atacante mantiene la posesión y pasa a ser quien lanza.",
      source: "USAU §3.I.6", diagram: "catch"
    },
    {
      id: "sideline", chapter: "inicio", sections: [4, 5], title: "La línea lateral",
      context: "Una receptora atrapa el disco, pero su primer apoyo toca la línea lateral.",
      prompt: "¿Ese apoyo cuenta como dentro de la cancha?",
      options: ["No: la línea lateral está fuera", "Sí: la línea pertenece al campo", "Solo cuenta si pisa un cono"], answer: 0,
      hint: "Las líneas perimetrales delimitan el campo, pero no forman parte de él.",
      explain: "La superficie de juego completa está dentro; las líneas perimetrales no. Además, el equipo debe usar calzado seguro: los tapones peligrosos, como los metálicos, no están permitidos.",
      source: "USAU §§4–5", diagram: "sideline"
    },
    {
      id: "game-and-timeouts", chapter: "inicio", sections: [6, 7], title: "Estructura y pausa",
      context: "Antes del partido, la organización confirma que se usa el formato estándar de USAU.",
      prompt: "¿Cuál es el game total estándar y cuántos team timeouts tiene cada equipo por mitad?",
      options: ["15 goles y 2 por mitad", "11 goles y 1 por mitad", "21 goles y 3 por mitad"], answer: 0,
      hint: "La respuesta aplica al formato estándar; un evento puede anunciar ajustes logísticos antes de competir.",
      explain: "El game total estándar es 15 y cada equipo dispone de dos team timeouts por mitad. El organizador puede fijar ciertas variantes logísticas antes del partido.",
      source: "USAU §§1.B.2, 6.B.1 y 7.B", diagram: "center"
    },
    {
      id: "substitution-pull", chapter: "inicio", sections: [8, 9], title: "Después del punto",
      context: "Tu equipo acaba de anotar. Todavía no señaló que está listo para el siguiente pull.",
      prompt: "¿Qué combinación describe el reinicio estándar?",
      options: ["Puede sustituir; quien anotó hace el pull", "Solo puede sustituir tras el pull", "El equipo que recibió el punto vuelve a tirar"], answer: 0,
      hint: "Separá el cambio de jugadores del orden de quién pone el disco en juego.",
      explain: "Las sustituciones normales se hacen después de un gol y antes de que ese equipo señale readiness. Tras el gol, los equipos cambian la dirección de ataque y el equipo que anotó hace el pull.",
      source: "USAU §§8.A.1 y 9.A–B", diagram: "pull"
    },
    {
      id: "live-restart", chapter: "disco", sections: [10], title: "Disco listo para jugar",
      context: "Tras un turnover, el disco está vivo y debe jugarse desde un punto distinto de donde se ganó la posesión.",
      prompt: "¿Qué debe hacer quien lanza antes de pasar?",
      options: ["Fijar el pivote y tocar el disco al suelo", "Esperar un silbato del observer", "Lanzar desde cualquier lugar sin detenerse"], answer: 0,
      hint: "Cuando el disco vivo se pone en juego desde otro punto, hay dos pasos antes del pase.",
      explain: "Quien lanza establece el pivote en el lugar apropiado y toca el disco con el suelo antes de intentar un pase. Ese reinicio no requiere una pausa previa del juego.",
      source: "USAU §10.C", diagram: "restart"
    },
    {
      id: "pass-out", chapter: "disco", sections: [11, 14], title: "Pase que se va afuera",
      context: "Un pase incompleto toca el área fuera de la línea perimetral.",
      prompt: "¿Qué ocurre con la posesión y el reinicio?",
      options: ["Turnover; el disco se pone en juego cerca de la salida", "El ataque conserva y saca desde el fondo", "Se repite el pase desde el lanzamiento"], answer: 0,
      hint: "Combiná el efecto de un pase incompleto con el punto de puesta en juego de un disco out.",
      explain: "El pase incompleto produce un turnover y el disco queda fuera de límites. El equipo que gana la posesión lo lleva al punto de la zona central más cercano al lugar por donde salió, fija el pivote y toca el disco al suelo antes de ponerlo en juego.",
      source: "USAU §§11.E, 11.H y 14.A–B", diagram: "sideline"
    },
    {
      id: "own-endzone", chapter: "disco", sections: [12], title: "Turnover en tu end zone",
      context: "Tu equipo gana la posesión por un turnover dentro de la end zone que está defendiendo.",
      prompt: "¿Qué puede hacer quien recoge el disco?",
      options: ["Fijar pivote ahí o llevarlo directo a la goal line", "Anotar automáticamente", "Lanzar desde cualquier zona sin fijar pivote"], answer: 0,
      hint: "La regla ofrece dos formas de poner en juego el disco dentro de la end zone propia.",
      explain: "Quien gana la posesión puede fijar el pivote en el lugar del disco o llevarlo directamente al punto más cercano de la goal line y jugarlo desde ahí. Fingir un pase o pausar antes de avanzar fija la primera opción.",
      source: "USAU §12.A", diagram: "endzone-own"
    },
    {
      id: "attacked-endzone", chapter: "disco", sections: [12, 13], title: "Con posesión en la end zone de ataque",
      context: "Una jugadora controla el disco en la end zone que ataca, pero no completó un gol válido.",
      prompt: "¿Dónde debe ponerlo en juego?",
      options: ["En la goal line más cercana", "Desde el fondo de la end zone", "En el brick mark"], answer: 0,
      hint: "Controlar el disco dentro de la end zone no siempre significa que hubo un gol.",
      explain: "Si un equipo gana o conserva la posesión en la end zone que ataca sin marcar, quien tiene el disco lo lleva directamente a la goal line más cercana al lugar donde se detuvo y lo pone en juego ahí.",
      source: "USAU §12.B", diagram: "endzone-attack"
    },
    {
      id: "goal-catch", chapter: "disco", sections: [13], title: "¿Gol o no gol?",
      context: "Una receptora atrapa un pase legal dentro de la end zone que ataca.",
      prompt: "¿Qué condición confirma el gol?",
      options: ["Controlarlo hasta terminar el contacto con el suelo", "Tocarlo con una mano antes de caer", "Que el disco cruce la goal line en el aire"], answer: 0,
      hint: "Importan la posesión y el primer contacto con el suelo relacionado con la captura.",
      explain: "El gol cuenta si una persona dentro del campo atrapa un pase legal en la end zone que ataca y conserva la posesión durante todo el contacto con el suelo relacionado con esa captura.",
      source: "USAU §13.A", diagram: "goal"
    },
    {
      id: "stall-ten", chapter: "marca", sections: [15], title: "La cuenta llega a diez",
      context: "La primera sílaba de «ten» suena mientras el disco sigue en las manos de quien lanza.",
      prompt: "¿Qué decisión corresponde?",
      options: ["Turnover por stall", "La cuenta vuelve a uno", "El pase sigue siendo legal aunque no se haya soltado"], answer: 0,
      hint: "La regla mira si el disco ya se había soltado antes de que se pronunciara «ten».",
      explain: "Si quien lanza no soltó el disco en la primera pronunciación de «ten», ocurre un turnover por stall. Si lo soltó, se espera el resultado del pase antes de resolver la llamada.",
      source: "USAU §15.D", diagram: "stall"
    },
    {
      id: "marking-violation", chapter: "marca", sections: [16], title: "La marca está demasiado cerca",
      context: "La persona que lanza llama «disc space» porque la marca invadió el espacio reglamentario.",
      prompt: "¿Se detiene el juego?",
      options: ["No; se corrige y la cuenta sigue uno abajo", "Sí; siempre vuelve a un check", "Sí; se entrega el disco a la defensa"], answer: 0,
      hint: "Una marking violation tiene un procedimiento distinto de una falta que detiene el juego.",
      explain: "La llamada la hace quien lanza; el juego no se detiene. La marca corrige su posición antes de seguir la cuenta desde el último número pronunciado menos uno.",
      source: "USAU §16.B–C", diagram: "mark"
    },
    {
      id: "continuation", chapter: "marca", sections: [17], title: "Llamada durante un pase",
      context: "Se llama una infracción cuando el disco ya está en el aire.",
      prompt: "¿Qué pasa primero?",
      options: ["Se determina el resultado del pase", "El disco vuelve de inmediato al lanzador", "El punto termina automáticamente"], answer: 0,
      hint: "La regla de continuación evita borrar un pase cuyo resultado todavía no se conoce.",
      explain: "Cuando una llamada ocurre con el disco en el aire o durante el acto de lanzar, se determina primero el resultado del pase. Después se resuelve si el juego se detiene o continúa según la regla y si la infracción afectó la jugada.",
      source: "USAU §17.C", diagram: "pass"
    },
    {
      id: "travel", chapter: "marca", sections: [18], title: "Pivote levantado",
      context: "La marca señala un travel antes de que quien lanza intente un pase.",
      prompt: "¿Qué debería pasar si no se disputa la llamada?",
      options: ["Vuelve al punto indicado y toca el disco al suelo", "El juego se detiene y la defensa gana el disco", "Puede seguir desde cualquier pivote nuevo"], answer: 0,
      hint: "Si no se intentó un pase, la llamada no detiene el juego: se corrige el punto del travel.",
      explain: "Sin un pase intentado, el juego no se detiene. La defensa indica el lugar del travel; quien lanza vuelve allí y toca el disco con el suelo antes de pasar. La cuenta queda pausada hasta que establezca el pivote.",
      source: "USAU §18.F.2", diagram: "pivot"
    },
    {
      id: "pick", chapter: "marca", sections: [19], title: "Corte obstruido",
      context: "Un defensor que está cubriendo a una atacante debe esquivar a otra persona y pierde la posición relativa.",
      prompt: "¿Quién puede llamar «pick» y cuándo?",
      options: ["El defensor obstruido, inmediatamente", "Cualquier compañero, al final del punto", "Solo quien tiene el disco, antes del pase"], answer: 0,
      hint: "La llamada está reservada a la persona cuya cobertura fue obstruida.",
      explain: "Solo la persona defensora obstruida puede llamar «pick» y debe hacerlo en voz alta inmediatamente después de la obstrucción. Luego se aplica la regla de continuación y, si corresponde, puede recuperar la posición relativa perdida.",
      source: "USAU §19.A–C", diagram: "pick"
    },
    {
      id: "dangerous-play", chapter: "seguridad", sections: [20], title: "Una jugada peligrosa",
      context: "Una persona corre sin mirar hacia un grupo y provoca una colisión significativa mientras todos buscan el disco.",
      prompt: "¿Qué debe priorizar el juego?",
      options: ["La seguridad; puede llamarse dangerous play", "Seguir porque el disco aún está en el aire", "Dar la posesión a quien llegó primero"], answer: 0,
      hint: "Dangerous play se evalúa por la conducta y el riesgo, no solo por quién atrapó el disco.",
      explain: "Una conducta temeraria que muestra desprecio por la seguridad o un riesgo significativo de lesión se trata como falta peligrosa. La llamada no queda anulada por la llegada del disco; primero se atiende la seguridad.",
      source: "USAU §20.B", diagram: "safety"
    },
    {
      id: "receiving-foul", chapter: "seguridad", sections: [20], title: "Contacto en el aire",
      context: "Con el disco en vuelo, un defensor hace contacto no incidental y afecta el intento de una rival de jugar el disco.",
      prompt: "¿Qué describe mejor esta acción?",
      options: ["Una receiving foul", "Un turnover automático", "Una marking violation"], answer: 0,
      hint: "Una receiving foul trata el contacto que interfiere con un intento de jugar el disco en el aire.",
      explain: "El contacto no incidental con una rival que intenta jugar el disco en vuelo puede ser una receiving foul. El contacto incidental que no afecta el juego no es, por sí solo, una falta.",
      source: "USAU §§3.B, 3.E y 20.E.2.A", diagram: "catch"
    },
    {
      id: "who-calls-foul", chapter: "seguridad", sections: [20], title: "¿Quién llama la falta?",
      context: "Una jugadora recibe contacto no incidental y lo percibe con claridad.",
      prompt: "¿Quién debe llamar «foul»?",
      options: ["La persona que recibió la falta", "Cualquier jugador cercano", "Solo el capitán"], answer: 0,
      hint: "La llamada de falta corresponde a quien fue objeto del contacto.",
      explain: "La falta puede ser llamada por la persona que recibió el contacto y debe anunciarse en voz alta inmediatamente después de que ocurra.",
      source: "USAU §20.C", diagram: "contact"
    },
    {
      id: "jump-landing", chapter: "seguridad", sections: [21], title: "Espacio para aterrizar",
      context: "Una receptora salta para atrapar el disco. Al despegar, otro jugador ya ocupa el lugar de aterrizaje y el camino directo.",
      prompt: "¿Puede aterrizar allí sin considerar ese espacio ocupado?",
      options: ["No; el lugar y el camino ya estaban ocupados", "Sí; saltar da prioridad absoluta", "Sí, si atrapa el disco con dos manos"], answer: 0,
      hint: "El derecho de aterrizar en otro lugar depende de si ese lugar y la trayectoria estaban libres al despegar.",
      explain: "Quien salta tiene derecho a aterrizar en el punto de despegue sin estorbo. Puede aterrizar en otro lugar solo si tanto el destino como el camino directo estaban desocupados al momento de despegar, y siempre debe intentar evitar el contacto.",
      source: "USAU §21.B", diagram: "air"
    },
    {
      id: "positioning", chapter: "seguridad", sections: [21], title: "Bloquear el pivote",
      context: "Una defensora se mueve para impedir que quien ataca tome el disco o establezca un pivote.",
      prompt: "¿Es una posición permitida?",
      options: ["No; la defensa no puede obstruir esas acciones", "Sí; la defensa puede bloquear cualquier lugar", "Sí, si todavía no empezó el stall"], answer: 0,
      hint: "La defensa tiene una restricción específica antes de que el ataque controle el disco.",
      explain: "La defensa no puede moverse de forma que obstruya al ataque para tomar posesión del disco o establecer un pivote. Además, no se pueden extender brazos o piernas para bloquear el movimiento de otra persona.",
      source: "USAU §21.C–D", diagram: "mark"
    },
    {
      id: "observer", chapter: "spirit", sections: [22], title: "No hay acuerdo sobre la llamada",
      context: "En un partido con observers, las dos personas directamente involucradas no pueden resolver una disputa rápidamente.",
      prompt: "¿Qué puede ocurrir?",
      options: ["Una puede pedir resolución al observer", "El coach decide quién tiene razón", "La persona que gritó primero gana la llamada"], answer: 0,
      hint: "Los observers apoyan la aplicación del reglamento en los partidos que los usan.",
      explain: "En partidos con observers, una persona directamente involucrada puede pedir su resolución; el observer también puede intervenir si la disputa no se resuelve a tiempo. Cuando resuelve, el juego se reinicia con un check.",
      source: "USAU §22.B.2", diagram: "discussion"
    },
    {
      id: "novice-etiquette", chapter: "spirit", sections: [23], title: "Alguien recién empieza",
      context: "Una persona nueva comete una infracción porque todavía no conoce esa regla.",
      prompt: "¿Qué conducta recomienda la etiqueta?",
      options: ["Parar y explicarle la infracción", "Dejar que siga sin decir nada", "Anotar la falta para discutirla después del partido"], answer: 0,
      hint: "El reglamento contempla expresamente la ignorancia sincera de una persona novata.",
      explain: "Cuando una persona novata comete una infracción por desconocimiento sincero, la práctica recomendada es detener el juego y explicarle qué pasó. La meta es que aprenda y que el juego siga con claridad.",
      source: "USAU §23.D", diagram: "discussion"
    },
    {
      id: "appendix-field", chapter: "spirit", sections: [], appendix: "A", title: "Leer la cancha",
      context: "Antes de entrenar, el equipo consulta el diagrama oficial de cancha.",
      prompt: "¿Qué muestra el anexo A?",
      options: ["Las zonas y líneas del campo", "Las señales de observers", "La secuencia de ratios mixtos"], answer: 0,
      hint: "El primer anexo es un dibujo para orientarse en el terreno de juego.",
      explain: "El anexo A presenta el diagrama de campo. Las zonas, líneas perimetrales y goal lines ayudan a ubicar los reinicios y las jugadas dentro/fuera.",
      source: "USAU Appendix A", diagram: "center"
    },
    {
      id: "appendix-mixed", chapter: "spirit", sections: [], appendix: "B", title: "Ultimate mixto",
      context: "Un torneo mixto usa la regla base de personal para el formato estándar, sin otra adaptación anunciada.",
      prompt: "¿Cuál es la proporción por defecto indicada en el anexo B?",
      options: ["4/3", "5/2", "6/1"], answer: 0,
      hint: "La proporción por defecto reparte siete lugares en dos grupos de cuatro y tres.",
      explain: "La proporción predeterminada para la división mixta es 4/3. Hay métodos alternativos para elegir la proporción y el organizador puede establecer reglas para su evento; confirmá siempre cuál se aplica.",
      source: "USAU Appendix B1.A", diagram: "teams"
    },
    {
      id: "appendix-map", chapter: "spirit", sections: [], appendix: "C–G", title: "Encontrar la variante",
      context: "Querés consultar una adaptación específica antes de jugar otra modalidad.",
      prompt: "¿Qué lista de anexos está bien emparejada?",
      options: ["C: conducta · D: señales · E: youth · F: beach · G: 4’s", "C: beach · D: mixto · E: observers · F: youth · G: señales", "C: señales · D: 4’s · E: beach · F: conducta · G: mixto"], answer: 0,
      hint: "Estos anexos no cambian automáticamente el formato estándar: identifican temas y variantes particulares.",
      explain: "Los anexos cubren sistemas de conducta, señales manuales, adaptaciones youth, Beach Ultimate y Ultimate 4’s. Revisá las reglas del evento para saber qué variante rige.",
      source: "USAU Appendices C–G", diagram: "teams"
    }
  ];

  const RULE_INDEX = [
    [1, "Fundamentos", "Ultimate estándar es 7 contra 7, sin contacto. Se avanza pasando; no se corre con el disco. Cada pase incompleto cambia la posesión."],
    [2, "Spirit of the Game", "Quienes juegan se autoarbitran y comparten la responsabilidad por el juego limpio, el respeto y la aplicación acordada de las reglas."],
    [3, "Definiciones", "Aclara términos como pivote, posesión, turnover, thrower, marker, in play, live y dead."],
    [4, "Cancha", "El campo es rectangular; las líneas perimetrales no forman parte del terreno de juego. Las goal lines separan zona central y end zones."],
    [5, "Equipamiento", "Disco apropiado, ropa segura, uniformes distinguibles y calzado sin partes peligrosas."],
    [6, "Estructura del partido", "Ordena inicio, game total, halftime y caps. El game total estándar es 15, salvo ajustes anunciados por el evento."],
    [7, "Timeouts", "Distingue team, injury, technical y spirit timeouts, cuándo pueden llamarse y cómo se reanuda el juego."],
    [8, "Sustituciones", "Las sustituciones normales se hacen tras un gol y antes de que el equipo que sustituye señale readiness; hay excepciones regladas."],
    [9, "Pull", "El juego empieza con un pull por mitad y después de cada gol. Tras anotar, los equipos cambian de dirección y quien anotó hace el pull."],
    [10, "Reiniciar y continuar", "Explica discos in play, live y dead, el check, self-check y cómo poner el disco en juego."],
    [11, "Dentro y fuera", "Define estado de jugadores y disco en relación con las líneas perimetrales y el punto de reinicio tras salir."],
    [12, "Posesión en end zone", "Distingue turnover en la zona propia de una posesión en la zona de ataque que no terminó en gol."],
    [13, "Scoring", "Un gol requiere atrapar un pase legal en la end zone de ataque y conservar la posesión durante el contacto con el suelo relacionado con la captura."],
    [14, "Turnovers", "Enumera cambios de posesión como pase incompleto, intercepción, disco out, drop, stall y travel, según corresponda."],
    [15, "Stall", "La marca cuenta de uno a diez con intervalos reglados. Si el disco no se soltó al pronunciar por primera vez «ten», hay turnover."],
    [16, "Marking violations", "Incluye fast count, double team, disc space, straddle, wrapping y vision blocking; estas llamadas normalmente no detienen el juego."],
    [17, "Llamadas y resolución", "Indica quién llama una infracción, cómo disputar una llamada y cómo aplicar la regla de continuación."],
    [18, "Travels", "Regula el establecimiento y mantenimiento del pivote y qué se hace cuando se llama un travel."],
    [19, "Picks", "Define la obstrucción de una persona defensora que está guardando a una atacante y cómo llamarla y resolverla."],
    [20, "Fouls", "Cubre contacto no incidental, faltas al lanzar/recibir y dangerous play, con sus procedimientos de resolución."],
    [21, "Positioning", "Establece derechos al espacio, el aterrizaje tras un salto y límites a la obstrucción de otras personas."],
    [22, "Observers", "Si se usan, pueden asistir con límites de tiempo, disputas y otros deberes definidos por el organizador."],
    [23, "Etiquette", "Invita a aclarar infracciones no llamadas, identificarse durante una disputa y enseñar las reglas a quien recién empieza."]
  ];

  const APPENDIX_INDEX = [
    ["A", "Field Diagram", "Diagrama de cancha y sus líneas."],
    ["B", "Mixed Rules and Adaptations", "Proporciones y adaptaciones para competencia mixta; la organización del evento puede fijar el método aplicable."],
    ["C", "Misconduct System", "Sistema de conducta en partidos con observers."],
    ["D", "Hand Signals", "Señales manuales del juego."],
    ["E", "Youth Rules Adaptations", "Adaptaciones de reglas para youth."],
    ["F", "Beach Ultimate Rules Adaptations", "Adaptaciones para Beach Ultimate."],
    ["G", "Ultimate 4’s Rules Adaptations", "Adaptaciones para Ultimate 4’s."]
  ];

  const appMain = document.getElementById("appMain");
  const storageNote = document.getElementById("storageNote");
  const restartDialog = document.getElementById("restartDialog");
  const navButtons = [...document.querySelectorAll("[data-view]")];
  const validIds = new Set(SCENARIOS.map((item) => item.id));
  let storageWritable = true;
  let state = readState();
  let currentView = "home";

  function freshProfile() {
    return { bestScore: 0, gamesStarted: 0, gamesFinished: 0, correctAnswers: 0, incorrectAnswers: 0, seen: [], reviewQueue: [] };
  }

  function freshState() { return { version: 1, profile: freshProfile(), run: null }; }

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return freshState();
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 1 || !saved.profile) throw new Error("Formato de progreso desconocido");
      const profile = { ...freshProfile(), ...saved.profile };
      profile.seen = Array.isArray(profile.seen) ? profile.seen.filter((id) => validIds.has(id)) : [];
      profile.reviewQueue = Array.isArray(profile.reviewQueue) ? [...new Set(profile.reviewQueue.filter((id) => validIds.has(id)))] : [];
      profile.bestScore = Math.max(0, Number(profile.bestScore) || 0);
      profile.gamesStarted = Math.max(0, Number(profile.gamesStarted) || 0);
      profile.gamesFinished = Math.max(0, Number(profile.gamesFinished) || 0);
      profile.correctAnswers = Math.max(0, Number(profile.correctAnswers) || 0);
      profile.incorrectAnswers = Math.max(0, Number(profile.incorrectAnswers) || 0);
      const run = validRun(saved.run);
      return { version: 1, profile, run };
    } catch (error) {
      storageWritable = false;
      showStorageNote("No pude leer el progreso guardado. Podés jugar igual; al iniciar una partida se creará un nuevo registro local.");
      return freshState();
    }
  }

  function validRun(run) {
    if (!run || !Array.isArray(run.ids)) return null;
    const ids = run.ids.filter((id) => validIds.has(id));
    if (!ids.length) return null;
    const chapterId = run.chapterId === "all" || CHAPTERS.some((chapter) => chapter.id === run.chapterId) ? run.chapterId : "all";
    return {
      chapterId,
      ids,
      index: Math.min(Math.max(0, Number(run.index) || 0), ids.length - 1),
      lives: Math.min(3, Math.max(0, Number(run.lives) || 0)),
      score: Math.max(0, Number(run.score) || 0),
      selected: Number.isInteger(run.selected) ? run.selected : null,
      feedback: run.feedback && typeof run.feedback.correct === "boolean" ? run.feedback : null,
      reviewScheduled: Array.isArray(run.reviewScheduled) ? run.reviewScheduled.filter((id) => validIds.has(id)) : [],
      finished: Boolean(run.finished),
      countedFinished: Boolean(run.countedFinished)
    };
  }

  function showStorageNote(message) {
    storageNote.textContent = message;
    storageNote.hidden = false;
  }

  function saveState() {
    if (!storageWritable) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageNote.hidden = true;
    } catch (error) {
      storageWritable = false;
      showStorageNote("El navegador no permite guardar este progreso. La partida sigue disponible mientras esta pestaña permanezca abierta.");
    }
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
  }

  function chapterById(id) { return CHAPTERS.find((chapter) => chapter.id === id) || CHAPTERS[0]; }
  function scenarioById(id) { return SCENARIOS.find((scenario) => scenario.id === id); }
  function visibleRun() { return state.run && !state.run.finished ? state.run : null; }
  function idsFor(chapterId) { return SCENARIOS.filter((scenario) => chapterId === "all" || scenario.chapter === chapterId).map((scenario) => scenario.id); }
  function plural(n, one, many = `${one}s`) { return `${n} ${n === 1 ? one : many}`; }

  function heartIcon(empty) {
    return `<svg class="life-icon${empty ? " is-empty" : ""}" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 5.9l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3 1-1a5.5 5.5 0 0 0 0-7.8Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  }

  function fieldSvg(id, pattern = "pass") {
    const title = {
      pass: "Pase hacia adelante", catch: "Disco disputado en el aire", sideline: "Disco cerca de la línea lateral", center: "Vista de cancha completa", pull: "Pull hacia el equipo receptor", restart: "Pivote y disco en reinicio", "endzone-own": "Posesión en la zona propia", "endzone-attack": "Posesión en la zona de ataque", goal: "Recepción dentro de la zona de anotación", turnover: "Cambio de posesión", stall: "Marca contando el stall", mark: "Lanzadora y marca", pivot: "Punto de pivote", pick: "Cortadora y defensora obstruidas", safety: "Jugadores disputan el disco con seguridad", contact: "Contacto durante recepción", air: "Trayectoria y espacio de aterrizaje", discussion: "Dos equipos resuelven una llamada", teams: "Distribución de los dos equipos"
    }[pattern] || "Cancha de Ultimate";
    const offense = [[95, 78], [150, 60], [205, 95], [244, 147], [320, 74], [378, 125], [445, 83]];
    const defense = [[112, 133], [172, 166], [226, 71], [289, 101], [345, 181], [405, 56], [468, 143]];
    const players = offense.map(([x, y], i) => `<g><circle class="player-o" cx="${x}" cy="${y}" r="11"/><text class="player-label" x="${x}" y="${y}">O${i + 1}</text></g>`).join("") + defense.map(([x, y], i) => `<g><circle class="player-d${i === 0 ? " player-mark" : ""}" cx="${x}" cy="${y}" r="11"/><text class="player-label" x="${x}" y="${y}">D${i + 1}</text></g>`).join("");
    const path = pattern === "pull" ? "M 72 148 Q 230 95 430 146" : pattern === "sideline" ? "M 250 120 Q 350 60 513 104" : pattern === "goal" || pattern === "endzone-attack" ? "M 350 140 Q 455 106 516 141" : "M 145 105 Q 260 44 386 113";
    return `<svg class="field-svg" viewBox="0 0 580 250" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">Cancha esquemática con siete atacantes, siete defensores, end zones y líneas de juego.</desc><rect class="field-zone" x="24" y="27" width="532" height="196" rx="8"/><rect class="field-line" x="24" y="27" width="532" height="196" rx="8"/><rect class="field-line" x="82" y="27" width="416" height="196"/><path class="field-line" d="M290 27v196"/><text class="field-label" x="35" y="48">END ZONE</text><text class="field-label" x="466" y="48">END ZONE</text><text class="field-label" x="254" y="239">ZONA CENTRAL</text><path class="flight-path" pathLength="42" d="${path}"/><circle class="motion-dot" cx="145" cy="105" r="4"/><circle class="disc-dot" cx="386" cy="113" r="8"/>${players}</svg>`;
  }

  function setView(view, shouldFocus = true) {
    currentView = view;
    navButtons.forEach((button) => {
      const current = button.dataset.view === view;
      button.classList.toggle("is-current", current);
      if (current) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    if (view === "home") renderHome();
    if (view === "game") renderGame();
    if (view === "progress") renderProgress();
    if (view === "rules") renderRules();
    if (shouldFocus) {
      requestAnimationFrame(() => appMain.querySelector("h1")?.focus({ preventScroll: true }));
    }
    saveState();
  }

  function renderHome() {
    const run = visibleRun();
    const mastered = SCENARIOS.filter((item) => state.profile.seen.includes(item.id)).length;
    const reviewCount = state.profile.reviewQueue.length;
    const continueLabel = run ? "Continuar partida" : state.run?.finished ? "Jugar de nuevo" : "Empezar recorrido";
    const action = run ? "resume" : "start-all";
    appMain.innerHTML = `
      <section class="home-hero" aria-labelledby="homeTitle">
        <div class="home-hero__copy">
          <p class="eyebrow">Ultimate · reglas USAU 2026–2027</p>
          <h1 id="homeTitle" tabindex="-1">Leé la jugada. Elegí qué pasa.</h1>
          <p class="lede">Aprendé Ultimate Frisbee resolviendo situaciones de cancha. Cada respuesta te explica la regla y te deja la referencia a mano.</p>
          <div class="hero-actions"><button class="btn btn--pear btn--lg" type="button" data-action="${action}">${continueLabel}<span aria-hidden="true">→</span></button><button class="text-button" type="button" data-view="rules">Consultar reglas</button></div>
        </div>
        <div class="hero-board"><span class="hero-sticker">3 vidas · sin cronómetro</span>${fieldSvg("field-home", "pass")}</div>
      </section>
      <section class="chapter-section" aria-labelledby="chapterTitle">
        <div class="section-heading"><div><p class="eyebrow">Cinco paradas</p><h2 id="chapterTitle">Elegí por dónde empezar</h2></div><p>O recorré el reglamento completo, del pull a las variantes.</p></div>
        <div class="chapter-list">${CHAPTERS.map((chapter, index) => {
          const practiced = SCENARIOS.filter((item) => item.chapter === chapter.id && state.profile.seen.includes(item.id)).length;
          return `<article class="chapter-card" data-tone="${chapter.tone}"><div class="chapter-card__top"><span class="chapter-card__number">0${index + 1} / ${esc(chapter.range)}</span><span class="chapter-card__count">${practiced}/5 vistas</span></div><div><h3>${esc(chapter.title)}</h3><p>${esc(chapter.description)}</p></div><button class="btn btn--soft btn--sm" type="button" data-action="start-chapter" data-chapter="${chapter.id}">Practicar capítulo <span aria-hidden="true">→</span></button></article>`;
        }).join("")}</div>
        <div class="home-record" aria-label="Tu registro"><span><strong>${state.profile.bestScore}</strong> mejor puntaje</span><span><strong>${state.profile.gamesFinished}</strong> partidas terminadas</span><span><strong>${mastered}/25</strong> situaciones vistas</span><span><strong>${reviewCount}</strong> para repasar</span></div>
      </section>`;
  }

  function chapterRail(currentId, run) {
    return `<div class="chapter-rail" aria-label="Capítulos del recorrido">${CHAPTERS.map((chapter) => {
      const chapterIds = run.ids.filter((id) => scenarioById(id)?.chapter === chapter.id);
      const completed = chapterIds.length > 0 && chapterIds.every((id) => {
        const idx = run.ids.indexOf(id);
        return idx < run.index || (idx === run.index && Boolean(run.feedback));
      });
      const current = chapter.id === currentId;
      return `<span class="chapter-stop${current ? " is-current" : ""}${completed && !current ? " is-done" : ""}" ${current ? 'aria-current="step"' : ""}>${esc(chapter.short)}</span>`;
    }).join("")}</div>`;
  }

  function renderGame() {
    const run = state.run;
    if (!run) { setView("home", false); return; }
    const scenario = scenarioById(run.ids[run.index]);
    if (!scenario) { finishRun(); renderGame(); return; }
    const chapter = chapterById(scenario.chapter);
    const planned = run.ids.length;
    const displayed = run.feedback ? run.index + 1 : run.index;
    const progress = Math.round(Math.min(1, displayed / Math.max(1, planned)) * 100);
    const options = scenario.options.map((option, index) => {
      let stateClass = "";
      let mark = String.fromCharCode(65 + index);
      if (run.feedback && index === scenario.answer) { stateClass = " is-correct"; mark = "✓"; }
      else if (run.feedback && index === run.feedback.chosen) { stateClass = " is-chosen-wrong"; mark = "×"; }
      return `<label class="answer-option${stateClass}"><input type="radio" name="answer" value="${index}" ${run.selected === index ? "checked" : ""} ${run.feedback ? "disabled" : ""}><span class="answer-option__mark" aria-hidden="true">${mark}</span><span class="answer-option__text">${esc(option)}</span></label>`;
    }).join("");
    const lives = [0, 1, 2].map((index) => heartIcon(index >= run.lives)).join("");
    let feedback = "";
    if (run.feedback) {
      const isCorrect = run.feedback.correct;
      const correctChoice = scenario.options[scenario.answer];
      const feedbackCopy = isCorrect
        ? `<p>${esc(scenario.explain)}</p><p class="question-reference">+100 puntos · ${esc(scenario.source)}</p>`
        : `<p><strong>La opción correcta era: ${esc(correctChoice)}.</strong></p><p>${esc(scenario.explain)}</p><p class="question-reference">${esc(scenario.source)} · Se guardó para repaso.</p>`;
      const canContinue = run.finished;
      const nextText = run.lives === 0 ? "Ver resultado" : run.finished ? "Ver resultado" : "Siguiente jugada";
      feedback = `<section class="feedback-panel" data-kind="${isCorrect ? "correct" : "wrong"}" role="status" aria-live="polite"><div class="feedback-heading"><span class="feedback-symbol" aria-hidden="true">${isCorrect ? "✓" : "!"}</span><div><h3 tabindex="-1" id="feedbackTitle">${isCorrect ? "¡Punto para vos!" : "No era esa. Perdiste 1 vida."}</h3><span class="question-reference">${isCorrect ? "Respuesta correcta" : `Respuesta ${run.feedback.chosen + 1} / 3`}</span></div></div>${feedbackCopy}${run.finished ? `<div class="finish-inline"><p><strong>${run.lives === 0 ? "Se terminó la partida" : "Recorrido completo"}.</strong> Sumaste ${run.score} puntos en ${run.index + 1} jugadas.</p><button class="btn btn--pear" type="button" data-action="show-finish">${nextText} <span aria-hidden="true">→</span></button></div>` : `<button class="btn btn--pear" type="button" data-action="next">${nextText} <span aria-hidden="true">→</span></button>`}</section>`;
    }
    const isDisabled = run.selected === null || Boolean(run.feedback);
    appMain.innerHTML = `
      <section class="game-view" aria-labelledby="gameTitle">
        <div class="game-top"><div><p class="eyebrow">${esc(chapter.title)} · ${esc(chapter.range)}</p><h1 id="gameTitle" tabindex="-1">${esc(scenario.title)}</h1></div><div class="game-actions"><button class="btn btn--soft btn--sm" type="button" data-view="rules">Reglas</button><button class="btn btn--outline btn--sm" type="button" data-action="restart">Reiniciar</button></div></div>
        <div class="game-progress"><div class="progress-copy"><strong>Jugada ${run.index + 1} de ${planned}</strong><span>${run.reviewScheduled.length ? `${run.reviewScheduled.length} en repaso` : "Sin límite de tiempo"}</span></div><div class="progress-track" role="progressbar" aria-label="Avance de la partida" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="--progress-scale:${(progress / 100).toFixed(3)}"></span></div><div class="score-strip"><div><span class="score-label">PUNTOS</span><span class="score-value">${run.score}</span></div><div class="lives" aria-label="Vidas ${run.lives} de 3">${lives}<span class="lives-label">${run.lives}/3</span></div></div></div>
        ${chapterRail(chapter.id, run)}
        <div class="play-layout">
          <figure class="scene-board"><div class="scene-board__head"><span>La jugada</span><span class="scene-board__disc" aria-hidden="true"></span></div>${fieldSvg(`field-${scenario.id}`, scenario.diagram)}<figcaption class="scene-legend"><span class="legend-item"><i class="legend-dot" aria-hidden="true"></i> Ataque</span><span class="legend-item"><i class="legend-dot legend-dot--defense" aria-hidden="true"></i> Defensa</span><span>Esquema de lectura</span></figcaption></figure>
          <section class="question-panel" aria-labelledby="questionPrompt"><p class="eyebrow">${esc(scenario.source)}</p><p class="question-context">${esc(scenario.context)}</p><form id="answerForm"><fieldset ${run.feedback ? "disabled" : ""}><legend id="questionPrompt">${esc(scenario.prompt)}</legend><div class="answer-list">${options}</div></fieldset><div class="question-tools"><button class="btn btn--pear" type="submit" ${isDisabled ? "disabled" : ""}>Responder</button><button class="text-button" type="button" data-action="hint" aria-expanded="false" aria-controls="hintCopy" ${run.feedback ? "hidden" : ""}>Necesito una pista</button><button class="text-button" type="button" data-view="rules">Consultar regla</button></div><p class="hint-copy" id="hintCopy" hidden>${esc(scenario.hint)}</p></form>${feedback}<p class="game-footnote">Sin puntos extra por velocidad. Equivocarte no borra lo aprendido: la regla queda disponible para repasar.</p></section>
        </div>
      </section>`;
  }

  function finishRun() {
    if (!state.run) return;
    state.run.finished = true;
    if (!state.run.countedFinished) {
      state.profile.gamesFinished += 1;
      state.run.countedFinished = true;
    }
    saveState();
  }

  function startRun(chapterId = "all") {
    const ids = idsFor(chapterId);
    state.profile.gamesStarted += 1;
    state.run = { chapterId, ids, index: 0, lives: 3, score: 0, selected: null, feedback: null, reviewScheduled: [], finished: false, countedFinished: false };
    saveState();
    setView("game");
  }

  function answerCurrent() {
    const run = state.run;
    if (!run || run.feedback || run.finished || run.selected === null) return;
    const scenario = scenarioById(run.ids[run.index]);
    if (!scenario) return;
    const correct = run.selected === scenario.answer;
    const chosen = run.selected;
    state.profile.seen = [...new Set([...state.profile.seen, scenario.id])];
    if (correct) {
      run.score += 100;
      state.profile.correctAnswers += 1;
      state.profile.reviewQueue = state.profile.reviewQueue.filter((id) => id !== scenario.id);
    } else {
      run.lives = Math.max(0, run.lives - 1);
      state.profile.incorrectAnswers += 1;
      state.profile.reviewQueue = [...new Set([...state.profile.reviewQueue, scenario.id])];
      if (run.lives > 0 && !run.reviewScheduled.includes(scenario.id)) {
        run.reviewScheduled.push(scenario.id);
        run.ids.push(scenario.id);
      }
    }
    state.profile.bestScore = Math.max(state.profile.bestScore, run.score);
    run.feedback = { correct, chosen };
    run.selected = null;
    if (run.lives === 0 || run.index >= run.ids.length - 1) finishRun();
    else saveState();
    renderGame();
    requestAnimationFrame(() => document.getElementById("feedbackTitle")?.focus({ preventScroll: true }));
  }

  function nextQuestion() {
    if (!state.run || state.run.finished) return;
    state.run.index += 1;
    state.run.feedback = null;
    state.run.selected = null;
    saveState();
    renderGame();
    requestAnimationFrame(() => document.getElementById("gameTitle")?.focus({ preventScroll: true }));
  }

  function renderProgress() {
    const profile = state.profile;
    const reviewed = profile.seen.length;
    const accuracy = profile.correctAnswers + profile.incorrectAnswers
      ? Math.round(profile.correctAnswers / (profile.correctAnswers + profile.incorrectAnswers) * 100)
      : 0;
    const chapters = CHAPTERS.map((chapter) => {
      const chapterQuestions = SCENARIOS.filter((item) => item.chapter === chapter.id);
      const done = chapterQuestions.filter((item) => profile.seen.includes(item.id)).length;
      return `<div class="progress-row"><strong>${esc(chapter.title)}</strong><div class="progress-track" role="progressbar" aria-label="${esc(chapter.title)}" aria-valuemin="0" aria-valuemax="${chapterQuestions.length}" aria-valuenow="${done}"><span style="--progress-scale:${(done / chapterQuestions.length).toFixed(3)}"></span></div><span>${done}/${chapterQuestions.length}</span></div>`;
    }).join("");
    const review = profile.reviewQueue.length
      ? profile.reviewQueue.map((id) => `<span class="review-chip">${esc(scenarioById(id)?.title || id)} · ${esc(scenarioById(id)?.source || "")}</span>`).join("")
      : `<p class="rules-empty">No hay jugadas pendientes. Si una regla te cuesta, vuelve a aparecer en el repaso.</p>`;
    const run = visibleRun();
    appMain.innerHTML = `<section aria-labelledby="progressTitle"><p class="eyebrow">Tu entrenamiento queda en este navegador</p><h1 id="progressTitle" tabindex="-1">Progreso</h1><p class="lede">El puntaje orienta; las jugadas que podés resolver y las reglas que revisás cuentan más.</p><div class="summary-band"><div class="summary-stat"><strong>${profile.bestScore}</strong><span>mejor puntaje</span></div><div class="summary-stat"><strong>${profile.gamesFinished}</strong><span>partidas terminadas</span></div><div class="summary-stat"><strong>${reviewed}/25</strong><span>situaciones vistas</span></div><div class="summary-stat"><strong>${accuracy}%</strong><span>aciertos registrados</span></div></div><div class="section-heading"><div><h2>Capítulos practicados</h2><p>Se marca una situación como vista después de intentar responderla.</p></div>${run ? `<button class="btn btn--pear btn--sm" type="button" data-action="resume">Continuar partida</button>` : ""}</div><div class="progress-chapters">${chapters}</div><div class="section-heading" style="margin-top:2rem"><div><h2>Para repasar</h2><p>Las respuestas incorrectas quedan aquí hasta que vuelvas a acertarlas.</p></div></div><div class="review-list">${review}</div><p class="game-footnote">Se guarda localmente en este navegador. No hay cuenta ni envío de datos.</p></section>`;
  }

  function ruleGroupsMarkup() {
    const groups = [
      { title: "Fundamentos · §§1–6", rows: RULE_INDEX.slice(0, 6) },
      { title: "Antes y durante el punto · §§7–14", rows: RULE_INDEX.slice(6, 14) },
      { title: "Marca y resolución · §§15–19", rows: RULE_INDEX.slice(14, 19) },
      { title: "Contacto y espacio · §§20–21", rows: RULE_INDEX.slice(19, 21) },
      { title: "Observers y etiqueta · §§22–23", rows: RULE_INDEX.slice(21, 23) }
    ];
    return groups.map((group, index) => `<details class="rules-group" ${index === 0 ? "open" : ""}><summary>${esc(group.title)}</summary><div class="rule-list">${group.rows.map(([number, title, summary]) => `<article class="rule-item" data-search="${esc(`§${number} ${title} ${summary}`.toLowerCase())}"><span class="rule-item__ref">USAU §${number}</span><div><p><strong>${esc(title)}.</strong> ${esc(summary)}</p><a href="${RULES_URL}" target="_blank" rel="noreferrer">Abrir texto oficial ↗</a></div></article>`).join("")}</div></details>`).join("") + `<details class="rules-group"><summary>Variantes · Appendices A–G</summary><div class="rule-list">${APPENDIX_INDEX.map(([letter, title, summary]) => `<article class="rule-item" data-search="${esc(`appendix ${letter} ${title} ${summary}`.toLowerCase())}"><span class="rule-item__ref">Appendix ${esc(letter)}</span><div><p><strong>${esc(title)}.</strong> ${esc(summary)}</p><a href="${RULES_URL}" target="_blank" rel="noreferrer">Abrir texto oficial ↗</a></div></article>`).join("")}</div></details>`;
  }

  function renderRules() {
    const run = visibleRun();
    appMain.innerHTML = `<section aria-labelledby="rulesTitle"><p class="eyebrow">USA Ultimate · snapshot 2026–2027</p><h1 id="rulesTitle" tabindex="-1">Consultar reglas</h1><p class="lede">Una guía breve en español con referencias por sección. Para la formulación oficial, abrí el texto de USA Ultimate.</p>${run ? `<button class="btn btn--soft btn--sm" type="button" data-action="resume">Volver a la jugada <span aria-hidden="true">→</span></button>` : ""}<label class="search-label" for="rulesSearch">Buscar por número, término o tema</label><input class="rules-search" id="rulesSearch" type="search" autocomplete="off" aria-describedby="searchHelp"><p id="searchHelp" class="game-footnote">Ejemplos: stall, pivote, fuera de límites, observers o mixto.</p><div class="rules-groups" id="rulesGroups">${ruleGroupsMarkup()}</div><p class="rules-empty" id="noRuleResults" hidden>No encontré una coincidencia. Probá con otro término o número de sección.</p><aside class="appendix-note"><strong>Importante</strong><p>Las tarjetas son paráfrasis educativas, no sustituyen las reglas completas ni las modificaciones anunciadas por cada evento.</p><a class="rule-item__ref" href="${RULES_URL}" target="_blank" rel="noreferrer">USA Ultimate · reglas oficiales ↗</a></aside></section>`;
  }

  function filterRules(value) {
    const query = value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll(".rules-group").forEach((group) => {
      let groupCount = 0;
      group.querySelectorAll(".rule-item").forEach((item) => {
        const match = !query || item.dataset.search.includes(query);
        item.hidden = !match;
        if (match) groupCount += 1;
      });
      group.hidden = groupCount === 0;
      if (query && groupCount) group.open = true;
      visible += groupCount;
    });
    const empty = document.getElementById("noRuleResults");
    if (empty) empty.hidden = visible > 0;
    const input = document.getElementById("rulesSearch");
    if (input) input.setAttribute("aria-invalid", query && visible === 0 ? "true" : "false");
  }

  function showFinish() {
    if (!state.run) return;
    if (!state.run.finished) finishRun();
    const run = state.run;
    const out = run.lives === 0;
    currentView = "game";
    navButtons.forEach((button) => button.classList.toggle("is-current", button.dataset.view === "home"));
    appMain.innerHTML = `<section aria-labelledby="finishTitle"><p class="eyebrow">${out ? "Fin de la partida" : "Recorrido completo"}</p><h1 id="finishTitle" tabindex="-1">${out ? "Tres vidas. Una pausa." : "¡Recorrido terminado!"}</h1><p class="lede">${out ? "Cada error quitó una vida. Las reglas que costaron más quedaron guardadas para repasar." : "Resolviste el recorrido disponible. Volvé a las reglas marcadas para consolidar lo aprendido."}</p><p class="game-footnote">Tu récord se conserva en ${state.profile.bestScore} puntos.</p><div class="summary-band"><div class="summary-stat"><strong>${run.score}</strong><span>puntos</span></div><div class="summary-stat"><strong>${run.lives}/3</strong><span>vidas restantes</span></div><div class="summary-stat"><strong>${run.index + 1}</strong><span>jugadas intentadas</span></div><div class="summary-stat"><strong>${state.profile.reviewQueue.length}</strong><span>reglas para repasar</span></div></div><section class="finish-panel" data-finish="${out ? "out" : "done"}"><h2>${out ? "Volvé a la cancha" : "Seguimos punto por punto"}</h2><p>${out ? "Podés iniciar otra partida con tres vidas o consultar ahora las reglas pendientes. El récord y tu progreso quedan guardados." : "El puntaje más alto y tus reglas pendientes se conservaron en el navegador."}</p><div class="finish-actions"><button class="btn btn--pear btn--lg" type="button" data-action="start-same">Jugar de nuevo <span aria-hidden="true">→</span></button><button class="btn btn--soft" type="button" data-view="progress">Ver progreso</button><button class="btn btn--outline" type="button" data-view="rules">Consultar reglas</button></div></section></section>`;
    saveState();
    requestAnimationFrame(() => document.getElementById("finishTitle")?.focus({ preventScroll: true }));
  }

  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      setView(viewButton.dataset.view);
      return;
    }
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    const { action, chapter } = actionButton.dataset;
    if (action === "start-all") startRun("all");
    if (action === "start-chapter") startRun(chapter);
    if (action === "resume") setView("game");
    if (action === "next") nextQuestion();
    if (action === "restart") restartDialog.showModal();
    if (action === "show-finish") showFinish();
    if (action === "start-same") startRun(state.run?.chapterId || "all");
    if (action === "hint") {
      const hint = document.getElementById("hintCopy");
      if (hint) { hint.hidden = !hint.hidden; actionButton.setAttribute("aria-expanded", String(!hint.hidden)); }
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches('input[name="answer"]') && state.run && !state.run.feedback) {
      state.run.selected = Number(event.target.value);
      const submit = document.querySelector('#answerForm button[type="submit"]');
      if (submit) submit.disabled = false;
      saveState();
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id === "answerForm") {
      event.preventDefault();
      answerCurrent();
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "rulesSearch") filterRules(event.target.value);
  });

  document.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => restartDialog.close()));
  document.getElementById("confirmRestart").addEventListener("click", () => {
    restartDialog.close();
    startRun(state.run?.chapterId || "all");
  });
  restartDialog.addEventListener("click", (event) => {
    if (event.target === restartDialog) restartDialog.close();
  });

  if (state.run && !state.run.finished) renderGame();
  else renderHome();
  if (!storageWritable && storageNote.hidden) showStorageNote("El progreso de esta sesión no se pudo leer del almacenamiento local.");
})();
