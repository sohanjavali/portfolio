// Everything in this file is decoration. All the content is already in the
// HTML, so the page reads the same with JavaScript turned off.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------
   1. Background: "agents" moving across a faint grid in parallel.
      Each agent walks node to node, sometimes turns, leaves a fading
      trail, and now and then finishes a task (a ripple and a label).
      field() builds one of these on a canvas. It runs twice:
        - the hero, at full strength, where you can click to spawn agents
        - a fixed layer behind the rest of the page, heavily muted: a barely
          visible grid, a few slow dim lines, no labels or glow
   ------------------------------------------------------------------ */
// Every agent belongs to one project: it moves in that project's color (the
// same hue as its row below) and only finishes that project's tasks.
const PROJECTS = {
  lareg:   ['parse docket', 'fetch filings', 'ocr scan', 'extract fields', 'cite source', 'check owner', 'retrain bert'],
  brain:   ['capture note', 'route inbox', 'lint note', 'commit', 'push backup', 'weekly audit'],
  autopod: ['research topic', 'write script', 'voice line', 'stitch mp3', 'save episode'],
  parking: ['sample weekday', 'order frame', 'read lot', 'validate schema', 'pivot matrix'],
  kit:     ['find leads', 'score lead', 'draft email', 'approve draft', 'send batch', 'triage reply'],
};
const KEYS = Object.keys(PROJECTS);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const GAP = 32;                         // px between grid lines
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function field(canvas, { strength = 1, gridAlpha = 0.14, labels = true, perPx = 100, speed = 1, spread = 0.8 } = {}) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, cols = 0, rows = 0, grid = null, colors = {};
  let agents = [], ripples = [], last = 0, running = false, active = true;
  const readColors = () => {
    colors = { line: css('--dim') };
    for (const k of KEYS) colors[k] = css('--c-' + k);
  };

  // Draw the static grid once onto an offscreen canvas, then copy it each frame (much cheaper).
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / GAP); rows = Math.ceil(h / GAP);
    grid = document.createElement('canvas');
    grid.width = w * dpr; grid.height = h * dpr;
    const d = grid.getContext('2d');
    d.setTransform(dpr, 0, 0, dpr, 0, 0);
    d.strokeStyle = colors.line; d.globalAlpha = gridAlpha; d.lineWidth = 1;   // very faint gray grid
    d.beginPath();
    for (let x = 0; x <= cols; x++) { d.moveTo(x * GAP + 0.5, 0); d.lineTo(x * GAP + 0.5, h); }
    for (let y = 0; y <= rows; y++) { d.moveTo(0, y * GAP + 0.5); d.lineTo(w, y * GAP + 0.5); }
    d.stroke();
    const target = Math.max(4, Math.min(16, Math.round(w / perPx)));
    while (agents.length < target) agents.push(spawn());
    agents.length = Math.min(agents.length, target + 8);
  }

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function spawn(x, y) {
    const [dx, dy] = DIRS[Math.floor(Math.random() * 4)];
    return {
      x: x ?? Math.floor(cols * (1 - spread + Math.random() * spread)),   // hero: mostly right of center, away from the text
      y: y ?? Math.floor(Math.random() * rows),
      dx, dy, t: 0,
      p: pick(KEYS),                                                     // which project this agent works for
      speed: (2.2 + Math.random() * 2.2) * speed,                        // grid steps per second
      trail: [],
    };
  }

  function step(a) {
    a.trail.push([a.x, a.y]);
    if (a.trail.length > 18) a.trail.shift();
    a.x += a.dx; a.y += a.dy;
    if (Math.random() < 0.12) {                                  // turn left or right, never reverse
      [a.dx, a.dy] = Math.random() < 0.5 ? [a.dy, -a.dx] : [-a.dy, a.dx];
    }
    if (labels && Math.random() < 0.05) {                        // "finished a task"
      ripples.push({ x: a.x, y: a.y, age: 0, p: a.p, label: pick(PROJECTS[a.p]) });
    }
    if (a.x < -1 || a.y < -1 || a.x > cols + 1 || a.y > rows + 1) Object.assign(a, spawn(), { trail: [] });   // respawns with a new project too
  }

  function update(dt) {
    for (const a of agents) {
      a.t += a.speed * dt;
      while (a.t >= 1) { a.t -= 1; step(a); }
    }
    for (const r of ripples) r.age += dt;
    ripples = ripples.filter((r) => r.age < 1.6);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.drawImage(grid, 0, 0, w, h);
    ctx.lineCap = 'round';

    for (const a of agents) {
      const hx = (a.x + a.dx * a.t) * GAP, hy = (a.y + a.dy * a.t) * GAP;
      const pts = [...a.trail.map(([x, y]) => [x * GAP, y * GAP]), [a.x * GAP, a.y * GAP], [hx, hy]];
      const c = colors[a.p];
      ctx.strokeStyle = c; ctx.lineWidth = 1.5;
      for (let i = 1; i < pts.length; i++) {                     // older segments fade out
        ctx.globalAlpha = (i / pts.length) * 0.6 * strength;
        ctx.beginPath(); ctx.moveTo(...pts[i - 1]); ctx.lineTo(...pts[i]); ctx.stroke();
      }
      if (labels) {                                              // soft glow (hero only), then the head
        ctx.globalAlpha = 0.18 * strength; ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = c;
      ctx.globalAlpha = strength;
      ctx.fillRect(hx - 2.5, hy - 2.5, 5, 5);
    }

    ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
    for (const r of ripples) {
      const k = r.age / 1.6, x = r.x * GAP, y = r.y * GAP;
      ctx.globalAlpha = (1 - k) * 0.8 * strength; ctx.strokeStyle = colors[r.p]; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, 4 + k * 26, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = colors[r.p];
      ctx.fillText(r.label, x + 10, y - 10 - k * 8);
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    update(dt); draw();
    requestAnimationFrame(frame);
  }
  function start() { if (running || reduceMotion || !active || document.hidden) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }

  readColors(); resize();
  if (reduceMotion) { for (let i = 0; i < 150; i++) update(1 / 30); draw(); }   // one still frame
  else start();

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  new ResizeObserver(() => { resize(); if (!running) draw(); }).observe(canvas);
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { readColors(); resize(); draw(); });

  return {
    // Pause when not on screen (saves battery); the caller decides when that is.
    setActive(on) { active = on; on ? start() : stop(); },
    // Drop in a new agent at the nearest grid point.
    spawnAt(px, py) {
      const x = Math.round(px / GAP), y = Math.round(py / GAP);
      const a = spawn(x, y);
      agents.push(a);
      if (agents.length > 24) agents.shift();
      ripples.push({ x, y, age: 0, p: a.p, label: 'spawned' });
      if (!running) draw();
    },
  };
}

