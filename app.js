/* Киновайб: логика сайта. Фильмы, режиссёры и подборки лежат в data.js. */

/* Ссылка, к которой добавляется адрес раздела при нажатии «Поделиться».
   Когда у сайта появится свой домен, замените её на него. */
var SHARE_BASE = (window.claude || !/^https?:$/.test(location.protocol))
  ? "https://claude.ai/artifact/C6xExahvNCA1iubQYD7Lnk"
  : location.origin + location.pathname;

var MOODS = [
  { id: "cozy",      name: "Уютно",       sub: "тепло и спокойно",   hue: 70 },
  { id: "tense",     name: "Напряжение",  sub: "не оторваться",      hue: 250 },
  { id: "mystic",    name: "Мистика",     sub: "странно и красиво",  hue: 305 },
  { id: "fun",       name: "Смех",        sub: "посмеяться",         hue: 25 },
  { id: "soul",      name: "Душевно",     sub: "до мурашек",         hue: 190 },
  { id: "love",      name: "Романтично",  sub: "для двоих",          hue: 350 },
  { id: "action",    name: "Адреналин",   sub: "динамика и экшен",   hue: 220 },
  { id: "scary",     name: "Страшно",     sub: "пощекотать нервы",   hue: 130 },
  { id: "inspire",   name: "Вдохновляет", sub: "заряд на действия",  hue: 95 },
  { id: "nostalgia", name: "Ностальгия",  sub: "кино из детства",    hue: 50 }
];
var COMPANY = [
  { id: "any", name: "Любая" },
  { id: "o",   name: "Один" },
  { id: "p",   name: "Вдвоём" },
  { id: "f",   name: "С друзьями" },
  { id: "k",   name: "С семьёй" }
];
var COMPANY_NAME = { o: "Один", p: "Вдвоём", f: "С друзьями", k: "С семьёй" };
var TIMES = [
  { id: "any", name: "Любое" },
  { id: "s",   name: "До 100 мин" },
  { id: "m",   name: "100–140 мин" },
  { id: "l",   name: "Больше 140 мин" }
];
/* Варианты ответов в опросе из трёх вопросов */
var Q_COMPANY = [
  { id: "o",   name: "Один",         sub: "для себя",             hue: 190 },
  { id: "p",   name: "Вдвоём",       sub: "с близким человеком",  hue: 350 },
  { id: "f",   name: "С друзьями",   sub: "компанией",            hue: 25 },
  { id: "k",   name: "С семьёй",     sub: "в том числе с детьми", hue: 95 },
  { id: "any", name: "Без разницы",  sub: "любая компания",       hue: 250 }
];
var Q_TIME = [
  { id: "s",   name: "Меньше 100 мин",  sub: "быстро и без затяжек", hue: 25 },
  { id: "m",   name: "100–140 мин",     sub: "обычный фильм",        hue: 190 },
  { id: "l",   name: "Больше 140 мин",  sub: "целый вечер",          hue: 305 },
  { id: "any", name: "Неважно",         sub: "любая длина",          hue: 250 }
];

var state = {
  mood: "cozy", company: "any", time: "any", idx: 0,
  dir: null, col: null, film: null, rand: null, view: "mood", last: "", from: "",
  quiz: { step: 0, mood: null, company: null, time: null, idx: 0 }
};

/* ---------- Мелочи ---------- */
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function norm(s) { return String(s).toLowerCase().replace(/ё/g, "е"); }
function moodById(id) { return MOODS.filter(function (x) { return x.id === id; })[0]; }
function dirById(id) { return DIRECTORS.filter(function (d) { return d.id === id; })[0]; }
function colById(id) { return COLLECTIONS.filter(function (c) { return c.id === id; })[0]; }
function setHue(n) { document.documentElement.style.setProperty("--hue", n); }
function runtime(m) {
  var h = Math.floor(m / 60), r = m % 60;
  if (!h) return r + " мин";
  return r ? h + " ч " + r + " мин" : h + " ч";
}
function plural(n) {
  var a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return n + " фильм";
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return n + " фильма";
  return n + " фильмов";
}
function poster(f, i) {
  return '<div class="poster" data-pt="' + esc(f.t) + '" data-py="' + f.y + '" style="--ph: calc(var(--hue) + ' + (i * 6) + ')">' +
    '<span class="yr">' + f.y + '</span><p class="ttl">' + f.t + '</p></div>';
}

/* Единый каталог: название превращается в данные о фильме */
var CATALOG = null;
function catalog() {
  if (CATALOG) return CATALOG;
  var c = {};
  FILMS.forEach(function (f) { c[f.t] = { t: f.t, y: f.y, d: f.d, w: f.w, g: f.g, m: f.m, c: f.c }; });
  COLLECTIONS.forEach(function (col) {
    col.films.forEach(function (f) { if (!c[f[0]]) c[f[0]] = { t: f[0], y: f[1], d: f[2], w: f[3] }; });
  });
  DIRECTORS.forEach(function (d) {
    d.films.forEach(function (f) { if (!c[f[0]]) c[f[0]] = { t: f[0], y: f[1], d: f[2] }; });
  });
  CATALOG = c;
  return c;
}

/* Адрес страницы фильма: название латиницей, только буквы, цифры и дефисы */
var TR = { "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e", "ж": "zh", "з": "z", "и": "i", "й": "y",
  "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "kh",
  "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya" };
