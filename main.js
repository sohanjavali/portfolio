// Everything in this file is decoration. All the content is already in the
// HTML, so the page reads the same with JavaScript turned off.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------
   1. Hero background: lines tracing paths across an invisible lattice.
      Each one moves point to point, sometimes turns, leaves a fading
      trail, and now and then drops a small label of a real task.
   ------------------------------------------------------------------ */
const canvas = document.querySelector('.grid');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const GAP = 32;                       // px between lattice points
  // Little "task finished" labels, pulled from things I've actually built
  const TASKS = [
    'parse docket', 'fetch filings', 'ocr scan', 'extract fields', 'cite source', 'check owner', 'retrain bert',
    'research topic', 'write script', 'voice line', 'stitch mp3', 'save episode',
    'sample weekday', 'order frame', 'read lot', 'validate schema', 'pivot matrix',
    'find leads', 'score lead', 'draft email', 'approve draft', 'send batch', 'triage reply',
    'capture note', 'route inbox', 'lint note', 'commit', 'push backup', 'weekly audit',
    'run tests', 'review diff', 'merge', 'deploy',
  ];
  let w = 0, h = 0, cols = 0, rows = 0, colors = {};
  let paths = [], ripples = [], last = 0, running = false, visible = true;

  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const readColors = () => { colors = { label: css('--muted'), accent: css('--accent') }; };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / GAP); rows = Math.ceil(h / GAP);
    const target = Math.max(5, Math.min(16, Math.round(w / 100)));
    while (paths.length < target) paths.push(spawn());
    paths.length = Math.min(paths.length, target + 8);
  }

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function spawn(x, y) {
    const [dx, dy] = DIRS[Math.floor(Math.random() * 4)];
    return {
      x: x ?? Math.floor(cols * (0.2 + Math.random() * 0.8)),   // mostly right of center, away from the text
      y: y ?? Math.floor(Math.random() * rows),
      dx, dy, t: 0,
      speed: 2.2 + Math.random() * 2.2,                          // grid steps per second
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
    if (Math.random() < 0.05) {                                  // drop a task label
      ripples.push({ x: a.x, y: a.y, age: 0, label: TASKS[Math.floor(Math.random() * TASKS.length)] });
    }
    if (a.x < -1 || a.y < -1 || a.x > cols + 1 || a.y > rows + 1) Object.assign(a, spawn(), { trail: [] });
  }

  function update(dt) {
    for (const a of paths) {
      a.t += a.speed * dt;
      while (a.t >= 1) { a.t -= 1; step(a); }
    }
    for (const r of ripples) r.age += dt;
    ripples = ripples.filter((r) => r.age < 1.6);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'butt';                  // flat ends so segments don't stack into dots at joints

    for (const a of paths) {
      const hx = (a.x + a.dx * a.t) * GAP, hy = (a.y + a.dy * a.t) * GAP;
      const pts = [...a.trail.map(([x, y]) => [x * GAP, y * GAP]), [a.x * GAP, a.y * GAP], [hx, hy]];
      ctx.strokeStyle = colors.accent; ctx.lineWidth = 1.5;
      for (let i = 1; i < pts.length; i++) {                     // older segments fade out
        ctx.globalAlpha = (i / pts.length) * 0.6;
        ctx.beginPath(); ctx.moveTo(...pts[i - 1]); ctx.lineTo(...pts[i]); ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.fillStyle = colors.accent;        // square head
      ctx.fillRect(hx - 2.5, hy - 2.5, 5, 5);
    }

    ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
    for (const r of ripples) {
      const k = r.age / 1.6, x = r.x * GAP, y = r.y * GAP;
      ctx.globalAlpha = (1 - k) * 0.8; ctx.fillStyle = colors.label;
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
  function start() { if (running || reduceMotion || !visible || document.hidden) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }

  readColors(); resize();
  if (reduceMotion) { for (let i = 0; i < 150; i++) update(1 / 30); draw(); }   // one still frame
  else start();

  // Only animate while the hero is on screen and the tab is visible (saves battery).
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  new ResizeObserver(() => { resize(); if (!running) draw(); }).observe(canvas);
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { readColors(); resize(); draw(); });

  // Click to start a new path at the nearest lattice point.
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / GAP), y = Math.round((e.clientY - rect.top) / GAP);
    paths.push(spawn(x, y));
    if (paths.length > 24) paths.shift();
    ripples.push({ x, y, age: 0, label: 'new path' });
    if (!running) draw();
  });
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
   4b. Notion-style scrollbar. The native one is hidden (html.sb) and this
       draws a thin bar that appears while you scroll or hover the right
       edge, then fades out about a second later. You can drag it.
       Mouse/trackpad only: touch devices keep their own overlay bars.
   ------------------------------------------------------------------ */
if (window.matchMedia('(pointer: fine)').matches) {
  const root = document.documentElement;
  root.classList.add('sb');
  const rail = document.createElement('div'); rail.className = 'sb-rail'; rail.setAttribute('aria-hidden', 'true');
  const thumb = document.createElement('div'); thumb.className = 'sb-thumb';
  rail.append(thumb); document.body.append(rail);
  let hideTimer, dragFrom = null;

  // Thumb height is the visible share of the page; its top tracks scroll position.
  const place = () => {
    const view = window.innerHeight, full = root.scrollHeight;
    const hgt = Math.max(36, (view / full) * view);
    const max = full - view;
    thumb.style.height = hgt + 'px';
    thumb.style.top = (max > 0 ? (window.scrollY / max) * (view - hgt) : 0) + 'px';
    rail.style.display = max > 0 ? '' : 'none';
  };
  const show = () => {
    rail.classList.add('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (!dragFrom) rail.classList.remove('show'); }, 1000);
  };
  window.addEventListener('scroll', () => { place(); show(); }, { passive: true });
  window.addEventListener('resize', place);
  new ResizeObserver(place).observe(document.body);   // page height changes when a row opens
  rail.addEventListener('pointerenter', show);

  // Drag: map mouse movement on the rail to page scroll.
  thumb.addEventListener('pointerdown', (e) => {
    e.preventDefault(); thumb.setPointerCapture(e.pointerId);
    dragFrom = { y: e.clientY, scroll: window.scrollY }; rail.classList.add('drag', 'show');
  });
  thumb.addEventListener('pointermove', (e) => {
    if (!dragFrom) return;
    const view = window.innerHeight, full = root.scrollHeight;
    const hgt = thumb.offsetHeight, ratio = (full - view) / (view - hgt);
    window.scrollTo({ top: dragFrom.scroll + (e.clientY - dragFrom.y) * ratio, behavior: 'instant' });
  });
  thumb.addEventListener('pointerup', () => { dragFrom = null; rail.classList.remove('drag'); show(); });
  // Click the empty rail to jump there.
  rail.addEventListener('pointerdown', (e) => {
    if (e.target !== rail) return;
    const view = window.innerHeight;
    window.scrollTo({ top: (e.clientY / view) * (root.scrollHeight - view) });
  });
  place();
}

/* ------------------------------------------------------------------
   5. Project rows: the first time one opens, play its step log, then
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
