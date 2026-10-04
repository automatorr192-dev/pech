const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const PLACES = JSON.parse($('#placesData').textContent);

const nav = $('#nav'), burger = $('#burger'), menu = $('#mnav');
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', open);
  menu.classList.toggle('open', open);
  nav.classList.add('solid');
});
menu.addEventListener('click', e => { if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); } });
const sentinel = document.createElement('div');
sentinel.style.cssText = 'position:absolute;top:0;height:60px;width:1px;pointer-events:none';
document.body.prepend(sentinel);
new IntersectionObserver(([e]) => nav.classList.toggle('solid', !e.isIntersecting)).observe(sentinel);

const man = $('#manifest');
man.innerHTML = man.textContent.trim().split(/[ \t\n\r]+/).map(w => `<span class="w">${w}</span>`).join(' ');

function splitLines(el) {
  const text = el.textContent.trim(), words = text.split(/[ \t\n\r]+/);
  el.innerHTML = words.map(w => `<span class="sw">${w}</span>`).join(' ');
  const lines = [];
  let top = null;
  el.querySelectorAll('.sw').forEach(s => {
    if (s.offsetTop !== top) { lines.push([]); top = s.offsetTop; }
    lines[lines.length - 1].push(s.textContent);
  });
  el.setAttribute('aria-label', text);
  el.innerHTML = lines.map((l, i) => `<span class="ln" aria-hidden="true"><span style="transition-delay:${i * 80}ms">${l.join(' ')}</span></span>`).join('');
}
document.documentElement.classList.add('ready');
Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 500))]).then(() => {
  if (!reduce) $$('[data-split]').forEach(splitLines);
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, sibs = [...el.parentElement.children].filter(c => c.classList.contains('rv'));
    el.style.transitionDelay = ((+el.dataset.delay || 0) * 60 + Math.max(0, sibs.indexOf(el)) * 60) + 'ms';
    el.classList.add('is-in');
    io.unobserve(el);
  }), { threshold: .08, rootMargin: '0px 0px 4% 0px' });
  $$('[data-split],.rv').forEach(el => io.observe(el));
});