function slugify(t) {
  var out = "";
  String(t).toLowerCase().split("").forEach(function (ch) { out += TR.hasOwnProperty(ch) ? TR[ch] : ch; });
  return out.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
var SLUGS = null, TITLE_BY_SLUG = null;
function buildSlugs() {
  if (SLUGS) return;
  SLUGS = {};
  TITLE_BY_SLUG = {};
  Object.keys(catalog()).forEach(function (t) {
    var base = slugify(t) || "film", s = base, n = 2;
    while (TITLE_BY_SLUG.hasOwnProperty(s)) { s = base + "-" + n; n++; }
    SLUGS[t] = s;
    TITLE_BY_SLUG[s] = t;
  });
}
function slugOf(t) { buildSlugs(); return SLUGS[t]; }
function titleOf(slug) { buildSlugs(); return TITLE_BY_SLUG.hasOwnProperty(slug) ? TITLE_BY_SLUG[slug] : null; }

function dirNameOf(t) {
  if (DIRECTOR_OF[t]) return DIRECTOR_OF[t];
  var d = DIRECTORS.filter(function (x) { return x.films.some(function (f) { return f[0] === t; }); })[0];
  return d ? d.name : null;
}
function dirLine(t) {
  var name = dirNameOf(t);
  if (!name) return "";
  var d = DIRECTORS.filter(function (x) { return x.name === name; })[0];
  var inner = d ? '<button class="dirlink" type="button" data-dir="' + d.id + '">' + name + '</button>' : name;
  return '<p class="meta dr">Режиссёр: ' + inner + '</p>';
}
function nmLink(t) {
  return '<button class="nm lnk" type="button" data-film="' + esc(slugOf(t)) + '">' + t + '</button>';
}

/* ---------- Мой список (профиль) ---------- */
var me = { name: "", want: [], seen: [], rate: {}, note: {} };
var store = { ref: null, mode: "browser" };
var dirty = false, saving = false, pending = false, nameTimer = null, noteTimer = null;

function asList(x) {
  return Array.isArray(x) ? x.filter(function (v) { return typeof v === "string"; }) : [];
}
function asRate(x) {
  var out = {};
  if (x && typeof x === "object") Object.keys(x).forEach(function (k) {
    var v = x[k];
    if (typeof v === "number" && v >= 1 && v <= 5) out[k] = Math.round(v);
  });
  return out;
}
function asNote(x) {
  var out = {};
  if (x && typeof x === "object") Object.keys(x).forEach(function (k) {
    if (typeof x[k] === "string" && x[k]) out[k] = x[k].slice(0, 280);
  });
  return out;
}
function fromData(d) {
  d = d || {};
  return { name: typeof d.name === "string" ? d.name : "", want: asList(d.want), seen: asList(d.seen), rate: asRate(d.rate), note: asNote(d.note) };
}
function loadLocal() {
  try {
    var s = localStorage.getItem("kinovaib-me");
    if (s) me = fromData(JSON.parse(s));
  } catch (e) { /* хранилище недоступно, работаем без него */ }
}
function saveLocal() {
  try { localStorage.setItem("kinovaib-me", JSON.stringify(me)); } catch (e) { /* ничего */ }
}
function payload() {
  return { name: me.name, want: me.want.slice(), seen: me.seen.slice(), rate: Object.assign({}, me.rate), note: Object.assign({}, me.note) };
}
function persist() {
  dirty = true;
  if (!store.ref) { saveLocal(); return; }
  if (saving) { pending = true; return; }
  saving = true;
  store.ref.set(payload()).then(function () {
    saving = false;
    if (pending) { pending = false; persist(); }
  }, function () {
    saving = false;
    pending = false;
    store.ref = null;
    store.mode = "browser";
    saveLocal();
    if (state.view === "me") renderMy();
  });
}
function refreshView() {
  if (state.view === "me") renderMy();
  else if (state.view === "film") renderFilm();
  else if (state.view === "quiz") renderQuiz();
  else refreshActs();
}
function initAccount() {
  if (!window.claude || !window.claude.use) return;
  Promise.all([window.claude.use("db"), window.claude.use("user")]).then(function (r) {
    var db = r[0], user = r[1];
    if (!db || !user) return null;
    return user.id().then(function (uid) {
      if (!uid) return null;
      var ref = db.doc("data/users/" + uid + "/profile");
      return ref.get().then(function (snap) {
        store.ref = ref;
        store.mode = "account";
        if (snap.exists && !dirty) {
          me = fromData(snap.data());
        } else if (dirty || me.want.length || me.seen.length || me.name) {
          persist();
        }
        refreshView();
      });
    });
  }).catch(function () { /* без аккаунта список остаётся в браузере */ });
}

function inList(k, t) { return me[k].indexOf(t) !== -1; }
function drop(k, t) { me[k] = me[k].filter(function (x) { return x !== t; }); }
function afterChange() { persist(); refreshView(); }
function toggleWant(t) {
  if (inList("want", t)) drop("want", t); else { drop("seen", t); me.want.push(t); }
  afterChange();
}
function toggleSeen(t) {
  if (inList("seen", t)) drop("seen", t); else { drop("want", t); me.seen.push(t); }
  afterChange();
}
function toggleMini(t) {
  if (inList("want", t) || inList("seen", t)) { drop("want", t); drop("seen", t); }
  else me.want.push(t);
  afterChange();
}
function myAction(a, t) {
  if (a === "seen") { drop("want", t); if (!inList("seen", t)) me.seen.push(t); }
  else if (a === "want") { drop("seen", t); if (!inList("want", t)) me.want.push(t); }
  else { drop("want", t); drop("seen", t); delete me.rate[t]; delete me.note[t]; }
  afterChange();
}
function setRate(t, n) {
  if (me.rate[t] === n) delete me.rate[t]; else me.rate[t] = n;
  afterChange();
}

function actsHtml(t, noPage) {
  var e = esc(t), w = inList("want", t), s = inList("seen", t);
  return '<div class="acts">' +
    '<button class="act" type="button" data-want="' + e + '" aria-pressed="' + w + '">' + (w ? "В списке" : "Хочу посмотреть") + '</button>' +
    '<button class="act" type="button" data-seen="' + e + '" aria-pressed="' + s + '">Просмотрено</button>' +
    (noPage ? "" : '<button class="act" type="button" data-film="' + esc(slugOf(t)) + '">Страница фильма</button>') + '</div>';
}
function miniHtml(t) {
  var w = inList("want", t), s = inList("seen", t);
  return '<button class="act mini" type="button" data-mini="' + esc(t) + '" aria-pressed="' + (w || s) + '">' +
    (s ? "Просмотрено" : w ? "В списке" : "Хочу посмотреть") + '</button>';
}
function refreshActs() {
  Array.prototype.forEach.call(document.querySelectorAll("[data-want],[data-seen],[data-mini]"), function (b) {
    var d = b.dataset, on;
    if (d.want !== undefined) {
      on = inList("want", d.want);
      b.setAttribute("aria-pressed", String(on));
      b.textContent = on ? "В списке" : "Хочу посмотреть";
    } else if (d.seen !== undefined) {
      b.setAttribute("aria-pressed", String(inList("seen", d.seen)));
    } else {
      var s = inList("seen", d.mini), w = inList("want", d.mini);
      b.setAttribute("aria-pressed", String(s || w));
      b.textContent = s ? "Просмотрено" : w ? "В списке" : "Хочу посмотреть";
    }
  });
}
function starsHtml(t) {
  var r = me.rate[t] || 0, h = "";
  for (var i = 1; i <= 5; i++) {
    h += '<button class="star" type="button" data-rate="' + i + '" data-t="' + esc(t) + '" aria-label="Оценка ' + i + ' из 5" aria-pressed="' + (i <= r) + '">' + (i <= r ? "★" : "☆") + '</button>';
  }
  return '<div class="stars" role="group" aria-label="Ваша оценка">' + h + '</div>';
}
function shareHtml() {
  return '<div class="acts"><button class="act" type="button" data-share="1">Поделиться</button></div>';
}
function doShare(btn) {
  var url = SHARE_BASE + "#" + (location.hash || "").replace("#", "");
  function done() {
    var old = btn.textContent;
    btn.textContent = "Ссылка скопирована";
    setTimeout(function () { btn.textContent = old; }, 2000);
  }
  function fallback() {
    var box = document.getElementById("sharebox");
    if (!box) {
      box = document.createElement("input");
      box.id = "sharebox";
      box.className = "field";
      box.readOnly = true;
      btn.parentNode.appendChild(box);
    }
    box.value = url;
    box.focus();
    box.select();
  }
  try { navigator.clipboard.writeText(url).then(done, fallback); } catch (e) { fallback(); }
}

/* ---------- Поиск ---------- */
function hideSearch() {
  var r = document.getElementById("sres");
  r.hidden = true;
  r.innerHTML = "";
}
function runSearch() {
  var input = document.getElementById("q");
  var r = document.getElementById("sres");
  var q = norm(input.value.trim());
  if (!q) { hideSearch(); return; }
  var c = catalog();
  var films = Object.keys(c).filter(function (t) { return norm(t).indexOf(q) !== -1; })
    .sort(function (a, b) { return (norm(a).indexOf(q) === 0 ? 0 : 1) - (norm(b).indexOf(q) === 0 ? 0 : 1); })
    .slice(0, 7);
  var dirs = DIRECTORS.filter(function (d) { return norm(d.name).indexOf(q) !== -1; }).slice(0, 3);
  var html = dirs.map(function (d) {
    return '<button type="button" data-dir="' + d.id + '"><span>' + d.name + '</span><small>режиссёр</small></button>';
  }).join("") + films.map(function (t) {
    return '<button type="button" data-film="' + esc(slugOf(t)) + '"><span>' + t + '</span><small>' + c[t].y + '</small></button>';
  }).join("");
  r.innerHTML = html || '<p class="sempty">Ничего не нашлось. Попробуйте другое название.</p>';
  r.hidden = false;
}

/* ---------- Подбор по настроению ---------- */
function inTime(d, t) {
  return t === "any" || (t === "s" && d < 100) || (t === "m" && d >= 100 && d <= 140) || (t === "l" && d > 140);
}
function matches(f, mood, company, time) {
  return f.m.split(" ").indexOf(mood) !== -1 &&
    (company === "any" || f.c.indexOf(company) !== -1) && inTime(f.d, time);
}
function list() {
  return FILMS.filter(function (f) { return matches(f, state.mood, state.company, state.time); });
}
function countFor(company, time) {
  return FILMS.filter(function (f) { return matches(f, state.mood, company, time); }).length;
}

function renderControls() {
  document.getElementById("moods").innerHTML = MOODS.map(function (x) {
    return '<button class="mood" type="button" data-mood="' + x.id + '" aria-pressed="' + (x.id === state.mood) + '">' +
      '<b><i class="dot" style="--dot:' + x.hue + '"></i>' + x.name + '</b><span>' + x.sub + '</span></button>';
  }).join("");
  document.getElementById("chips").innerHTML = COMPANY.map(function (x) {
    var n = countFor(x.id, state.time);
    var off = x.id !== "any" && n === 0 && state.company !== x.id;
    return '<button class="chip" type="button" data-company="' + x.id + '" aria-pressed="' + (x.id === state.company) + '"' + (off ? " disabled" : "") + '>' +
      x.name + (x.id === "any" ? "" : ' <span class="n">' + n + '</span>') + '</button>';
  }).join("");
  document.getElementById("times").innerHTML = TIMES.map(function (x) {
    var n = countFor(state.company, x.id);
    var off = x.id !== "any" && n === 0 && state.time !== x.id;
    return '<button class="chip" type="button" data-time="' + x.id + '" aria-pressed="' + (x.id === state.time) + '"' + (off ? " disabled" : "") + '>' +
      x.name + (x.id === "any" ? "" : ' <span class="n">' + n + '</span>') + '</button>';
  }).join("");
}

function pickHtml(f, eyebrow, extra) {
  var tags = ["o", "p", "f", "k"].filter(function (k) { return (f.c || "").indexOf(k) !== -1; }).map(function (k) {
    return "<li>" + COMPANY_NAME[k] + "</li>";
  }).join("");
  return '<article class="pick">' + poster(f, 0) +
    '<div><p class="eyebrow">' + eyebrow + '</p>' +
    '<h2>' + f.t + '</h2>' +
    '<p class="meta">' + f.y + ' · ' + runtime(f.d) + (f.g ? ' · ' + f.g : '') + '</p>' + dirLine(f.t) +
    (f.w ? '<p class="why">' + f.w + '</p>' : '') +
    (tags ? '<ul class="tags">' + tags + '</ul>' : '') + actsHtml(f.t) + (extra || '') +
    '</div></article>';
}

function renderResult() {
  var items = list();
  var pickEl = document.getElementById("pick");
  var grid = document.getElementById("grid");
  var count = document.getElementById("count");
  if (!items.length) {
    pickEl.innerHTML = '<div class="empty">Для этого сочетания пока нет фильмов. Попробуйте другую компанию или время.</div>';
    grid.innerHTML = "";
    count.textContent = "";
    return;
  }
  state.idx = state.idx % items.length;
  var f = items[state.idx];
  var mood = moodById(state.mood);
  pickEl.innerHTML = pickHtml(f, "Сегодня вечером · " + mood.name,
    items.length > 1 ? '<button class="go" type="button" id="reroll">Другой фильм</button>' : '');

  var rest = items.map(function (x, i) { return { f: x, i: i }; }).filter(function (o) { return o.i !== state.idx; });
  grid.innerHTML = rest.map(function (o, k) {
    return '<button class="card" type="button" data-idx="' + o.i + '">' + poster(o.f, k + 1) +
      '<span class="nm">' + o.f.t + '</span><span class="sub">' + o.f.y + ' · ' + runtime(o.f.d) + '</span></button>';
  }).join("");
  count.textContent = rest.length ? "Ещё " + rest.length + " под это настроение" : "";
}

function setMood(id) {
  state.mood = id;
  state.idx = 0;
  setHue(moodById(id).hue);
  if (!list().length) { state.company = "any"; state.time = "any"; }
  renderControls();
  renderResult();
}

/* ---------- Подбор за три вопроса ---------- */
function quizList() {
  var q = state.quiz;
  var a = FILMS.filter(function (f) { return matches(f, q.mood, q.company, q.time); });
  var note = "";
  if (!a.length) {
    a = FILMS.filter(function (f) { return matches(f, q.mood, q.company, "any"); });
    note = "Точных совпадений по времени нет, поэтому показываем ближайшие.";
  }
  if (!a.length) {
    a = FILMS.filter(function (f) { return matches(f, q.mood, "any", "any"); });
    note = "Под эту компанию пока нет фильмов, поэтому показываем подходящие по настроению.";
  }
  return { items: a, note: note };
}
function quizAnswer(k, v) {
  var q = state.quiz;
  q[k] = v;
  if (k === "mood") setHue(moodById(v).hue);
  q.step += 1;
  q.idx = 0;
  if (q.step === 3) {
    var n = quizList().items.length;
    q.idx = n ? Math.floor(Math.random() * n) : 0;
  }
  renderQuiz();
}
function optButtons(key, arr, current) {
  return '<div class="moods">' + arr.map(function (x) {
    return '<button class="mood" type="button" data-qk="' + key + '" data-qv="' + x.id + '" aria-pressed="' + (x.id === current) + '">' +
      '<b><i class="dot" style="--dot:' + x.hue + '"></i>' + x.name + '</b><span>' + x.sub + '</span></button>';
  }).join("") + '</div>';
}
function renderQuiz() {
  var el = document.getElementById("quizView");
  var q = state.quiz;
  var head = '<header><p class="eyebrow">Подбор за три вопроса</p>';
  if (q.step === 0) {
    el.innerHTML = head + '<h2 class="dname">Что хочется почувствовать?</h2><p class="lead">Вопрос 1 из 3</p></header>' + optButtons("mood", MOODS, q.mood);
    return;
  }
  if (q.step === 1) {
    el.innerHTML = '<button class="back" type="button" data-qback="1">← Назад</button>' + head +
      '<h2 class="dname">С кем смотрите?</h2><p class="lead">Вопрос 2 из 3</p></header>' + optButtons("company", Q_COMPANY, q.company);
    return;
  }
  if (q.step === 2) {
    el.innerHTML = '<button class="back" type="button" data-qback="1">← Назад</button>' + head +
      '<h2 class="dname">Сколько есть времени?</h2><p class="lead">Вопрос 3 из 3</p></header>' + optButtons("time", Q_TIME, q.time);
    return;
  }
  var res = quizList();
  if (!res.items.length) {
    el.innerHTML = head + '<h2 class="dname">Пока ничего не нашли</h2></header><button class="go" type="button" data-qreset="1">Пройти заново</button>';
    return;
  }
  var f = res.items[q.idx % res.items.length];
  var mood = moodById(q.mood);
  el.innerHTML = '<button class="back" type="button" data-qback="1">← Назад</button>' +
    '<header><p class="eyebrow">Ваш фильм</p><h2 class="dname">Смотрите вот это</h2>' +
    (res.note ? '<p class="lead">' + res.note + '</p>' : '') + '</header>' +
    pickHtml(f, "Под настроение · " + mood.name,
      '<div class="acts">' +
      (res.items.length > 1 ? '<button class="go" type="button" data-qnext="1">Другой вариант</button>' : '') +
      '<button class="act" type="button" data-qreset="1">Пройти заново</button>' +
      '<button class="act" type="button" data-qapply="1">Все фильмы под эти ответы</button></div>');
}

/* ---------- Режиссёры ---------- */
function renderDirectors() {
  var el = document.getElementById("dirView");
  var d = state.dir ? dirById(state.dir) : null;
  if (!d) {
    el.innerHTML =
      '<header><h2 class="dname">Режиссёры, с которых стоит начать</h2>' +
      '<p class="lead">Выберите режиссёра и посмотрите его главные фильмы по годам. Для каждого отмечено, с какого лучше знакомиться.</p></header>' +
      '<div class="dirs">' + DIRECTORS.map(function (x) {
        return '<button class="dcard" type="button" data-dir="' + x.id + '">' +
          '<span class="dtop"><i class="dot" style="--dot:' + x.hue + '"></i><b>' + x.name + '</b></span>' +
          '<span class="dsub">' + x.country + '</span><span class="dsig">' + x.sig + '</span>' +
          '<span class="dgo">Начать с: ' + x.start + '</span></button>';
      }).join("") + '</div>';
    return;
  }
  var si = 0;
  d.films.forEach(function (f, i) { if (f[0] === d.start) si = i; });
  var s = d.films[si];
  el.innerHTML =
    '<div class="detail">' +
    '<button class="back" type="button" data-view="directors">← Все режиссёры</button>' +
    '<header><p class="eyebrow">' + d.country + '</p><h2 class="dname">' + d.name + '</h2><p class="lead">' + d.sig + '</p>' + shareHtml() + '</header>' +
    '<article class="pick">' + poster({ t: s[0], y: s[1] }, 0) +
    '<div><p class="eyebrow">С чего начать</p><h2>' + s[0] + '</h2>' +
    '<p class="meta">' + s[1] + ' · ' + runtime(s[2]) + '</p><p class="why">' + d.why + '</p>' + actsHtml(s[0]) + '</div></article>' +
    '<div><div class="more-head"><h3>Все фильмы по годам</h3></div><div class="grid">' +
    d.films.map(function (f, i) {
      return '<div class="fc">' + poster({ t: f[0], y: f[1] }, i + 1) + nmLink(f[0]) +
        '<span class="sub">' + f[1] + ' · ' + runtime(f[2]) + '</span>' + miniHtml(f[0]) + '</div>';
    }).join("") + '</div></div></div>';
}

/* ---------- Подборки ---------- */
function allFilms() {
  var c = catalog();
  return Object.keys(c).map(function (k) { return c[k]; }).filter(function (f) { return f.w; });
}
function roll() {
  var pool = allFilms(), next;
  do { next = pool[Math.floor(Math.random() * pool.length)]; }
  while (state.rand && next.t === state.rand.t && pool.length > 1);
  state.rand = next;
}

function renderCollections() {
  var el = document.getElementById("colView");
  var c = state.col ? colById(state.col) : null;
  if (!c) {
    var r = state.rand;
    var box = r
      ? pickHtml(r, "Случайный выбор", '<button class="go" type="button" data-roll="1">Ещё раз</button>')
      : '<div class="roll"><div><h3>Не можете выбрать?</h3><p>Нажмите кнопку, и сайт сам выберет фильм из всех подборок.</p></div>' +
        '<button class="go" type="button" data-roll="1">Удиви меня</button></div>';
    el.innerHTML =
      '<header><h2 class="dname">Подборки</h2><p class="lead">Готовые списки на любой случай. Откройте подборку и выбирайте.</p></header>' + box +
      '<div class="dirs">' + COLLECTIONS.map(function (x) {
        return '<button class="dcard" type="button" data-col="' + x.id + '">' +
          '<span class="dtop"><i class="dot" style="--dot:' + x.hue + '"></i><b>' + x.name + '</b></span>' +
          '<span class="dsig">' + x.desc + '</span><span class="dgo">' + plural(x.films.length) + '</span></button>';
      }).join("") + '</div>';
    return;
  }
  el.innerHTML =
    '<div class="detail">' +
    '<button class="back" type="button" data-view="collections">← Все подборки</button>' +
    '<header><p class="eyebrow">' + plural(c.films.length) + '</p><h2 class="dname">' + c.name + '</h2><p class="lead">' + c.desc + '</p>' + shareHtml() + '</header>' +
    '<div class="grid wide">' + c.films.map(function (f, i) {
      return '<div class="fc">' + poster({ t: f[0], y: f[1] }, i) + nmLink(f[0]) +
        '<span class="sub">' + f[1] + ' · ' + runtime(f[2]) + '</span><span class="fw">' + f[3] + '</span>' + miniHtml(f[0]) + '</div>';
    }).join("") + '</div></div>';
}

/* ---------- Страница фильма ---------- */
function similarTo(t) {
  var cur = FILMS.filter(function (f) { return f.t === t; })[0];
  var c = catalog();
  if (!cur) {
    var d = DIRECTORS.filter(function (x) { return x.films.some(function (f) { return f[0] === t; }); })[0];
    return d ? d.films.filter(function (f) { return f[0] !== t; }).map(function (f) { return c[f[0]]; }) : [];
  }
  var cm = cur.m.split(" "), dn = DIRECTOR_OF[t];
  return FILMS.filter(function (f) { return f.t !== t; }).map(function (f) {
    var sc = 0, i;
    f.m.split(" ").forEach(function (m) { if (cm.indexOf(m) !== -1) sc += 2; });
    for (i = 0; i < f.c.length; i++) { if (cur.c.indexOf(f.c[i]) !== -1) { sc += 1; break; } }
    if (dn && DIRECTOR_OF[f.t] === dn) sc += 3;
    if (Math.abs(f.y - cur.y) <= 7) sc += 0.5;
    return { f: f, sc: sc };
  }).filter(function (x) { return x.sc >= 3; }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 6).map(function (x) { return c[x.f.t]; });
}

function renderFilm() {
  var el = document.getElementById("filmView");
  var t = state.film, c = catalog(), f = c[t];
  var moods = (f.m || "").split(" ").filter(Boolean).map(moodById).filter(Boolean);
  var inCols = COLLECTIONS.filter(function (x) { return x.films.some(function (y) { return y[0] === t; }); });
  var dn = dirNameOf(t);
  var dobj = DIRECTORS.filter(function (x) { return x.name === dn; })[0];
  var more = dobj ? dobj.films.filter(function (y) { return y[0] !== t; }) : [];
  var sim = similarTo(t);
  var tags = ["o", "p", "f", "k"].filter(function (k) { return (f.c || "").indexOf(k) !== -1; }).map(function (k) {
    return "<li>" + COMPANY_NAME[k] + "</li>";
  }).join("");

  el.innerHTML =
    '<div class="detail">' +
    '<button class="back" type="button" data-fback="1">← Назад</button>' +
    '<article class="pick">' + poster(f, 0) +
    '<div><p class="eyebrow">Фильм</p><h2>' + f.t + '</h2>' +
    '<p class="meta">' + f.y + ' · ' + runtime(f.d) + (f.g ? ' · ' + f.g : '') + '</p>' + dirLine(t) +
    (f.w ? '<p class="why">' + f.w + '</p>' : '') +
    '<p class="meta" id="tmdbOv" hidden></p>' +
    (tags ? '<p class="group-label">С кем смотреть</p><ul class="tags">' + tags + '</ul>' : '') +
    (moods.length ? '<p class="group-label">Настроение</p><div class="chips mchips">' + moods.map(function (m) {
      return '<button class="chip" type="button" data-gomood="' + m.id + '">' + m.name + '</button>';
    }).join("") + '</div>' : '') +
    actsHtml(t, true) + shareHtml() +
    (inList("seen", t) ? '<p class="group-label">Ваша оценка</p>' + starsHtml(t) : '') +
    '</div></article>' +
    '<section><div class="more-head"><h3>Где смотреть</h3></div>' +
    '<div class="slot" id="slotWhere">Загружаем данные…</div></section>' +
    '<section><div class="more-head"><h3>Трейлер</h3></div>' +
    '<div class="slot video" id="slotTrailer">Загружаем данные…</div></section>' +
    (inCols.length ? '<section><div class="more-head"><h3>Входит в подборки</h3></div><div class="chips">' + inCols.map(function (x) {
      return '<button class="chip" type="button" data-col="' + x.id + '">' + x.name + '</button>';
    }).join("") + '</div></section>' : '') +
    (more.length ? '<section><div class="more-head"><h3>Ещё от ' + dn + '</h3></div><div class="grid wide">' + more.map(function (y, i) {
      return '<div class="fc">' + poster({ t: y[0], y: y[1] }, i + 1) + nmLink(y[0]) + '<span class="sub">' + y[1] + ' · ' + runtime(y[2]) + '</span></div>';
    }).join("") + '</div></section>' : '') +
    (sim.length ? '<section><div class="more-head"><h3>Похожие фильмы</h3></div><div class="grid wide">' + sim.map(function (y, i) {
      return '<div class="fc">' + poster(y, i + 1) + nmLink(y.t) + '<span class="sub">' + y.y + ' · ' + runtime(y.d) + '</span></div>';
    }).join("") + '</div></section>' : '') +
    '</div>';
  loadDetails(t);
}

/* ---------- Данные TMDB (через серверную часть /api) ---------- */
var tmdbCache = {};
var queue = [], running = 0;
function apiGet(url) {
  return fetch(url).then(function (r) {
    if (!r.ok) throw new Error("api " + r.status);
    return r.json();
  });
}
function findFilm(t, y) {
  var k = t + "|" + y;
  if (!tmdbCache[k]) {
    tmdbCache[k] = apiGet("/api/search?title=" + encodeURIComponent(t) + "&year=" + y).catch(function () { return { none: true }; });
  }
  return tmdbCache[k];
}
function pump() {
  while (running < 4 && queue.length) {
    var job = queue.shift();
    running++;
    job().then(function () { running--; pump(); }, function () { running--; pump(); });
  }
}
function setPoster(el, info) {
  if (!info || !info.poster || el.querySelector(".pimg")) return;
  var img = document.createElement("img");
  img.className = "pimg";
  img.alt = "";
  img.loading = "lazy";
  img.onload = function () { el.classList.add("has-img"); };
  img.src = "https://image.tmdb.org/t/p/w342" + info.poster;
  el.appendChild(img);
}
var posterObs = null;
function hydrate() {
  if (String(location.protocol).indexOf("http") !== 0) return;
  var list = document.querySelectorAll(".poster[data-pt]:not([data-h])");
  Array.prototype.forEach.call(list, function (el) {
    el.setAttribute("data-h", "1");
    var load = function () {
      queue.push(function () {
        return findFilm(el.getAttribute("data-pt"), el.getAttribute("data-py")).then(function (info) { setPoster(el, info); });
      });
      pump();
    };
    if (window.IntersectionObserver) {
      if (!posterObs) {
        posterObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) { posterObs.unobserve(en.target); en.target.__load(); }
          });
        }, { rootMargin: "200px" });
      }
      el.__load = load;
      posterObs.observe(el);
    } else {
      load();
    }
  });
}
function providersHtml(d) {
  var rows = [["flatrate", "По подписке"], ["free", "Бесплатно"], ["rent", "Аренда"], ["buy", "Покупка"]].map(function (g) {
    var arr = (d.providers && d.providers[g[0]]) || [];
    return arr.length ? '<p class="meta"><b>' + g[1] + ':</b> ' + arr.map(esc).join(", ") + '</p>' : "";
  }).join("");
  if (!rows) return "Для вашего региона нет данных о том, где смотреть этот фильм.";
  return rows + '<p class="meta">Данные о доступности предоставлены JustWatch через TMDB.' +
    (d.link ? ' <a href="' + esc(d.link) + '" target="_blank" rel="noopener">Подробнее</a>' : '') + '</p>';
}
function loadDetails(t) {
  var f = catalog()[t];
  if (String(location.protocol).indexOf("http") !== 0) return;
  findFilm(t, f.y).then(function (info) {
    if (state.film !== t) return;
    if (!info || !info.id) throw new Error("none");
    return apiGet("/api/movie?id=" + info.id).then(function (d) {
      if (state.film !== t) return;
      var ov = document.getElementById("tmdbOv");
      if (ov && d.overview && !f.w) { ov.textContent = d.overview; ov.hidden = false; }
      var w = document.getElementById("slotWhere");
      if (w) w.innerHTML = providersHtml(d);
      var v = document.getElementById("slotTrailer");
      if (v) {
        if (d.trailer) {
          v.innerHTML = '<button class="go" type="button" data-trailer="' + esc(d.trailer) + '">Смотреть трейлер</button>';
        } else {
          v.textContent = "Трейлер не найден.";
        }
      }
    });
  }).catch(function () {
    var w = document.getElementById("slotWhere"), v = document.getElementById("slotTrailer");
    if (w) w.textContent = "Данные о доступности пока недоступны.";
    if (v) v.textContent = "Трейлер пока недоступен.";
  });
}

