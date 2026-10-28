(() => {
  "use strict";

  const LEVELS = {
    classroom: { min: 1, max: 3, label: "Classroom" },
    school: { min: 2, max: 5, label: "School" },
    county: { min: 4, max: 6, label: "County" },
    regional: { min: 5, max: 8, label: "Regional" },
    national: { min: 7, max: 9, label: "National" },
    championship: { min: 8, max: 10, label: "Championship" },
  };
  const MODES = {
    classic: { label: "Classic", blurb: "Miss a word and you sit, unless the whole round misses." },
    points: { label: "Points", blurb: "Everyone stays. Speed adds a little." },
    vocabulary: { label: "Meaning", blurb: "Thirty seconds. Pick the sense, not the spelling." },
    written: { label: "Written", blurb: "Same list, one speller at a time. Others step away." },
    spelloff: { label: "Spell-off", blurb: "Ninety seconds. As many as you can. Cards after." },
    roots: { label: "Roots", blurb: "You get the making of the word. You spell it." },
  };
  const LANGS = {
    en: { label: "English", bcp: "en-US" },
    es: { label: "Spanish", bcp: "es-ES" },
    fr: { label: "French", bcp: "fr-FR" },
    la: { label: "Latin", bcp: "la" },
  };
  const PADS = {
    es: ["á", "é", "í", "ó", "ú", "ü", "ñ"],
    fr: ["à", "â", "æ", "ç", "é", "è", "ê", "ë", "î", "ï", "ô", "œ", "ù", "û", "ü"],
    la: ["ā", "ē", "ī", "ō", "ū"],
  };
  const SEATS = ["#c9842a", "#8c3a2f", "#1e6a48", "#3d5a80", "#6b4c7a", "#8a6a2f", "#3f5e52", "#a15c38"];
  const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const STORE_KEY = "spelling-floor-v1";

  const app = document.getElementById("app");
  let timerId = null;
  let S = null;

  function el(tag, props, kids) {
    const n = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === "class") n.className = v;
        else if (k === "text") n.textContent = v;
        else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
        else n.setAttribute(k, String(v));
      }
    }
    for (const c of kids || []) {
      if (c == null) continue;
      n.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return n;
  }

  function words() {
    return Array.isArray(window.FLOOR_WORDS) ? window.FLOOR_WORDS : [];
  }

  function fold(s, opts = {}) {
    let t = String(s || "").normalize("NFC").trim().toLowerCase();
    t = t.replace(/[’‘`]/g, "'").replace(/\s*-\s*/g, "-").replace(/\s+/g, " ");
    if (opts.stripMacrons) t = t.normalize("NFD").replace(/\u0304/g, "").normalize("NFC");
    if (opts.lenientAccents) {
      t = t.replace(/œ/g, "oe").replace(/æ/g, "ae").replace(/ñ/g, "n");
      t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");
    }
    return t;
  }

  function answerOpts(word) {
    const langs = S?.settings?.languages || [word.lang];
    const level = S?.settings?.level || "school";
    const soft = S?.settings?.lenientAccents != null
      ? S.settings.lenientAccents
      : level === "classroom" || level === "school";
    return {
      lenientAccents: !!soft,
      stripMacrons: word.lang === "la" && !S?.settings?.requireMacrons,
    };
  }

  function answersMatch(input, word, opts) {
    const got = fold(input, opts);
    if (!got) return false;
    const targets = [word.w, ...(word.alt || [])];
    return targets.some((t) => fold(t, opts) === got);
  }

  function maskHeadword(text, word) {
    let out = String(text || "");
    const forms = [word.w, ...(word.alt || [])].filter(Boolean).sort((a, b) => b.length - a.length);
    forms.forEach((form) => {
      const re = new RegExp(form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
      out = out.replace(re, "this word");
    });
    return out;
  }

  function firstMismatch(got, want) {
    const a = [...fold(got)];
    const b = [...fold(want)];
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
    return -1;
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      if (!data || data.version !== 1) {
        return { version: 1, settings: {}, games: [], missed: {}, seen: [] };
      }
      data.games = Array.isArray(data.games) ? data.games : [];
      data.missed = data.missed || {};
      data.seen = Array.isArray(data.seen) ? data.seen : [];
      return data;
    } catch {
      return { version: 1, settings: {}, games: [], missed: {}, seen: [] };
    }
  }

  function saveStore(data) {
    try {
      data.games = data.games.slice(-200);
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  function seenSet() {
    return new Set(loadStore().seen || []);
  }

  function wordKey(w) {
    return `${w.lang}:${w.w}`;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function rand() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(str) {
    let h = 2166136261;
    for (const ch of String(str)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
    return h >>> 0;
  }

  function makeSeed() {
    const buf = new Uint32Array(4);
    crypto.getRandomValues(buf);
    return [...buf].map((n) => ALPH[n % ALPH.length]).join("");
  }

  function shuffle(list, rng) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function defaultSettings() {
    const saved = loadStore().settings || {};
    return {
      mode: saved.mode || "classic",
      level: saved.level || "school",
      languages: saved.languages || ["en"],
      lenientAccents: !!saved.lenientAccents,
      requireMacrons: !!saved.requireMacrons,
      rounds: saved.rounds || 12,
      music: saved.music !== false,
      volume: saved.volume == null ? 0.35 : saved.volume,
      revealToRoom: !!saved.revealToRoom,
      names: saved.names || [""],
      code: "",
    };
  }

  const audio = {
    ctx: null,
    master: null,
    nodes: [],
    on: true,
    volume: 0.35,
    ensure() {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      if (!this.ctx) {
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
      }
      this.master.gain.value = this.on ? this.volume : 0;
      if (this.ctx.state === "suspended") this.ctx.resume();
      return true;
    },
    setVolume(v) {
      this.volume = v;
      if (this.master) this.master.gain.value = this.on ? v : 0;
    },
    mute(off) {
      this.on = !off;
      if (this.master) this.master.gain.value = this.on ? this.volume : 0;
      if (this.on) this.bed();
      else this.stopBed();
    },
    stopBed() {
      this.nodes.forEach((n) => { try { n.stop?.(); n.disconnect?.(); } catch { /* already stopped */ } });
      this.nodes = [];
    },
    bed() {
      if (!this.on || !this.ensure()) return;
      if (this.nodes.length) return;
      const ctx = this.ctx;
      [73.42, 110, 146.83].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = i === 0 ? "sine" : "triangle";
        o.frequency.value = f;
        g.gain.value = i === 0 ? 0.045 : 0.012;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.nodes.push(o, g);
      });
    },
    tone(freq, dur, type, gain) {
      if (!this.on || !this.ensure()) return;
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.05);
    },
    bell(ok) {
      if (ok) {
        this.tone(523.25, 0.9, "sine", 0.11);
        this.tone(659.25, 1.15, "sine", 0.05);
        this.tone(783.99, 1.35, "triangle", 0.035);
      } else {
        this.tone(174.61, 0.45, "sine", 0.07);
        this.tone(130.81, 0.6, "triangle", 0.04);
      }
      const bell = document.querySelector(".bell");
      if (bell) {
        bell.classList.remove("ring");
        void bell.offsetWidth;
        bell.classList.add("ring");
      }
    },
    tick() {
      this.tone(740, 0.04, "square", 0.015);
    },
  };

  function speak(text, lang, rate) {
    if (!window.speechSynthesis || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    const code = LANGS[lang]?.bcp || "en-US";
    u.lang = lang === "la" ? "it-IT" : code;
    u.rate = rate || 0.82;
    const voices = speechSynthesis.getVoices();
    const wanted = lang === "la" ? ["la", "it"] : [code.slice(0, 2)];
    const voice = voices.find((v) => wanted.some((p) => v.lang.toLowerCase().startsWith(p)));
    if (voice) u.voice = voice;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function spellLetters(text, lang) {
    const letters = [...text].map((ch) => (ch === "-" ? "hyphen" : ch === "'" ? "apostrophe" : ch)).join(", ");
    speak(letters, lang, 0.72);
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function poolFor(settings) {
    const lv = LEVELS[settings.level] || LEVELS.school;
    const langs = new Set(settings.languages);
    return words().filter((w) => langs.has(w.lang) && w.b >= lv.min && w.b <= lv.max);
  }

  function buildDeck(settings, seed) {
    const rng = mulberry32(hashSeed(seed + "|" + settings.level + "|" + settings.mode + "|" + settings.languages.join("+")));
    const seen = seenSet();
    let pool = poolFor(settings);
    const fresh = pool.filter((w) => !seen.has(wordKey(w)));
    if (fresh.length >= 20) pool = fresh;
    const buckets = new Map();
    pool.forEach((w) => {
      if (!buckets.has(w.b)) buckets.set(w.b, []);
      buckets.get(w.b).push(w);
    });
    for (const [k, list] of buckets) buckets.set(k, shuffle(list, rng));
    const bands = [...buckets.keys()].sort((a, b) => a - b);
    const deck = [];
    const cursors = Object.fromEntries(bands.map((b) => [b, 0]));
    const target = Math.max(pool.length, 1);
    let guard = 0;
    while (deck.length < target && guard < target * 4) {
      guard += 1;
      const t = deck.length / Math.max(18, target);
      const want = Math.round(bands[0] + (bands[bands.length - 1] - bands[0]) * Math.min(1, t));
      let band = bands[0];
      let best = 99;
      for (const b of bands) {
        const left = buckets.get(b).length - cursors[b];
        if (left <= 0) continue;
        const dist = Math.abs(b - want);
        if (dist < best) { best = dist; band = b; }
      }
      const list = buckets.get(band) || [];
      if (cursors[band] >= list.length) break;
      deck.push(list[cursors[band]]);
      cursors[band] += 1;
    }
    return deck;
  }

  function codeFor(settings, seed) {
    const langs = settings.languages.slice().sort().join("+");
    const rounds = settings.mode === "classic" || settings.mode === "spelloff" ? "" : `/r${settings.rounds}`;
    return `FLOOR/${langs}/${settings.level}/${settings.mode}/${seed}${rounds}`;
  }

  function parseCode(raw) {
    const text = String(raw || "").trim().toUpperCase();
    const m = text.match(/^FLOOR\/([A-Z+]{2,})\/([A-Z]+)\/([A-Z]+)\/([A-Z0-9]{4})(?:\/R(\d{1,2}))?$/);
    if (!m) return null;
    const languages = m[1].toLowerCase().split("+").filter((l) => LANGS[l]);
    const level = m[2].toLowerCase();
    const mode = m[3].toLowerCase();
    if (!languages.length || !LEVELS[level] || !MODES[mode]) return null;
    return { languages, level, mode, seed: m[4], rounds: m[5] ? Number(m[5]) : null };
  }

  function limitFor(mode) {
    if (mode === "vocabulary") return 30;
    if (mode === "written") return 45;
    if (mode === "spelloff") return 90;
    if (mode === "study") return 0;
    return 90;
  }

  function activePlayers() {
    return S.players.filter((p) => !p.out);
  }

  function currentPlayer() {
    return S.players[S.spellerIndex] || S.players[0];
  }

  function nextSpellerIndex(from) {
    const n = S.players.length;
    for (let i = 1; i <= n; i++) {
      const idx = (from + i) % n;
      if (!S.players[idx].out) return idx;
    }
    return -1;
  }

  function startGame(settings, names) {
    const parsed = parseCode(settings.code);
    if (String(settings.code || "").trim() && !parsed) {
      renderMessage("That code is not a floor code. It looks like FLOOR/en/school/classic/K7M2.");
      return;
    }
    if (parsed) {
      settings = {
        ...settings,
        languages: parsed.languages,
        level: parsed.level,
        mode: parsed.mode,
        rounds: parsed.rounds || settings.rounds,
      };
    }
    const seed = parsed?.seed || makeSeed();
    const deck = buildDeck(settings, seed);
    if (!deck.length) {
      renderMessage("This floor has no words for that level and language. Widen the level, or add a language.");
      return;
    }
    const store = loadStore();
    store.settings = {
      mode: settings.mode,
      level: settings.level,
      languages: settings.languages,
      lenientAccents: settings.lenientAccents,
      requireMacrons: settings.requireMacrons,
      rounds: settings.rounds,
      music: settings.music,
      volume: settings.volume,
      revealToRoom: settings.revealToRoom,
      names,
    };
    saveStore(store);
    audio.on = settings.music;
    audio.volume = settings.volume;
    audio.ensure();
    if (settings.music) audio.bed();

    S = {
      screen: "play",
      settings,
      seed,
      code: codeFor(settings, seed),
      deck,
      wordCursor: 0,
      players: names.map((name, i) => ({
        id: `p${i}`,
        name: name.trim() || `Speller ${i + 1}`,
        color: SEATS[i % SEATS.length],
        correct: 0,
        missed: 0,
        points: 0,
        out: false,
        streak: 0,
        bestStreak: 0,
        taken: 0,
        ms: [],
      })),
      spellerIndex: 0,
      phase: "curtain",
      remaining: limitFor(settings.mode),
      limit: limitFor(settings.mode),
      paused: false,
      log: [],
      round: null,
      spelloffQueue: [],
      spelloffReview: [],
      over: false,
      mercyNote: "",
      started: Date.now(),
    };
    if (settings.mode === "spelloff") S.spelloffQueue = S.players.map((_, i) => i);
    beginPlayer();
  }

  function takeWord() {
    if (S.wordCursor >= S.deck.length) return null;
    const word = S.deck[S.wordCursor];
    S.wordCursor += 1;
    return word;
  }

  function beginRoundIfNeeded() {
    if (S.settings.mode !== "classic") return;
    if (!S.round || S.round.results.length >= S.round.ids.length) {
      const ids = activePlayers().map((p) => p.id);
      S.round = { ids, results: [] };
    }
  }

  function beginPlayer() {
    stopTimer();
    S.mercyNote = "";
    S.over = false;
    if (S.settings.mode === "spelloff") {
      if (!S.spelloffQueue.length) return finishGame();
      S.spellerIndex = S.spelloffQueue[0];
      S.current = takeWord();
      if (!S.current) return finishGame();
      S.phase = S.players.length > 1 && !S.settings.revealToRoom ? "curtain" : "clock";
      S.limit = 90;
      S.remaining = 90;
      S.endsAt = null;
      S.spelloffCount = 0;
      render();
      return;
    }
    const alive = activePlayers();
    if (!alive.length) return finishGame();
    if (S.settings.mode === "classic" && S.players.length > 1 && alive.length <= 1 && S.log.length) return finishGame();
    if (S.players[S.spellerIndex].out) {
      const nxt = nextSpellerIndex(S.spellerIndex);
      if (nxt < 0) return finishGame();
      S.spellerIndex = nxt;
    }
    const player = currentPlayer();
    const cap = S.settings.rounds;
    const counted = ["points", "vocabulary", "written", "roots"];
    if (counted.includes(S.settings.mode) && S.players.every((p) => p.out || p.taken >= cap)) return finishGame();
    if (counted.includes(S.settings.mode) && player.taken >= cap) {
      S.spellerIndex = nextSpellerIndex(S.spellerIndex);
      if (S.spellerIndex < 0) return finishGame();
      return beginPlayer();
    }
    beginRoundIfNeeded();
    S.current = takeWord();
    if (!S.current) return finishGame();
    const solo = S.players.length === 1;
    const showCurtain = !solo && !S.settings.revealToRoom && S.settings.mode !== "vocabulary";
    S.phase = showCurtain ? "curtain" : "clock";
    S.limit = limitFor(S.settings.mode);
    S.remaining = S.limit;
    S.paused = false;
    S.turnStarted = null;
    render();
    if (S.phase === "clock") openClock();
  }

  function openClock() {
    S.phase = "clock";
    S.paused = false;
    S.turnStarted = Date.now();
    if (S.settings.mode === "spelloff") {
      S.endsAt = Date.now() + S.remaining * 1000;
    }
    render();
    const input = document.getElementById("spell");
    if (input) input.focus();
    if (S.settings.mode !== "roots") speak(S.current.w, S.current.lang);
    startTimer();
  }

  function startTimer() {
    stopTimer();
    if (S.phase !== "clock" || S.paused || S.settings.mode === "study") return;
    timerId = setInterval(() => {
      if (S.settings.mode === "spelloff" && S.endsAt) {
        S.remaining = Math.max(0, Math.ceil((S.endsAt - Date.now()) / 1000));
      } else {
        S.remaining -= 1;
      }
      paintClock();
      if (S.remaining <= 15 && S.remaining > 0 && S.settings.mode !== "spelloff") audio.tick();
      if (S.remaining <= 0) {
        stopTimer();
        if (S.settings.mode === "spelloff") return endSpelloff();
        expire();
      }
    }, 1000);
  }

  function paintClock() {
    const host = document.getElementById("clock-host");
    if (host) host.replaceChildren(clockSVG(S.remaining, S.limit));
    const quiet = S.remaining <= 15 && S.limit >= 30 && S.settings.mode !== "spelloff";
    const note = document.getElementById("quiet-note");
    if (note) note.hidden = !quiet;
    document.querySelectorAll(".hint").forEach((b) => { b.disabled = quiet; });
  }

  function hintsLocked() {
    return S.phase === "clock" && S.remaining <= 15 && S.limit >= 30 && S.settings.mode !== "spelloff";
  }

  function showHint(kind) {
    if (hintsLocked() || !S.current) return;
    const w = S.current;
    const box = document.getElementById("hint-box");
    let text = "";
    if (kind === "repeat") {
      speak(w.w, w.lang);
      text = w.say ? `Say it: ${w.say}` : "Listen again.";
    } else if (kind === "def") {
      text = w.def;
      speak(w.def, w.lang, 0.92);
    } else if (kind === "ex") {
      text = w.ex;
      speak(w.ex, w.lang, 0.92);
    } else if (kind === "origin") {
      text = `Language of origin: ${w.origin}. ${w.path || ""}`.trim();
      speak(w.origin, "en", 0.9);
    } else if (kind === "pos") {
      text = `Part of speech: ${w.pos}.`;
      speak(w.pos, "en", 0.9);
    }
    if (box) box.textContent = text;
  }

  function expire() {
    const input = document.getElementById("spell");
    const choice = document.querySelector('.choices button[aria-pressed="true"]');
    submit(input ? input.value : choice?.dataset?.choice || "", { expired: true });
  }

  function submit(raw, meta = {}) {
    if (!S || S.phase !== "clock" || S.over) return;
    S.phase = "locking";
    const word = S.current;
    const player = currentPlayer();
    const opts = answerOpts(word);
    let ok = false;
    let note = "";
    if (S.settings.mode === "vocabulary") {
      ok = raw === word.def;
    } else {
      ok = answersMatch(raw, word, opts);
      if (ok && opts.lenientAccents && fold(raw, opts) === fold(word.w, opts) && fold(raw) !== fold(word.w)) {
        note = "Accepted on the lenient accent rule. The mark still belongs on the word.";
      }
    }
    const used = S.turnStarted ? Date.now() - S.turnStarted : 0;
    player.taken += 1;
    player.ms.push(used);
    if (ok) {
      player.correct += 1;
      player.streak += 1;
      player.bestStreak = Math.max(player.bestStreak, player.streak);
      const left = Math.max(0, S.remaining);
      const bonus = Math.min(5, Math.floor(left / 10));
      player.points += 10 + bonus;
    } else {
      player.missed += 1;
      player.streak = 0;
      if (S.settings.mode === "classic") player.out = true;
    }
    const entry = {
      word: word.w,
      lang: word.lang,
      speller: player.name,
      spellerId: player.id,
      ok,
      given: raw,
      ms: used,
      expired: !!meta.expired,
      note,
      def: word.def,
      etym: word.etym,
      at: S.wordCursor,
    };
    S.log.push(entry);
    if (S.round && S.settings.mode === "classic") {
      S.round.results.push({ id: player.id, ok });
      if (S.round.results.length >= S.round.ids.length && S.round.ids.length > 1 && S.round.results.every((r) => !r.ok)) {
        S.round.ids.forEach((id) => {
          const p = S.players.find((x) => x.id === id);
          if (p) p.out = false;
        });
        S.mercyNote = "Nobody had it. This round does not eliminate.";
      }
    }
    const store = loadStore();
    const key = wordKey(word);
    if (!store.seen.includes(key)) store.seen.push(key);
    if (!ok) {
      const mk = player.name.trim().toLowerCase();
      store.missed[mk] = store.missed[mk] || [];
      store.missed[mk].push({ w: word.w, lang: word.lang, def: word.def, etym: word.etym, when: new Date().toISOString() });
      store.missed[mk] = store.missed[mk].slice(-300);
    }
    saveStore(store);
    audio.bell(ok);

    if (S.settings.mode === "study") {
      S.phase = "reveal";
      S.last = entry;
      S.over = true;
      S.studyDone = true;
      stopTimer();
      render();
      return;
    }

    if (S.settings.mode === "spelloff") {
      S.spelloffCount = (S.spelloffCount || 0) + 1;
      S.spelloffReview.push(entry);
      if (S.remaining <= 0) return endSpelloff();
      const next = takeWord();
      if (!next) return endSpelloff();
      S.current = next;
      S.phase = "clock";
      render();
      const input = document.getElementById("spell");
      if (input) input.focus();
      speak(S.current.w, S.current.lang);
      return;
    }

    S.phase = "reveal";
    S.last = entry;
    stopTimer();
    const alive = activePlayers();
    S.over = S.settings.mode === "classic" && alive.length === 0;
    if (S.settings.mode === "classic" && alive.length <= 1 && S.players.length > 1 && !S.mercyNote) S.over = true;
    if (S.settings.mode === "classic" && S.players.length === 1 && !ok) S.over = true;
    render();
  }

  function endSpelloff() {
    stopTimer();
    S.spelloffQueue.shift();
    S.phase = "reveal";
    S.last = { spelloff: true, speller: currentPlayer().name };
    S.over = S.spelloffQueue.length === 0;
    render();
  }

  function afterReveal() {
    if (S.studyDone) return renderStudy();
    if (S.over) return finishGame();
    if (S.settings.mode === "spelloff") return beginPlayer();
    const nxt = nextSpellerIndex(S.spellerIndex);
    if (nxt < 0) return finishGame();
    S.spellerIndex = nxt;
    beginPlayer();
  }

  function finishGame() {
    stopTimer();
    S.screen = "results";
    S.phase = "results";
    const store = loadStore();
    const game = {
      id: `${Date.now()}-${S.seed}`,
      when: new Date().toISOString(),
      code: S.code,
      mode: S.settings.mode,
      level: S.settings.level,
      languages: S.settings.languages,
      players: S.players.map((p) => ({
        name: p.name,
        correct: p.correct,
        missed: p.missed,
        points: p.points,
        out: p.out,
        bestStreak: p.bestStreak,
      })),
      winner: winnerName(),
      words: S.log.map((e) => ({ word: e.word, lang: e.lang, speller: e.speller, ok: e.ok, given: e.given })),
    };
    store.games.push(game);
    saveStore(store);
    S.saved = true;
    render();
  }

  function winnerName() {
    const mode = S.settings.mode;
    const list = S.players.slice();
    if (mode === "classic") {
      const alive = list.filter((p) => !p.out);
      if (alive.length === 1) return alive[0].name;
    }
    list.sort((a, b) => {
      if (mode === "points" || mode === "vocabulary" || mode === "roots") return b.points - a.points || b.correct - a.correct;
      return b.correct - a.correct || a.missed - b.missed;
    });
    return list[0] ? list[0].name : "";
  }

  function clockSVG(seconds, limit) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 148 148");
    svg.setAttribute("class", "clock");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `${seconds} seconds left`);
    const r = 58;
    const c = 2 * Math.PI * r;
    const p = limit ? Math.max(0, Math.min(1, seconds / limit)) : 0;
    const warn = seconds <= 15;
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("cx", "74");
    ring.setAttribute("cy", "74");
    ring.setAttribute("r", String(r));
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", warn ? "#f3ddd8" : "#e4c27a");
    ring.setAttribute("stroke-width", "6");
    ring.setAttribute("stroke-dasharray", `${(c * p).toFixed(2)} ${c.toFixed(2)}`);
    ring.setAttribute("stroke-linecap", "round");
    ring.setAttribute("transform", "rotate(-90 74 74)");
    const track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    track.setAttribute("cx", "74");
    track.setAttribute("cy", "74");
    track.setAttribute("r", String(r));
    track.setAttribute("fill", "none");
    track.setAttribute("stroke", "rgba(228,194,122,0.2)");
    track.setAttribute("stroke-width", "6");
    const num = document.createElementNS("http://www.w3.org/2000/svg", "text");
    num.setAttribute("x", "74");
    num.setAttribute("y", "82");
    num.setAttribute("text-anchor", "middle");
    num.setAttribute("fill", "#f3ecdf");
    num.setAttribute("font-family", "Fraunces, Palatino, serif");
    num.setAttribute("font-size", "42");
    num.textContent = String(Math.max(0, seconds));
    svg.append(track, ring, num);
    return svg;
  }

  function bellSVG() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 32 32");
    svg.setAttribute("width", "22");
    svg.setAttribute("height", "22");
    svg.setAttribute("class", "bell");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M16 4c-1.2 2.2-1.2 4 0 5.6 1.2-1.6 1.2-3.4 0-5.6zM9 13h14v2c0 4.2-2.8 7.2-7 7.2S9 19.2 9 15v-2z");
    path.setAttribute("fill", "#e4c27a");
    svg.append(path);
    return svg;
  }

  function topbar() {
    return el("header", { class: "topbar" }, [
      el("div", { class: "kicker" }, [bellSVG(), document.createTextNode(" The Spelling Floor")]),
      el("div", { class: "kicker", text: `${MODES[S.settings.mode].label} · ${LEVELS[S.settings.level].label}` }),
      el("div", { class: "top-actions" }, [
        el("button", {
          class: "stage-btn",
          type: "button",
          text: S.paused ? "Resume" : "Pause",
          onclick: () => {
            if (S.phase !== "clock") return;
            S.paused = !S.paused;
            if (S.paused) {
              S.pauseStarted = Date.now();
              stopTimer();
            } else {
              if (S.endsAt && S.pauseStarted) S.endsAt += Date.now() - S.pauseStarted;
              startTimer();
            }
            const btn = document.querySelector(".top-actions .stage-btn");
            if (btn) btn.textContent = S.paused ? "Resume" : "Pause";
          },
        }),
        el("button", {
          class: "stage-btn",
          type: "button",
          text: audio.on ? "Music on" : "Music off",
          onclick: () => {
            audio.mute(audio.on);
            const buttons = [...document.querySelectorAll(".top-actions .stage-btn")];
            const music = buttons.find((b) => b.textContent.startsWith("Music"));
            if (music) music.textContent = audio.on ? "Music on" : "Music off";
          },
        }),
        el("button", { class: "stage-btn danger", type: "button", text: "End floor", onclick: finishGame }),
      ]),
    ]);
  }

  function plates() {
    return el("div", { class: "plates" }, S.players.map((p, i) => el("div", {
      class: `plate${i === S.spellerIndex && !p.out ? " is-on" : ""}${p.out ? " is-out" : ""}`,
      style: `--seat:${p.color}`,
    }, [
      el("strong", { text: p.name }),
      el("span", { text: scoreLine(p) }),
    ])));
  }

  function scoreLine(p) {
    if (S.settings.mode === "points" || S.settings.mode === "vocabulary" || S.settings.mode === "roots") {
      return `${p.points} pts · ${p.correct} right`;
    }
    return `${p.correct} right · ${p.missed} missed${p.out ? " · out" : ""}`;
  }

  function hintRow() {
    if (S.settings.mode === "vocabulary" || S.settings.mode === "roots") return null;
    const mk = (kind, label) => el("button", { class: "hint", type: "button", text: label, onclick: () => showHint(kind) });
    return el("div", { class: "hints" }, [
      mk("repeat", "Repeat"),
      mk("def", "Definition"),
      mk("ex", "Sentence"),
      mk("origin", "Origin"),
      mk("pos", "Part of speech"),
    ]);
  }

  function padFor(lang) {
    const keys = PADS[lang] || [];
    if (!keys.length) return null;
    return el("div", { class: "pad" }, keys.map((ch) => el("button", {
      type: "button",
      text: ch,
      onclick: () => insertChar(ch),
    })));
  }

  function insertChar(ch) {
    const input = document.getElementById("spell");
    if (!input) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    input.value = input.value.slice(0, start) + ch + input.value.slice(end);
    input.focus();
    const pos = start + ch.length;
    input.setSelectionRange(pos, pos);
  }

  function choiceButtons(word) {
    const rng = mulberry32(hashSeed(S.seed + word.w));
    const others = shuffle(S.deck.filter((w) => w.def !== word.def), rng).slice(0, 3).map((w) => w.def);
    while (others.length < 3) others.push("None of these senses.");
    const options = shuffle([word.def, ...others], rng);
    return el("div", { class: "choices" }, options.map((def) => el("button", {
      type: "button",
      text: def,
      "data-choice": def,
      onclick: (ev) => {
        document.querySelectorAll(".choices button").forEach((b) => b.setAttribute("aria-pressed", "false"));
        ev.currentTarget.setAttribute("aria-pressed", "true");
      },
    })));
  }

  function renderPlay() {
    app.replaceChildren();
    const floor = el("div", { class: "floor honey" });
    floor.append(topbar());
    const play = el("div", { class: "play" });
    const clockWrap = el("div", { class: "clock-wrap" }, [
      el("div", { id: "clock-host" }),
      el("div", { class: "clock-label", text: S.paused ? "Paused" : S.settings.mode === "study" ? "No clock" : S.phase === "curtain" ? "Not started" : S.phase === "reveal" ? "The card" : "On the clock" }),
    ]);
    const slate = el("section", { class: "slate" });
    const player = currentPlayer();
    const word = S.current;
    if (!word) {
      slate.append(el("h2", { class: "prompt", text: "The well is empty." }));
    } else if (S.phase === "curtain") {
      slate.append(
        el("p", { class: "who", text: "Caller’s card" }),
        el("h2", { class: "prompt", text: `${player.name} is up. Lift this only if you are calling.` }),
        el("p", { class: "caller-word", text: word.w }),
        el("p", { class: "say", text: word.say || "" }),
        el("p", { class: "meta-line", text: `${LANGS[word.lang].label} · ${word.pos} · ${word.origin}` }),
        el("p", { class: "meta-line", text: word.def }),
        el("div", { class: "sheet-actions" }, [
          el("button", { class: "primary", type: "button", text: "Start the clock", onclick: openClock }),
          el("button", { class: "ghost", type: "button", text: "Hear it", onclick: () => speak(word.w, word.lang) }),
        ]),
      );
    } else if (S.phase === "reveal") {
      slate.append(revealCard());
    } else {
      const roots = S.settings.mode === "roots";
      const vocab = S.settings.mode === "vocabulary";
      slate.append(el("p", { class: "who" }, [
        document.createTextNode("Speller · "),
        el("strong", { text: player.name }),
        document.createTextNode(` · ${LANGS[word.lang].label}`),
      ]));
      if (vocab) {
        slate.append(
          el("h2", { class: "prompt", text: word.w }),
          el("p", { class: "meta-line", text: "Which sense is this word?" }),
          choiceButtons(word),
        );
      } else if (roots) {
        slate.append(
          el("h2", { class: "prompt", text: "Spell it from the root." }),
          el("p", { class: "meta-line", text: maskHeadword(word.etym, word) }),
          el("p", { class: "meta-line", text: maskHeadword(word.def, word) }),
          el("p", { class: "say", text: maskHeadword(word.path || word.origin, word) }),
        );
      } else {
        slate.append(
          el("h2", { class: "prompt", text: word.hom ? word.def : "Spell what you heard." }),
          el("p", { class: "say", text: word.say ? `Caller may say: ${word.say}` : "The word stays off this card until you lock it." }),
        );
      }
      if (!vocab) {
        const input = el("input", {
          id: "spell",
          class: "spell-input",
          type: "text",
          autocomplete: "off",
          autocapitalize: "off",
          spellcheck: "false",
          "aria-label": "Your spelling",
        });
        input.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            ev.preventDefault();
            submit(input.value);
          }
        });
        slate.append(input);
        const pad = padFor(word.lang);
        if (pad) slate.append(pad);
      }
      const hints = hintRow();
      if (hints) slate.append(hints);
      slate.append(
        el("p", { id: "hint-box", class: "meta-line" }),
        el("p", { id: "quiet-note", class: "quiet-note", text: "The floor is quiet. No more information.", hidden: "hidden" }),
        el("div", { class: "sheet-actions" }, [
          el("button", {
            class: "primary",
            type: "button",
            text: "Lock it",
            onclick: () => {
              if (vocab) {
                const picked = document.querySelector('.choices button[aria-pressed="true"]');
                submit(picked ? picked.dataset.choice : "");
              } else {
                submit(document.getElementById("spell")?.value || "");
              }
            },
          }),
        ]),
      );
    }
    play.append(clockWrap, slate);
    floor.append(play);
    floor.append(el("footer", { class: "rail" }, [
      plates(),
      el("div", { class: "kicker", text: S.code }),
    ]));
    app.append(floor);
    paintClock();
    if (S.phase === "clock" && !S.paused) startTimer();
  }

  function revealCard() {
    if (S.last && S.last.spelloff) {
      const mine = S.spelloffReview.filter((e) => e.speller === S.last.speller);
      const right = mine.filter((e) => e.ok).length;
      return el("div", {}, [
        el("p", { class: "verdict hit", text: "Spell-off closed" }),
        el("h2", { class: "prompt", text: `${S.last.speller}: ${right} in the minute and a half.` }),
        el("div", { class: "sheet-actions" }, [
          el("button", { class: "primary", type: "button", text: S.over ? "See the floor" : "Next speller", onclick: afterReveal }),
        ]),
      ]);
    }
    const word = S.current;
    const last = S.last || {};
    const ok = !!last.ok;
    const want = word.w;
    const given = last.given || "";
    const missAt = ok ? -1 : firstMismatch(given, want);
    const attempt = el("p", { class: "attempt" });
    if (!ok && given) {
      attempt.append(document.createTextNode("You wrote "));
      [...given].forEach((ch, i) => {
        if (i === missAt) attempt.append(el("b", { text: ch }));
        else attempt.append(document.createTextNode(ch));
      });
    } else if (!ok) {
      attempt.textContent = last.expired ? "Time." : "Nothing locked.";
    }
    const wiki = `https://${word.lang === "en" ? "en" : word.lang}.wiktionary.org/wiki/${encodeURIComponent(word.w)}`;
    return el("div", { class: "card" }, [
      el("div", {}, [
        el("p", { class: `verdict ${ok ? "hit" : "miss"}`, text: ok ? "In" : "Out of the spelling" }),
        el("h2", { class: "headword", text: word.w }),
        attempt,
        el("p", { class: "say", text: word.say || "" }),
        el("span", { class: "chip", text: word.pat || word.origin }),
        el("p", { class: "def", text: word.def }),
        el("p", { class: "ex", text: word.ex }),
        last.note ? el("p", { class: "meta-line", text: last.note }) : null,
        S.mercyNote ? el("p", { class: "meta-line", text: S.mercyNote }) : null,
      ]),
      el("div", { class: "made" }, [
        el("h3", { text: "How it was made" }),
        el("p", { class: "path", text: word.path || word.origin }),
        el("p", { text: word.etym }),
        el("div", { class: "links" }, [
          el("button", { class: "linkish", type: "button", text: "Hear the letters", onclick: () => spellLetters(word.w, word.lang) }),
          el("a", { href: wiki, target: "_blank", rel: "noreferrer", text: "More in Wiktionary" }),
        ]),
        el("div", { class: "sheet-actions" }, [
          el("button", {
            class: "primary",
            type: "button",
            text: S.over ? "See the floor" : "Next",
            onclick: afterReveal,
          }),
        ]),
      ]),
    ]);
  }

  function renderLobby() {
    const settings = defaultSettings();
    const store = loadStore();
    const last = store.games[store.games.length - 1];
    app.replaceChildren();
    const lobby = el("div", { class: "lobby" });
    const cover = el("section", { class: "cover honey" });
    cover.append(
      el("div", { class: "brand" }, [bellSVG(), document.createTextNode(" A floor, not a cartoon")]),
      el("div", {}, [
        el("h1", {}, [document.createTextNode("The "), el("em", { text: "spelling" }), document.createTextNode(" floor")]),
        el("p", { class: "lede", text: "Call the word. Hide it. Keep the clock. After the bell, learn how the word was made." }),
        el("dl", { class: "index" }, [
          el("dt", { text: "90" }),
          el("dd", { text: "Seconds to spell. Thirty if the round is meaning, not letters." }),
          el("dt", { text: "8" }),
          el("dd", { text: "Spellers on one device. Another room can play the same code." }),
          el("dt", { text: String(words().length || "—") }),
          el("dd", { text: "Words on this floor, with a note on how each one was made." }),
        ]),
      ]),
      el("div", { class: "cover-foot" }, [
        el("span", { text: "Not a national bee. A house floor." }),
        last ? el("span", { class: "last-line", text: `Last floor: ${last.winner || "a tie"}, ${last.level} ${last.mode}.` }) : el("span", { text: "No nights saved on this browser yet." }),
      ]),
    );

    const sheet = el("form", { class: "sheet" });
    sheet.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const data = readForm(sheet);
      startGame(data.settings, data.names);
    });
    sheet.append(
      el("h2", { text: "Call sheet" }),
      el("p", { class: "sub", text: "Pick the room, then the well." }),
      field("Spellers", namesEditor(settings.names)),
      field("Mode", choiceRow("mode", MODES, settings.mode)),
      field("Level", choiceRow("level", LEVELS, settings.level)),
      field("Languages", langRow(settings.languages)),
      field("Shared code", el("input", {
        class: "text-input",
        name: "code",
        placeholder: "FLOOR/en/school/classic/K7M2",
        "aria-label": "Shared code",
      })),
      el("label", { class: "check" }, [
        el("input", { type: "checkbox", name: "lenient", checked: settings.lenientAccents ? "checked" : null }),
        document.createTextNode(" Lenient accents on the school floors"),
      ]),
      el("label", { class: "check" }, [
        el("input", { type: "checkbox", name: "macrons", checked: settings.requireMacrons ? "checked" : null }),
        document.createTextNode(" Latin: require macrons"),
      ]),
      el("label", { class: "check" }, [
        el("input", { type: "checkbox", name: "music", checked: settings.music ? "checked" : null }),
        document.createTextNode(" Room tone under the round"),
      ]),
      el("label", { class: "check" }, [
        el("input", { type: "checkbox", name: "reveal", checked: settings.revealToRoom ? "checked" : null }),
        document.createTextNode(" Practice: show the word to the room"),
      ]),
      field("Rounds, when the mode uses a count", el("select", { class: "text-input", name: "rounds" }, [8, 12, 16, 24].map((n) => {
        const o = el("option", { value: String(n), text: String(n) });
        if (n === settings.rounds) o.selected = true;
        return o;
      }))),
      el("div", { class: "sheet-actions" }, [
        el("button", { class: "primary", type: "submit", text: "Open the floor" }),
      ]),
      el("div", { class: "fine" }, [
        el("button", { type: "button", text: "Nights and missed words", onclick: () => renderHistory() }),
        el("button", { type: "button", text: "Rules of this floor", onclick: () => renderRules() }),
        el("button", { type: "button", text: "Study", onclick: () => renderStudy() }),
      ]),
    );
    lobby.append(cover, sheet);
    app.append(lobby);
  }

  function field(label, control) {
    return el("div", { class: "field" }, [el("div", { class: "legend", text: label }), control]);
  }

  function choiceRow(name, map, current) {
    return el("div", { class: "row", id: `row-${name}` }, Object.entries(map).map(([id, info]) => el("button", {
      type: "button",
      class: "choice",
      "aria-pressed": id === current ? "true" : "false",
      "data-name": name,
      "data-value": id,
      text: info.label,
      onclick: (ev) => {
        document.querySelectorAll(`[data-name="${name}"]`).forEach((b) => b.setAttribute("aria-pressed", "false"));
        ev.currentTarget.setAttribute("aria-pressed", "true");
      },
    })));
  }

  function langRow(current) {
    return el("div", { class: "row", id: "row-lang" }, Object.entries(LANGS).map(([id, info]) => el("button", {
      type: "button",
      class: "lang-chip",
      "aria-pressed": current.includes(id) ? "true" : "false",
      "data-lang": id,
      text: info.label,
      onclick: (ev) => {
        const on = ev.currentTarget.getAttribute("aria-pressed") === "true";
        const selected = [...document.querySelectorAll("[data-lang]")].filter((b) => b.getAttribute("aria-pressed") === "true");
        if (on && selected.length === 1) return;
        ev.currentTarget.setAttribute("aria-pressed", on ? "false" : "true");
      },
    })));
  }

  function namesEditor(names) {
    const box = el("div", { class: "names", id: "names" });
    const paint = (list) => {
      box.replaceChildren();
      list.forEach((name, i) => {
        const input = el("input", { class: "text-input", value: name, "aria-label": `Speller ${i + 1}`, placeholder: `Speller ${i + 1}` });
        input.value = name;
        const row = el("div", { class: "name-row" }, [
          input,
          el("button", {
            type: "button",
            class: "ghost",
            text: "Remove",
            onclick: () => {
              const now = readNames();
              if (now.length === 1) return;
              now.splice(i, 1);
              paint(now);
            },
          }),
        ]);
        box.append(row);
      });
      if (list.length < 8) {
        box.append(el("button", {
          type: "button",
          class: "ghost",
          text: "Add a speller",
          onclick: () => paint(readNames().concat("")),
        }));
      }
    };
    function readNames() {
      return [...box.querySelectorAll("input")].map((n) => n.value);
    }
    paint(names.length ? names : [""]);
    box.readNames = readNames;
    return box;
  }

  function readForm(sheet) {
    const pressed = (name) => sheet.querySelector(`[data-name="${name}"][aria-pressed="true"]`)?.dataset.value;
    const languages = [...sheet.querySelectorAll("[data-lang][aria-pressed='true']")].map((b) => b.dataset.lang);
    const names = sheet.querySelector("#names").readNames();
    return {
      names: names.length ? names : [""],
      settings: {
        mode: pressed("mode") || "classic",
        level: pressed("level") || "school",
        languages: languages.length ? languages : ["en"],
        lenientAccents: !!sheet.querySelector("[name=lenient]")?.checked,
        requireMacrons: !!sheet.querySelector("[name=macrons]")?.checked,
        music: !!sheet.querySelector("[name=music]")?.checked,
        revealToRoom: !!sheet.querySelector("[name=reveal]")?.checked,
        volume: 0.35,
        rounds: Number(sheet.querySelector("[name=rounds]").value),
        code: sheet.querySelector("[name=code]").value.trim(),
      },
    };
  }

  function renderResults() {
    app.replaceChildren();
    const page = el("main", { class: "panel-page" });
    const wrap = el("div", { class: "wrap" });
    wrap.append(
      el("button", { class: "back", type: "button", text: "Back to the call sheet", onclick: () => { S = null; renderLobby(); } }),
      el("h1", { text: winnerName() ? `${winnerName()} holds the floor.` : "The floor is closed." }),
      el("p", { text: S.saved ? "This night is saved on this browser." : "Could not save on this browser." }),
      el("p", {}, [document.createTextNode("Same words elsewhere: "), el("code", { class: "seed", text: S.code })]),
    );
    const list = el("div", { class: "career" });
    S.players.forEach((p) => {
      list.append(el("article", {}, [
        el("h3", { text: p.name }),
        el("p", { text: `${p.correct} right, ${p.missed} missed, ${p.points} points, best run ${p.bestStreak}.` }),
      ]));
    });
    wrap.append(list);
    const review = el("div", { class: "game-list" });
    S.log.forEach((e) => {
      review.append(el("article", { class: "night" }, [
        el("h3", { text: `${e.ok ? "In" : "Miss"} · ${e.word}` }),
        el("p", { text: `${e.speller}${e.given ? ` wrote “${e.given}”` : ""}. ${e.etym}` }),
      ]));
    });
    wrap.append(
      el("h2", { text: "The words" }),
      review,
      el("div", { class: "sheet-actions" }, [
        el("button", { class: "primary", type: "button", text: "Rematch this code", onclick: () => rematch() }),
      ]),
    );
    page.append(wrap);
    app.append(page);
  }

  function rematch() {
    const settings = { ...S.settings, code: S.code };
    const names = S.players.map((p) => p.name);
    startGame(settings, names);
  }

  function renderHistory() {
    const store = loadStore();
    app.replaceChildren();
    const page = el("main", { class: "panel-page" });
    const wrap = el("div", { class: "wrap" });
    wrap.append(
      el("button", { class: "back", type: "button", text: "Back", onclick: renderLobby }),
      el("h1", { text: "Nights on this browser" }),
      el("p", { text: "History stays here until you export it. GitHub cannot see these games." }),
    );
    const career = tally(store);
    const careerBox = el("div", { class: "career" });
    Object.entries(career).forEach(([name, row]) => {
      careerBox.append(el("article", {}, [
        el("h3", { text: name }),
        el("p", { text: `${row.games} nights · ${row.correct} right · ${row.missed} missed` }),
      ]));
    });
    const nights = el("div", { class: "game-list" });
    store.games.slice().reverse().forEach((g) => {
      nights.append(el("article", { class: "night" }, [
        el("h3", { text: `${g.winner || "No single holder"} · ${g.level} ${g.mode}` }),
        el("p", { text: `${new Date(g.when).toLocaleString()} · ${g.players.map((p) => p.name).join(", ")}` }),
        el("p", {}, [el("code", { class: "seed", text: g.code })]),
      ]));
    });
    if (!store.games.length) nights.append(el("p", { text: "Nothing saved yet." }));
    const file = el("input", { type: "file", accept: "application/json" });
    file.addEventListener("change", async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      try {
        const incoming = JSON.parse(await f.text());
        if (!incoming || incoming.version !== 1 || !Array.isArray(incoming.games)) throw new Error("bad");
        const cur = loadStore();
        const ids = new Set(cur.games.map((g) => g.id));
        incoming.games.forEach((g) => { if (g && g.id && !ids.has(g.id)) cur.games.push(g); });
        cur.seen = [...new Set([...(cur.seen || []), ...(incoming.seen || [])])];
        saveStore(cur);
        renderHistory();
      } catch {
        renderMessage("That file is not a Spelling Floor export.");
      }
    });
    wrap.append(
      el("h2", { text: "By speller" }),
      careerBox,
      el("h2", { text: "Nights" }),
      nights,
      el("div", { class: "sheet-actions" }, [
        el("button", { class: "primary", type: "button", text: "Export history", onclick: exportHistory }),
        el("button", { class: "ghost", type: "button", text: "Import", onclick: () => file.click() }),
        el("button", { class: "ghost", type: "button", text: "Study missed words", onclick: renderStudy }),
      ]),
      file,
    );
    page.append(wrap);
    app.append(page);
  }

  function tally(store) {
    const out = {};
    store.games.forEach((g) => {
      (g.players || []).forEach((p) => {
        const key = p.name;
        out[key] = out[key] || { games: 0, correct: 0, missed: 0 };
        out[key].games += 1;
        out[key].correct += p.correct || 0;
        out[key].missed += p.missed || 0;
      });
    });
    return out;
  }

  function exportHistory() {
    const blob = new Blob([JSON.stringify(loadStore(), null, 2)], { type: "application/json" });
    const a = el("a", { href: URL.createObjectURL(blob), download: "spelling-floor-history.json" });
    document.body.append(a);
    a.click();
    a.remove();
  }

  function renderRules() {
    app.replaceChildren();
    const page = el("main", { class: "panel-page" });
    const wrap = el("div", { class: "wrap rules" });
    wrap.append(
      el("button", { class: "back", type: "button", text: "Back", onclick: renderLobby }),
      el("h1", { text: "Rules of this floor" }),
      el("p", { text: "This is a house game. It is not the Scripps National Spelling Bee, and it does not use their word list. The clock and the caller’s limits follow the public shape of the major bees." }),
      el("h2", { text: "A turn" }),
      el("p", { text: "The caller sees the word. The speller does not. The clock starts when the caller says so, and the browser speaks the word. The speller may ask for a repeat, a definition, a sentence, the part of speech, and the language of origin. In the last 15 seconds the floor goes quiet. A house may pause. A national bee would not." }),
      el("h2", { text: "Modes" }),
      el("ul", {}, [
        el("li", { text: "Classic: a miss sits you down. If everyone in the round misses, nobody sits. Last speller standing holds the floor." }),
        el("li", { text: "Points: miss and stay. A right answer is 10, plus up to 5 for time left." }),
        el("li", { text: "Meaning: the word is shown. Four senses. Thirty seconds." }),
        el("li", { text: "Written: one speller, a fixed list, others step away. Forty-five seconds a word." }),
        el("li", { text: "Spell-off: ninety seconds, as many words as you can. The cards come after, not between." }),
        el("li", { text: "Roots: you see how the word was made, then you spell it." }),
      ]),
      el("h2", { text: "Languages" }),
      el("p", { text: "English, Spanish, French, and Latin. Accents count, unless you turn on the lenient school rule. Latin macrons are optional unless you require them. A shared code lets another device draw the same words. Scores do not fly between devices. Export the night if you want the file." }),
      el("h2", { text: "What is saved" }),
      el("p", { text: "Nights, missed words, and words already heard stay in this browser. Clear the site data and they go. Nothing is sent to a server." }),
    );
    page.append(wrap);
    app.append(page);
  }

  function renderStudy() {
    const store = loadStore();
    const missed = Object.entries(store.missed || {});
    app.replaceChildren();
    const page = el("main", { class: "panel-page" });
    const wrap = el("div", { class: "wrap" });
    wrap.append(
      el("button", { class: "back", type: "button", text: "Back", onclick: renderLobby }),
      el("h1", { text: "Study" }),
      el("p", { text: "Missed words, then the making of them. Spell to lock one in." }),
    );
    if (!missed.length) wrap.append(el("p", { text: "No misses saved yet. Play a round first, or open any word from a night." }));
    missed.forEach(([name, list]) => {
      wrap.append(el("h2", { text: name }));
      const box = el("div");
      list.slice().reverse().slice(0, 40).forEach((item) => {
        const row = el("div", { class: "missed-word" }, [
          el("div", {}, [
            el("strong", { text: item.w }),
            el("p", { text: item.etym || item.def || "" }),
          ]),
          el("button", {
            class: "ghost",
            type: "button",
            text: "Spell it",
            onclick: () => startStudy(item),
          }),
        ]);
        box.append(row);
      });
      wrap.append(box);
    });
    page.append(wrap);
    app.append(page);
  }

  function startStudy(item) {
    const word = words().find((w) => w.w === item.w && w.lang === item.lang) || {
      w: item.w, lang: item.lang || "en", pos: "", b: 1, origin: "", def: item.def || "", ex: "", etym: item.etym || "", pat: "", say: "",
    };
    S = {
      screen: "play",
      settings: { mode: "study", level: "school", languages: [word.lang], music: audio.on, volume: audio.volume, rounds: 1, revealToRoom: true, lenientAccents: false, requireMacrons: false },
      seed: "STUDY",
      code: "STUDY",
      deck: [word],
      wordCursor: 1,
      players: [{ id: "p0", name: "Study", color: SEATS[0], correct: 0, missed: 0, points: 0, out: false, streak: 0, bestStreak: 0, taken: 0, ms: [] }],
      spellerIndex: 0,
      phase: "clock",
      current: word,
      remaining: 0,
      limit: 0,
      paused: false,
      log: [],
      over: false,
      mercyNote: "",
    };
    render();
  }

  function renderMessage(text) {
    app.replaceChildren(el("main", { class: "panel-page" }, [
      el("div", { class: "wrap" }, [
        el("h1", { text: "Hold on." }),
        el("p", { text }),
        el("button", { class: "primary", type: "button", text: "Back", onclick: renderLobby }),
      ]),
    ]));
  }

  function render() {
    if (!words().length) {
      renderMessage("The word well did not load. words.js is missing beside this page.");
      return;
    }
    if (!S || S.screen === "lobby") return renderLobby();
    if (S.screen === "results" || S.phase === "results") return renderResults();
    return renderPlay();
  }

  function selfTest() {
    const opts = { lenientAccents: false, stripMacrons: false };
    const soft = { lenientAccents: true, stripMacrons: false };
    const macro = { lenientAccents: false, stripMacrons: true };
    const checks = [
      ["case", fold("Hello") === "hello"],
      ["apostrophe", fold("hors d’oeuvre") === "hors d'oeuvre"],
      ["hyphen space", fold("hors - d'oeuvre") === "hors-d'oeuvre"],
      ["match alt", answersMatch("hors d'oeuvre", { w: "hors-d'oeuvre", alt: ["hors d'oeuvre"], lang: "en" }, opts)],
      ["accent strict", !answersMatch("musica", { w: "música", alt: [], lang: "es" }, opts)],
      ["accent soft", answersMatch("musica", { w: "música", alt: [], lang: "es" }, soft)],
      ["macron strip", answersMatch("rex", { w: "rēx", alt: [], lang: "la" }, macro)],
      ["empty", !answersMatch("  ", { w: "bee", alt: [], lang: "en" }, opts)],
      ["mismatch index", firstMismatch("bee", "bee") === -1 && firstMismatch("bay", "bee") === 1],
    ];
    const failed = checks.filter((c) => !c[1]);
    return { ok: failed.length === 0, failed: failed.map((c) => c[0]), words: words().length };
  }

  document.addEventListener("keydown", (ev) => {
    if (!S || S.phase !== "clock" || hintsLocked()) return;
    if (!ev.altKey) return;
    const map = { r: "repeat", d: "def", s: "ex", o: "origin", p: "pos" };
    const kind = map[ev.key.toLowerCase()];
    if (!kind) return;
    ev.preventDefault();
    showHint(kind);
  });

  window.FLOOR = { fold, answersMatch, selfTest, parseCode };
  if (window.speechSynthesis) speechSynthesis.getVoices();
  render();
})();