/* embers */
const ec = $('#embers');
if (!reduce && ec.getContext) {
  const g = ec.getContext('2d');
  let W = 0, H = 0, raf = 0, last = 0, on = true, t = 0;
  const mouse = { x: -1e4, y: -1e4 };
  const spr = document.createElement('canvas');
  spr.width = spr.height = 64;
  const sg = spr.getContext('2d'), rg = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,240,200,1)'); rg.addColorStop(.18, 'rgba(255,170,80,.9)'); rg.addColorStop(.45, 'rgba(242,85,44,.35)'); rg.addColorStop(1, 'rgba(242,85,44,0)');
  sg.fillStyle = rg; sg.fillRect(0, 0, 64, 64);
  const parts = [];
  const spawn = (p, init) => Object.assign(p, {
    x: W * (.18 + Math.random() * .7), y: init ? H * (.15 + Math.random() * .85) : H * (.55 + Math.random() * .5),
    vx: (Math.random() - .5) * 14, vy: -(22 + Math.random() * 58), life: init ? Math.random() * 4 : 0, max: 2.8 + Math.random() * 4,
    r: .7 + Math.random() * 1.7, ph: Math.random() * 6.28,
  });
  function size() {
    const r = ec.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; ec.width = W * d; ec.height = H * d; g.setTransform(d, 0, 0, d, 0, 0);
    const n = W < 700 ? 34 : 72;
    while (parts.length < n) parts.push(spawn({}, true));
    parts.length = n;
  }
  function frame(now) {
    raf = 0;
    const dt = Math.min(.05, (now - (last || now)) / 1000);
    last = now; t += dt;
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      p.life += dt;
      p.vx += Math.sin(t * 1.4 + p.ph) * 10 * dt;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 22000) { const k = (1 - d2 / 22000) * 260 * dt; const d = Math.sqrt(d2) || 1; p.vx += dx / d * k; p.vy += dy / d * k; }
      p.vx *= 1 - .6 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life > p.max || p.y < -20) spawn(p, false);
      const a = Math.sin(Math.PI * Math.min(1, p.life / p.max)) * (.65 + .35 * Math.sin(t * 9 + p.ph * 3));
      const s = p.r * 7;
      g.globalAlpha = Math.max(0, a);
      g.drawImage(spr, p.x - s / 2, p.y - s / 2, s, s);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    if (on && !document.hidden) raf = requestAnimationFrame(frame); else last = 0;
  }
  const kick = () => { if (!raf && on) raf = requestAnimationFrame(frame); };
  size();
  new ResizeObserver(size).observe(ec);
  new IntersectionObserver(([e]) => { on = e.isIntersecting; kick(); }).observe(ec);
  document.addEventListener('visibilitychange', kick);
  const hero = $('.hero');
  hero.addEventListener('pointermove', e => { const r = ec.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
  kick();
}

/* menu peek */
const peek = $('#peek'), list = $('#menuList');
if (matchMedia('(hover: hover) and (min-width: 900px)').matches) {
  const imgs = new Map();
  let tx = 0, ty = 0, px = 0, py = 0, vx = 0, raf = 0, inside = false;
  const tick = () => {
    raf = 0;
    const nx = px + (tx - px) * (reduce ? 1 : .16), ny = py + (ty - py) * (reduce ? 1 : .16);
    vx = nx - px; px = nx; py = ny;
    const rot = Math.max(-8, Math.min(8, vx * .35));
    peek.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${rot.toFixed(2)}deg) scale(${inside ? 1 : .85})`;
    if (inside || Math.abs(tx - px) > .5) raf = requestAnimationFrame(tick);
  };
  list.addEventListener('pointermove', e => {
    tx = e.clientX + 150; ty = e.clientY;
    if (!inside) { inside = true; px = tx; py = ty; peek.classList.add('on'); }
    if (!raf) raf = requestAnimationFrame(tick);
  });
  list.addEventListener('pointerleave', () => { inside = false; peek.classList.remove('on'); });
  $$('.dish').forEach(d => d.addEventListener('pointerenter', () => {
    const src = d.dataset.img;
    if (!imgs.has(src)) {
      const im = new Image();
      im.src = src; im.alt = ''; im.decoding = 'async';
      peek.appendChild(im);
      imgs.set(src, im);
    }
    imgs.forEach((im, k) => im.classList.toggle('on', k === src));
  }));
}

/* places, Moscow time */
const DAY = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const msk = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
const hm = h => `${String(Math.floor(h % 24)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
const sched = (p, day) => (day === 5 || day === 6 ? p.we : p.wk);
function status(p) {
  const n = msk(), d = n.getDay(), h = n.getHours() + n.getMinutes() / 60;
  const [o, c] = sched(p, d), [, pc] = sched(p, (d + 6) % 7);
  if (pc > 24 && h < pc - 24) return { open: true, text: `Открыто до ${hm(pc)}` };
  if (h >= o && h < c) return { open: true, text: `Открыто до ${hm(c)}` };
  if (h < o) return { open: false, text: `Откроется в ${hm(o)}` };
  return { open: false, text: `Откроется завтра в ${hm(sched(p, (d + 1) % 7)[0])}` };
}
const pinsBox = $('#pins'), plist = $('#placeList');
PLACES.forEach((p, i) => {
  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'pin';
  pin.dataset.i = i;
  pin.style.left = p.x + '%';
  pin.style.top = p.y + '%';
  pin.setAttribute('aria-label', `Печь, ${p.name}, м. ${p.metro}`);
  pin.innerHTML = '<i aria-hidden="true"></i>';
  pinsBox.appendChild(pin);
  const el = document.createElement('article');
  el.className = 'place';
  el.setAttribute('role', 'listitem');
  el.dataset.i = i;
  el.innerHTML = `<h3>${p.name}</h3><span class="st"></span><span class="metro">м. ${p.metro}</span><button type="button" class="book">Забронировать здесь</button><div class="row"><span>${p.street}</span><span class="num">пн-чт, вс ${hm(p.wk[0])}-${hm(p.wk[1])}</span><span class="num">пт-сб ${hm(p.we[0])}-${hm(p.we[1])}</span></div>`;
  plist.appendChild(el);
});
function paintStatus() {
  $$('.place').forEach(el => {
    const s = status(PLACES[+el.dataset.i]), st = el.querySelector('.st');
    st.textContent = s.text;
    st.classList.toggle('closed', !s.open);
  });
}
paintStatus();
setInterval(paintStatus, 60000);
let activePlace = -1;
function activate(i) {
  if (i === activePlace) return;
  activePlace = i;
  const p = PLACES[i];
  $$('.pin').forEach(g => g.classList.toggle('on', +g.dataset.i === i));
  $$('.place').forEach(el => el.classList.toggle('on', +el.dataset.i === i));
  $('#mapImg').src = `assets/img/${p.img}.webp`;
  $('#mapImg').alt = `Зал ресторана «Печь» ${p.name}`;
  $('#mapName').textContent = p.name;
  $('#mapMeta').textContent = `м. ${p.metro}, ${status(p).text.toLowerCase()}`;
  $('#mapRoute').href = 'https://yandex.ru/maps/?text=' + encodeURIComponent(`Москва, ${p.street}, метро ${p.metro}`);
}
activate(0);
$$('.place').forEach(el => {
  el.addEventListener('pointerenter', () => activate(+el.dataset.i));
  el.addEventListener('click', e => { activate(+el.dataset.i); if (e.target.closest('.book')) bookAt(+el.dataset.i); });
});
$$('.pin').forEach(g => {
  g.addEventListener('click', () => {
    activate(+g.dataset.i);
    if (matchMedia('(min-width: 900px)').matches) $(`.place[data-i="${g.dataset.i}"]`).scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  });
  g.addEventListener('pointerenter', () => activate(+g.dataset.i));
});

/* booking */
const fPlace = $('#fPlace'), daysEl = $('#days'), timesEl = $('#times');
fPlace.innerHTML = PLACES.map((p, i) => `<option value="${i}">${p.name}, м. ${p.metro}</option>`).join('');
let day = 0, time = null, guests = 2;
function dateFor(k) { const d = msk(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + k); return d; }
function renderDays() {
  daysEl.innerHTML = Array.from({ length: 7 }, (_, k) => {
    const d = dateFor(k), top = k === 0 ? 'Сегодня' : k === 1 ? 'Завтра' : DAY[d.getDay()];
    return `<button type="button" class="chip day" data-k="${k}" aria-pressed="${k === day}">${top}<small>${d.getDate()} ${MON[d.getMonth()]}</small></button>`;
  }).join('');
}
function renderTimes() {
  const p = PLACES[+fPlace.value], d = dateFor(day), [o, c] = sched(p, d.getDay());
  const n = msk(), nowH = day === 0 ? n.getHours() + n.getMinutes() / 60 + .5 : -1;
  const slots = [];
  for (let h = o; h <= Math.min(c, 24) - 1.5; h += .5) slots.push(h);
  if (time !== null && !slots.includes(time)) time = null;
  timesEl.innerHTML = slots.map(h => `<button type="button" class="chip" data-h="${h}" aria-pressed="${h === time}" ${h < nowH ? 'disabled' : ''}>${hm(h)}</button>`).join('') || '<span style="color:var(--mut)">На сегодня свободных слотов нет, выберите другой день</span>';
}
renderDays(); renderTimes();
daysEl.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; day = +b.dataset.k; renderDays(); renderTimes(); });
timesEl.addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b || b.disabled) return;
  time = +b.dataset.h;
  $$('#times .chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  $('#timeMsg').textContent = '';
});
fPlace.addEventListener('change', () => { renderTimes(); activate(+fPlace.value); });
const out = $('#guests'), gMinus = $('#gMinus'), gPlus = $('#gPlus');
function setGuests(n) {
  guests = Math.max(1, Math.min(60, n));
  out.textContent = guests;
  gMinus.disabled = guests <= 1;
  gPlus.disabled = guests >= 60;
  $('#gNote').hidden = guests <= 12;
}
gMinus.addEventListener('click', () => setGuests(guests - 1));
gPlus.addEventListener('click', () => setGuests(guests + 1));
setGuests(2);
function bookAt(i) {
  fPlace.value = i; renderTimes();
  $('#bron').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}