/* ---------- Мой список: страница ---------- */
function renderMy() {
  var el = document.getElementById("myView");
  var cat = catalog();
  var note = store.mode === "account"
    ? "Список хранится в вашем профиле Claude и доступен только вам."
    : "Список хранится в этом браузере. Позже подключим вход в аккаунт, чтобы он был доступен с любого устройства.";

  function cards(titles, kind) {
    return titles.map(function (t, i) {
      var f = cat[t];
      if (!f) return "";
      var e = esc(t);
      var first = kind === "want"
        ? '<button class="act mini" type="button" data-myact="seen" data-t="' + e + '">Просмотрено</button>'
        : '<button class="act mini" type="button" data-myact="want" data-t="' + e + '">В «Хочу»</button>';
      return '<div class="fc">' + poster(f, i) + nmLink(t) +
        '<span class="sub">' + f.y + ' · ' + runtime(f.d) + '</span>' +
        (kind === "seen" ? starsHtml(t) +
          '<textarea class="note" data-note="' + e + '" rows="2" maxlength="280" placeholder="Пара слов о фильме">' + esc(me.note[t] || "") + '</textarea>' : '') +
        '<div class="acts tight">' + first + '<button class="act mini" type="button" data-myact="del" data-t="' + e + '">Убрать</button></div></div>';
    }).join("");
  }
  function section(title, titles, kind, emptyText) {
    return '<section><div class="more-head"><h3>' + title + '</h3><span>' + plural(titles.length) + '</span></div>' +
      (titles.length ? '<div class="grid wide">' + cards(titles, kind) + '</div>' : '<div class="empty">' + emptyText + '</div>') + '</section>';
  }
  var mins = 0, sum = 0, cnt = 0;
  me.seen.forEach(function (t) {
    if (cat[t]) mins += cat[t].d;
    if (me.rate[t]) { sum += me.rate[t]; cnt += 1; }
  });
  var stats = me.seen.length
    ? '<p class="stats">Просмотрено: ' + plural(me.seen.length) + ', вместе это ' + runtime(mins) + ' кино.' +
      (cnt ? ' Средняя оценка: ' + (Math.round(sum / cnt * 10) / 10).toString().replace(".", ",") + ' из 5.' : '') + '</p>'
    : '';

  el.innerHTML =
    '<header><p class="eyebrow">Профиль</p><h2 class="dname" id="mytitle">Мой список</h2><p class="lead">' + note + '</p></header>' +
    '<div class="namebox"><label class="group-label" for="myname">Как вас зовут</label>' +
    '<input id="myname" class="field" type="text" maxlength="40" placeholder="Например, Иван" autocomplete="off"></div>' +
    stats +
    section("Хочу посмотреть", me.want, "want", "Пока пусто. Нажмите «Хочу посмотреть» у любого фильма, и он появится здесь.") +
    section("Просмотрено", me.seen, "seen", "Здесь будут фильмы, которые вы отметите как просмотренные. Их можно оценить и оставить заметку.");

  var input = document.getElementById("myname");
  var title = document.getElementById("mytitle");
  input.value = me.name;
  if (me.name) title.textContent = "Список: " + me.name;
  input.addEventListener("input", function () {
    me.name = input.value;
    title.textContent = me.name ? "Список: " + me.name : "Мой список";
    clearTimeout(nameTimer);
    nameTimer = setTimeout(persist, 600);
  });
}