// Hero: full strength, click to spawn, paused when scrolled out of view.
const heroCanvas = document.querySelector('.grid');
if (heroCanvas) {
  const hero = field(heroCanvas);
  new IntersectionObserver(([e]) => hero.setActive(e.isIntersecting)).observe(heroCanvas);
  heroCanvas.addEventListener('pointerdown', (e) => {
    const r = heroCanvas.getBoundingClientRect();
    hero.spawnAt(e.clientX - r.left, e.clientY - r.top);
  });
}

// Rest of the page: a fixed, muted layer that fades in as the hero scrolls away.
const pageCanvas = document.querySelector('.field');
if (pageCanvas) {
  const bg = field(pageCanvas, { strength: 0.14, gridAlpha: 0.05, labels: false, perPx: 260, speed: 0.5, spread: 1 });
  const heroEl = document.querySelector('.hero');
  const fade = () => {
    const hh = heroEl ? heroEl.offsetHeight : innerHeight;
    const o = Math.min(1, Math.max(0, (scrollY - hh * 0.5) / (hh * 0.5)));   // 0 over the hero, 1 once past it
    pageCanvas.style.opacity = o;
    bg.setActive(o > 0);
  };
  addEventListener('scroll', fade, { passive: true });
  addEventListener('resize', fade);
  fade();
}

/* ------------------------------------------------------------------
   Email buttons: copy the address and show a toast with a Gmail link.
   (A bare mailto: link does nothing if no mail app is set up, which is
   why the old button seemed broken. Without JS it still falls back to mailto.)
   ------------------------------------------------------------------ */
const EMAIL = 'sohanjavali@gmail.com';
const GMAIL = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + EMAIL;
let toastTimer;
function toast(html) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.innerHTML = html;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 5000);
}
document.querySelectorAll('[data-email]').forEach((a) => a.addEventListener('click', async (e) => {
  e.preventDefault();
  try {
    await navigator.clipboard.writeText(EMAIL);
    toast(`Copied ${EMAIL} <a href="${GMAIL}" target="_blank" rel="noopener">Open Gmail ↗</a>`);
  } catch {
    window.location.href = 'mailto:' + EMAIL;   // clipboard blocked: fall back to the mail app
  }
}));