$('#banqBtn').addEventListener('click', () => setGuests(20));

const phone = $('#fPhone');
phone.addEventListener('input', () => {
  let d = phone.value.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (d && !d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  phone.value = d ? '+7' + (p[0] ? ' ' + p[0] : '') + (p[1] ? ' ' + p[1] : '') + (p[2] ? '-' + p[2] : '') + (p[3] ? '-' + p[3] : '') : '';
});
function check(id, ok, text) {
  const input = $('#' + id), box = input.closest('.f');
  if (box) box.classList.toggle('err', !ok);
  input.setAttribute('aria-invalid', String(!ok));
  input.setAttribute('aria-describedby', id + 'Msg');
  $('#' + id + 'Msg').textContent = ok ? '' : text;
  return ok;
}
$('#bronForm').addEventListener('submit', e => {
  e.preventDefault();
  const okTime = time !== null || guests > 12;
  $('#timeMsg').textContent = okTime ? '' : 'Выберите время';
  const okName = check('fName', $('#fName').value.trim().length > 1, 'Как к вам обращаться?');
  const okPhone = check('fPhone', phone.value.replace(/\D/g, '').length === 11, 'Нужен номер из 11 цифр');
  const okConsent = check('fConsent', $('#fConsent').checked, 'Без согласия мы не сможем подтвердить бронь');
  if (!(okTime && okName && okPhone && okConsent)) {
    const first = !okTime ? $('#times .chip:not(:disabled)') : $('[aria-invalid="true"]');
    if (first) first.focus();
    return;
  }
  const p = PLACES[+fPlace.value], d = dateFor(day);
  const rows = [['Ресторан', `${p.name}, м. ${p.metro}`], ['Дата', `${d.getDate()} ${MON[d.getMonth()]}, ${DAY[d.getDay()]}`], ['Время', time !== null ? hm(time) : 'обсудим по телефону'], ['Гостей', guests], ['Имя', $('#fName').value.trim()]];
  $('#okList').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  $('#bronForm').classList.add('sent');
  $('#formOk').focus();
});