/* ---------- Переходы между разделами ---------- */
function route(scroll) {
  var h = (location.hash || "").replace("#", "");
  var prev = state.last;
  var view = "mood";
  state.dir = null;
  state.col = null;
  state.film = null;
  if (h === "directors") view = "dir";
  else if (h.indexOf("director-") === 0 && dirById(h.slice(9))) { view = "dir"; state.dir = h.slice(9); }
  else if (h === "collections") view = "col";
  else if (h.indexOf("collection-") === 0 && colById(h.slice(11))) { view = "col"; state.col = h.slice(11); }
  else if (h === "mylist") view = "me";
  else if (h === "quiz") view = "quiz";
  else if (h.indexOf("film-") === 0 && titleOf(h.slice(5))) { view = "film"; state.film = titleOf(h.slice(5)); }
  if (view === "film" && prev.indexOf("film-") !== 0) state.from = prev;
  state.last = h;
  state.view = view;

  [["mood", "moodView"], ["dir", "dirView"], ["col", "colView"], ["me", "myView"], ["film", "filmView"], ["quiz", "quizView"]].forEach(function (v) {
    document.getElementById(v[1]).hidden = view !== v[0];
  });
  var key = view === "mood" ? "mood" : view === "dir" ? "directors" : view === "col" ? "collections" : view === "me" ? "mylist" : "";
  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (b) {
    b.setAttribute("aria-pressed", String(b.dataset.view === key));
  });

  if (view === "mood") {
    setHue(moodById(state.mood).hue);
  } else if (view === "dir") {
    setHue(state.dir ? dirById(state.dir).hue : 60);
    renderDirectors();
  } else if (view === "col") {
    setHue(state.col ? colById(state.col).hue : 60);
    renderCollections();
  } else if (view === "me") {
    setHue(60);
    renderMy();
  } else if (view === "film") {
    var fm = (catalog()[state.film].m || "").split(" ")[0];
    setHue(fm && moodById(fm) ? moodById(fm).hue : 60);
    renderFilm();
  } else {
    setHue(state.quiz.mood ? moodById(state.quiz.mood).hue : 60);
    renderQuiz();
  }
  if (scroll) document.getElementById("tabs").scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("click", function (e) {
  var t = e.target.closest ? e.target.closest("button") : null;
  if (!e.target.closest || !e.target.closest(".search")) hideSearch();
  if (!t) return;
  var d = t.dataset;
  if (t.closest(".search")) { hideSearch(); document.getElementById("q").value = ""; }

  if (d.trailer) {
    var slot = document.getElementById("slotTrailer");
    if (slot && /^[A-Za-z0-9_-]{6,20}$/.test(d.trailer)) {
      slot.innerHTML = '<iframe class="yt" src="https://www.youtube-nocookie.com/embed/' + d.trailer + '?autoplay=1" title="Трейлер" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>';
    }
    return;
  }
  if (d.film) { location.hash = "film-" + d.film; return; }
  if (d.mood) { setMood(d.mood); return; }
  if (d.company) { state.company = d.company; state.idx = 0; renderControls(); renderResult(); return; }
  if (d.time) { state.time = d.time; state.idx = 0; renderControls(); renderResult(); return; }
  if (t.id === "reroll") { state.idx += 1; renderResult(); return; }
  if (d.idx !== undefined) {
    state.idx = parseInt(d.idx, 10);
    renderResult();
    document.getElementById("pick").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (d.view) {
    if (d.view === "quiz") state.quiz = { step: 0, mood: null, company: null, time: null, idx: 0 };
    location.hash = d.view;
    if (location.hash.slice(1) === d.view) route(true);
    return;
  }
  if (d.dir) { location.hash = "director-" + d.dir; return; }
  if (d.col) { location.hash = "collection-" + d.col; return; }
  if (d.roll) { roll(); renderCollections(); return; }
  if (d.want !== undefined) { toggleWant(d.want); return; }
  if (d.seen !== undefined) { toggleSeen(d.seen); return; }
  if (d.mini !== undefined) { toggleMini(d.mini); return; }
  if (d.myact) { myAction(d.myact, d.t); return; }
  if (d.rate !== undefined) { setRate(d.t, parseInt(d.rate, 10)); return; }
  if (d.share !== undefined) { doShare(t); return; }
  if (d.fback !== undefined) { location.hash = state.from || "mood"; return; }
  if (d.gomood) { state.company = "any"; state.time = "any"; setMood(d.gomood); location.hash = "mood"; return; }
  if (d.qk) { quizAnswer(d.qk, d.qv); return; }
  if (d.qback !== undefined) {
    state.quiz.step = Math.max(0, state.quiz.step - 1);
    renderQuiz();
    return;
  }
  if (d.qnext !== undefined) { state.quiz.idx += 1; renderQuiz(); return; }
  if (d.qreset !== undefined) { state.quiz = { step: 0, mood: null, company: null, time: null, idx: 0 }; setHue(60); renderQuiz(); return; }
  if (d.qapply !== undefined) {
    var q = state.quiz;
    state.mood = q.mood; state.company = q.company; state.time = q.time; state.idx = 0;
    if (!list().length) { state.company = "any"; state.time = "any"; }
    renderControls(); renderResult();
    location.hash = "mood";
  }
});

document.addEventListener("input", function (e) {
  var el = e.target;
  if (el.id === "q") { runSearch(); return; }
  if (el.dataset && el.dataset.note !== undefined) {
    var v = el.value.slice(0, 280);
    if (v) me.note[el.dataset.note] = v; else delete me.note[el.dataset.note];
    clearTimeout(noteTimer);
    noteTimer = setTimeout(persist, 600);
  }
});
document.addEventListener("keydown", function (e) {
  if (e.target.id !== "q") return;
  if (e.key === "Escape") { hideSearch(); return; }
  if (e.key === "Enter") {
    var first = document.querySelector("#sres button");
    if (first) first.click();
  }
});
window.addEventListener("hashchange", function () { route(true); });

if (window.MutationObserver && document.body) {
  var hydTimer = null;
  new MutationObserver(function () {
    clearTimeout(hydTimer);
    hydTimer = setTimeout(hydrate, 80);
  }).observe(document.body, { childList: true, subtree: true });
}
loadLocal();
renderControls();
renderResult();
route(false);
initAccount();
hydrate();