/* ------------------------------------------------------------------
   2. Section labels "decode" from random characters when they scroll in.
   ------------------------------------------------------------------ */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function scramble(el) {
  const final = el.textContent;
  const total = 700, start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / total, 1);
    const fixed = Math.floor(p * final.length);                  // characters locked in so far
    el.textContent = [...final].map((c, i) =>
      i < fixed || c === ' ' || c === '/' ? c : CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join('');
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

/* ------------------------------------------------------------------
   3. Fade elements up as they scroll into view, once.
   ------------------------------------------------------------------ */
const seen = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('in');
    if (e.target.hasAttribute('data-scramble') && !reduceMotion) scramble(e.target);
    seen.unobserve(e.target);
  }
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.reveal, [data-scramble]').forEach((el) => seen.observe(el));

/* ------------------------------------------------------------------
   4. Nav gets a bottom border once you scroll.
   ------------------------------------------------------------------ */
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ------------------------------------------------------------------
   5. Project rows: the first time one opens, play its agent log, then
      reveal the write-up. After that it opens instantly.
   ------------------------------------------------------------------ */
// Each log line has data-at (ms until it appears) and optionally data-done
// (ms until its spinner becomes a filled marker). Same data-at = running in parallel.
function play(list) {
  let end = 0;
  for (const li of list.querySelectorAll('li')) {
    const at = Number(li.dataset.at || 0);
    const done = li.dataset.done ? Number(li.dataset.done) : null;
    li.classList.remove('on', 'done');
    setTimeout(() => li.classList.add('on'), at);
    if (done !== null) setTimeout(() => li.classList.add('done'), done);
    end = Math.max(end, at, done ?? 0);
  }
  return end;
}

for (const row of document.querySelectorAll('details.run')) {
  row.addEventListener('toggle', () => {
    if (!row.open || row.classList.contains('played')) return;
    if (reduceMotion) { row.classList.add('played'); return; }
    row.classList.add('running');
    const total = play(row.querySelector('.log'));
    setTimeout(() => { row.classList.remove('running'); row.classList.add('played'); }, total + 350);
  });
}

/* ------------------------------------------------------------------
   6. Scroll rail on the right edge. 34 ticks stand for the whole page.
      Each tick's "closeness" f to your current position (0 to 1) sets
      its length and opacity: f = (1 - distance / 6)^2, so the bump is
      about 5 ticks wide on each side. Drag the rail or click a tick.
   ------------------------------------------------------------------ */
(() => {
  const N = 34, SPREAD = 6, MIN_W = 6, MAX_W = 28, MIN_O = 0.22;
  const root = document.documentElement;
  const rail = document.createElement('div');
  rail.className = 'rail'; rail.setAttribute('aria-hidden', 'true');
  const ticks = Array.from({ length: N }, () => rail.appendChild(document.createElement('span')));
  document.body.append(rail);

  const progress = () => { const max = root.scrollHeight - innerHeight; return max > 0 ? scrollY / max : 0; };
  const paint = () => {
    const at = progress() * (N - 1);                       // fractional tick index you're "at"
    ticks.forEach((t, i) => {
      const f = Math.max(0, 1 - Math.abs(i - at) / SPREAD) ** 2;
      t.style.width = (MIN_W + (MAX_W - MIN_W) * f) + 'px';
      t.style.opacity = MIN_O + (1 - MIN_O) * f;
    });
  };
  addEventListener('scroll', paint, { passive: true });
  addEventListener('resize', paint);
  new ResizeObserver(paint).observe(document.body);
  paint();

  // Map a pointer's height on the rail to a spot on the page.
  const scrollToPointer = (y, smooth) => {
    const r = rail.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (y - r.top) / r.height));
    scrollTo({ top: p * (root.scrollHeight - innerHeight), behavior: smooth ? 'smooth' : 'instant' });
  };
  let dragging = false;
  rail.addEventListener('pointerdown', (e) => { dragging = true; rail.classList.add('drag'); rail.setPointerCapture(e.pointerId); scrollToPointer(e.clientY, true); });
  rail.addEventListener('pointermove', (e) => { if (dragging) scrollToPointer(e.clientY, false); });
  const end = () => { dragging = false; rail.classList.remove('drag'); };
  rail.addEventListener('pointerup', end); rail.addEventListener('pointercancel', end);
})();
