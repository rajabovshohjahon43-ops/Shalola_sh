(() => {
'use strict';

/* =====================================================
   SOZLAMALAR — shu yerni o'zingizga moslab o'zgartiring
   ===================================================== */
const CONFIG = {
  startDate: '2024-01-01',   // birga bo'lgan sana (YYYY-MM-DD)
  reasons: [
    "Sening kulgishing mening eng sevimli ohangim.",
    "Sen bilan jimlik ham gapirishdan go'zalroq.",
    "Ko'zlaringda butun koinotni ko'raman.",
    "Sen kelganingda dunyo yorishib ketadi.",
    "Yuragim har urganda sening isming eshitiladi.",
    "Sen — mening eng go'zal orzuyim.",
    "Har kuni seni yana qaytadan sevib qolaman.",
    "Sening borliging — mening tinchligim."
  ],
  secretLine: "Biz baxtli bo'lamiz, xudo xohlasa"
};

/* ---------- Yordamchilar ---------- */
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------- Canvaslar ---------- */
const sc = $('#scene'), sctx = sc.getContext('2d');
const fxc = $('#fx'), fctx = fxc.getContext('2d');
const heroEl = $('#home');
let W = 0, H = 0, DPR = 1;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  for (const c of [sc, fxc]) {
    c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    c.style.width = W + 'px'; c.style.height = H + 'px';
  }
}
window.addEventListener('resize', resize);
resize();

/* =====================================================
   1) YULDUZLAR VA KOMETALAR
   ===================================================== */
const stars = Array.from({ length: 280 }, () => ({
  x: Math.random(), y: Math.random(), r: rand(0.3, 1.5),
  tw: rand(0.8, 3.5), ph: rand(0, TAU), big: Math.random() < 0.06
}));

const comets = [];
let nextComet = 1.2;
let cometRate = 1;   // oy tugmasi bosilganda ko'payadi

function spawnComet(fast) {
  const ang = rand(Math.PI * 0.62, Math.PI * 0.80);
  const sp = rand(520, 920) * (fast ? 1.2 : 1);
  comets.push({
    x: rand(W * 0.25, W * 1.1), y: rand(-80, H * 0.45),
    vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
    len: rand(110, 240), age: 0, max: rand(1.4, 2.6),
    col: Math.random() < 0.5 ? [255, 255, 255] : (Math.random() < 0.5 ? [255, 190, 220] : [190, 215, 255])
  });
}

function drawStars(time) {
  for (const s of stars) {
    const a = 0.25 + 0.75 * Math.abs(Math.sin(time * s.tw + s.ph));
    const x = s.x * W, y = s.y * H;
    sctx.fillStyle = `rgba(255,255,255,${(a * 0.9).toFixed(2)})`;
    sctx.fillRect(x, y, s.r, s.r);
    if (s.big) {
      sctx.fillStyle = `rgba(255,220,240,${(a * 0.5).toFixed(2)})`;
      sctx.fillRect(x - 4, y + s.r / 2 - 0.4, 9, 0.8);
      sctx.fillRect(x + s.r / 2 - 0.4, y - 4, 0.8, 9);
    }
  }
}

function updateComets(time, dt) {
  nextComet -= dt;
  if (nextComet <= 0) { spawnComet(false); nextComet = rand(1.2, 3.6) / cometRate; }
  for (let i = comets.length - 1; i >= 0; i--) {
    const c = comets[i];
    c.age += dt; c.x += c.vx * dt; c.y += c.vy * dt;
    const life = c.age / c.max;
    if (life >= 1 || c.x < -300 || c.y > H + 300) { comets.splice(i, 1); continue; }
    const a = Math.sin(life * Math.PI);
    const sp = Math.hypot(c.vx, c.vy);
    const tx = c.x - (c.vx / sp) * c.len, ty = c.y - (c.vy / sp) * c.len;
    const g = sctx.createLinearGradient(c.x, c.y, tx, ty);
    g.addColorStop(0, `rgba(${c.col},${a})`);
    g.addColorStop(1, `rgba(${c.col},0)`);
    sctx.strokeStyle = g; sctx.lineWidth = 2; sctx.lineCap = 'round';
    sctx.beginPath(); sctx.moveTo(c.x, c.y); sctx.lineTo(tx, ty); sctx.stroke();
    const hg = sctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 10);
    hg.addColorStop(0, `rgba(255,255,255,${a})`);
    hg.addColorStop(1, `rgba(${c.col},0)`);
    sctx.fillStyle = hg; sctx.fillRect(c.x - 10, c.y - 10, 20, 20);
  }
}

/* =====================================================
   2) ZARRACHALI NEON YURAK
   ===================================================== */
const N_OUT = 3200, N_IN = 2000;
const heartPt = t => [
  16 * Math.pow(Math.sin(t), 3),
  13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
];

const outline = Array.from({ length: N_OUT }, (_, i) => ({
  u: i / N_OUT,
  sp: rand(0.03, 0.16),            // yurak chizig'i bo'ylab aylanish tezligi
  ang: rand(0, TAU), rad: Math.pow(Math.random(), 2) * 1.0, rs: rand(-1.4, 1.4),
  tw: rand(1.5, 5), ph: rand(0, TAU),
  size: rand(0.9, 2.3), m: Math.random(), glow: Math.random() < 0.1
}));

const inner = Array.from({ length: N_IN }, () => ({
  t: rand(0, TAU), r: Math.sqrt(Math.random()) * 0.97,
  sp: rand(0.2, 0.9), ph: rand(0, TAU), dr: rand(0.1, 0.7),
  tw: rand(1.5, 5), size: rand(0.7, 1.9), m: Math.random(), glow: Math.random() < 0.06
}));

/* Ranglar bosqichlari: olovrang -> binafsha -> yashil */
const PH = [
  { A: [255, 105, 20], B: [255, 50, 90] },
  { A: [170, 90, 255], B: [255, 120, 225] },
  { A: [15, 165, 75],  B: [150, 255, 150] }
];
const PHASE_T = 8, TRANS = 2.4;
const lerpC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function phaseState(tr) {
  const cyc = Math.max(0, tr) / PHASE_T;
  const i = Math.floor(cyc) % 3, j = (i + 1) % 3, f = cyc % 1;
  const tt = clamp((f * PHASE_T - (PHASE_T - TRANS)) / TRANS, 0, 1);
  const e = tt * tt * (3 - 2 * tt);
  const w = [0, 0, 0]; w[i] = 1 - e; w[j] = e;
  return { w, A: lerpC(PH[i].A, PH[j].A, e), B: lerpC(PH[i].B, PH[j].B, e) };
}

let heartStart = null;           // intro tugagach belgilanadi
const sparks = [];
let sparkAcc = 0;

function addSpark(x, y, vx, vy, life, size, col, g) {
  if (sparks.length > 1400) return;
  sparks.push({ x, y, vx, vy, age: 0, max: life, size, col, g });
}

function outlineXY(p, tr, cx, cy, S, out) {
  const t = p.u * TAU + tr * p.sp;
  const hx = 16 * Math.pow(Math.sin(t), 3);
  const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  const a = p.ang + tr * p.rs;
  out[0] = cx + (hx + Math.cos(a) * p.rad) * S;
  out[1] = cy - (hy + 2.5) * S + Math.sin(a) * p.rad * S;
}

const tmp = [0, 0];

function drawHeartScene(time, dt) {
  if (heartStart === null) return;
  const rect = heroEl.getBoundingClientRect();
  if (rect.bottom < -80 || rect.top > H + 80) return;

  const tr = time - heartStart;
  if (tr < 0) return;
  const draw = clamp(tr / 5, 0, 1);
  const drawE = draw * draw * (3 - 2 * draw);
  const beat = Math.pow(Math.abs(Math.sin(tr * 1.5)), 12);
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height * 0.5;
  const S = Math.min(W * 0.78 / 34, rect.height * 0.5 / 30) * (1 + 0.035 * beat);

  const ps = phaseState(tr);
  const [wO, wP, wG] = ps.w;
  const A = ps.A, B = ps.B;
  const inA = clamp((drawE - 0.55) * 2.2, 0, 1);

  /* --- Binafsha bosqich: markazdan yorqin nur va zarralar buluti --- */
  if (wP > 0.01 && inA > 0) {
    const R = S * 17;
    const g = sctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, `rgba(255,215,255,${0.5 * wP * inA})`);
    g.addColorStop(0.25, `rgba(190,90,255,${0.22 * wP * inA})`);
    g.addColorStop(1, 'rgba(120,40,200,0)');
    sctx.fillStyle = g; sctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    for (let k = 0; k < 16; k++) {
      const a = tr * 0.35 + k * TAU / 16;
      const L = S * (14 + 4 * Math.sin(tr * 2 + k));
      const gg = sctx.createLinearGradient(cx, cy, cx + Math.cos(a) * L, cy + Math.sin(a) * L);
      gg.addColorStop(0, `rgba(255,200,255,${0.22 * wP * inA})`);
      gg.addColorStop(1, 'rgba(255,200,255,0)');
      sctx.fillStyle = gg;
      sctx.beginPath(); sctx.moveTo(cx, cy);
      sctx.lineTo(cx + Math.cos(a - 0.025) * L, cy + Math.sin(a - 0.025) * L);
      sctx.lineTo(cx + Math.cos(a + 0.025) * L, cy + Math.sin(a + 0.025) * L);
      sctx.closePath(); sctx.fill();
    }
  }

  /* --- Yashil bosqich: pastki uch eng yorqin nuqta --- */
  const tipX = cx, tipY = cy + 14.5 * S;
  if (wG > 0.01 && inA > 0) {
    const R = S * 5.5 * (1 + 0.15 * Math.sin(tr * 4));
    const g = sctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, R);
    g.addColorStop(0, `rgba(230,255,230,${0.9 * wG * inA})`);
    g.addColorStop(0.3, `rgba(80,255,120,${0.45 * wG * inA})`);
    g.addColorStop(1, 'rgba(0,200,80,0)');
    sctx.fillStyle = g; sctx.fillRect(tipX - R, tipY - R, R * 2, R * 2);
  }

  /* --- Kontur zarrachalari --- */
  for (const p of outline) {
    const a0 = clamp((drawE - p.u) * 18, 0, 1);
    if (a0 <= 0) continue;
    outlineXY(p, tr, cx, cy, S, tmp);
    let r = lerp(A[0], B[0], p.m), g = lerp(A[1], B[1], p.m), b = lerp(A[2], B[2], p.m);
    const head = draw < 1 ? clamp(1 - (drawE - p.u) * 40, 0, 1) : 0;   // chizilayotgan uch oq yonadi
    if (head > 0) { r = lerp(r, 255, head); g = lerp(g, 255, head); b = lerp(b, 255, head); }
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(tr * p.tw + p.ph));
    const a = a0 * tw;
    sctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a.toFixed(2)})`;
    sctx.fillRect(tmp[0] - p.size / 2, tmp[1] - p.size / 2, p.size, p.size);
    if (p.glow) {
      sctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${(a * 0.14).toFixed(3)})`;
      const s4 = p.size * 5;
      sctx.fillRect(tmp[0] - s4 / 2, tmp[1] - s4 / 2, s4, s4);
    }
  }

  /* --- Ichki uchqunlar --- */
  if (inA > 0) {
    for (const p of inner) {
      const [hx, hy] = heartPt(p.t);
      const wob = Math.sin(tr * p.sp + p.ph) * p.dr;
      const px = cx + (hx * p.r + wob) * S;
      const py = cy - (hy * p.r + 2.5 + Math.cos(tr * p.sp + p.ph) * p.dr) * S;
      const tw = Math.pow(Math.abs(Math.sin(tr * p.tw + p.ph)), 2);
      const a = tw * inA * 0.85 * (p.r < 0.28 ? 0.6 : 1);
      if (a < 0.03) continue;
      const m = p.m;
      sctx.fillStyle = `rgba(${lerp(A[0], B[0], m) | 0},${lerp(A[1], B[1], m) | 0},${lerp(A[2], B[2], m) | 0},${a.toFixed(2)})`;
      sctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
      if (p.glow && tw > 0.6) {
        sctx.fillStyle = `rgba(255,255,255,${(a * 0.5).toFixed(2)})`;
        sctx.fillRect(px - 5, py - 0.4, 10, 0.8);
        sctx.fillRect(px - 0.4, py - 5, 0.8, 10);
      }
    }
  }

  /* --- Uchqunlar sochilishi --- */
  if (draw > 0.15) {
    sparkAcc += dt * (110 + 90 * wO);
    const sparkCol = lerpC(B, [255, 255, 255], 0.35);
    while (sparkAcc >= 1) {
      sparkAcc--;
      const roll = Math.random();
      const wTotal = 1.0 + wG * 0.9 + wP * 0.7;
      if (roll < 1 / wTotal) {
        // kontur uchqunlari (olovrang bosqichda ko'proq va o'ng tomonga)
        let p = outline[(Math.random() * N_OUT) | 0], tries = 0;
        outlineXY(p, tr, cx, cy, S, tmp);
        while (wO > 0.3 && tmp[0] < cx && tries++ < 6 && Math.random() < 0.85) {
          p = outline[(Math.random() * N_OUT) | 0]; outlineXY(p, tr, cx, cy, S, tmp);
        }
        if (p.u > drawE) continue;
        const dx = tmp[0] - cx, dy = tmp[1] - cy, d = Math.hypot(dx, dy) || 1;
        const v = rand(25, 110) * (1 + 0.6 * wO);
        addSpark(tmp[0], tmp[1], dx / d * v + rand(-30, 30), dy / d * v + rand(-50, 10),
          rand(0.7, 1.6), rand(1, 2.4), sparkCol, 70 * wO);
      } else if (roll < (1 + wG * 0.9) / wTotal) {
        // pastki uchdan yashil chang
        addSpark(tipX + rand(-6, 6), tipY + rand(-6, 4), rand(-70, 70), rand(-60, 30),
          rand(0.9, 2), rand(0.8, 2), [140 + rand(0, 100), 255, 150], 0);
      } else {
        // markazdan binafsha zarralar buluti
        const a = rand(0, TAU), d = rand(0, S * 6);
        addSpark(cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.cos(a) * rand(10, 50), Math.sin(a) * rand(10, 50),
          rand(0.8, 1.8), rand(0.8, 2), [235, 160, 255], 0);
      }
    }
  }
}

function drawSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.age += dt;
    if (s.age >= s.max) { sparks[i] = sparks[sparks.length - 1]; sparks.pop(); continue; }
    s.vy += s.g * dt; s.vx *= 0.99;
    s.x += s.vx * dt; s.y += s.vy * dt;
    const a = Math.pow(1 - s.age / s.max, 1.3);
    sctx.fillStyle = `rgba(${s.col[0] | 0},${s.col[1] | 0},${s.col[2] | 0},${a.toFixed(2)})`;
    sctx.fillRect(s.x, s.y, s.size, s.size);
    sctx.fillStyle = `rgba(${s.col[0] | 0},${s.col[1] | 0},${s.col[2] | 0},${(a * 0.18).toFixed(3)})`;
    sctx.fillRect(s.x - s.size * 2, s.y - s.size * 2, s.size * 5, s.size * 5);
  }
}

/* =====================================================
   3) SICHQONCHA / BOSISH: QIRMIZI YURAKCHALAR
   ===================================================== */
const hearts = [];
const HEART_COLORS = ['#ff1744', '#ff2d55', '#e8003d', '#ff5c8a', '#ff0f3c'];

function spawnHeart(x, y, burst) {
  if (hearts.length > 600) hearts.shift();
  const ang = burst ? rand(0, TAU) : rand(-2.5, -0.64);
  const sp = burst ? rand(60, 300) : rand(20, 70);
  hearts.push({
    x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - (burst ? 40 : 30),
    s: rand(5, 12) * (burst ? 1.15 : 1), rot: rand(-0.5, 0.5), rv: rand(-1.5, 1.5),
    age: 0, max: rand(1.2, 2.2), col: HEART_COLORS[(Math.random() * HEART_COLORS.length) | 0]
  });
}

function drawHeartShape(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 0.9);
  ctx.bezierCurveTo(-1.4, 0.1, -0.9, -0.9, 0, -0.35);
  ctx.bezierCurveTo(0.9, -0.9, 1.4, 0.1, 0, 0.9);
  ctx.fill(); ctx.restore();
}

function updateHearts(dt) {
  fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  fctx.clearRect(0, 0, W, H);
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.age += dt;
    if (h.age >= h.max) { hearts.splice(i, 1); continue; }
    h.vx *= 0.985; h.vy = h.vy * 0.985 - 28 * dt;
    h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.rv * dt;
    const life = h.age / h.max;
    fctx.globalAlpha = Math.min(1, (1 - life) * 1.6);
    fctx.fillStyle = h.col;
    fctx.shadowColor = '#ff0033'; fctx.shadowBlur = 10;
    drawHeartShape(fctx, h.x, h.y, h.s * (1 - life * 0.3), h.rot);
  }
  fctx.globalAlpha = 1; fctx.shadowBlur = 0;
}

let lastPX = null, lastPY = 0, moveAcc = 0;
window.addEventListener('pointermove', e => {
  if (lastPX !== null) moveAcc += Math.hypot(e.clientX - lastPX, e.clientY - lastPY);
  lastPX = e.clientX; lastPY = e.clientY;
  while (moveAcc > 16) { moveAcc -= 16; spawnHeart(e.clientX + rand(-6, 6), e.clientY + rand(-6, 6), false); }
});

let combo = 0, comboT = 0;
window.addEventListener('pointerdown', e => {
  const now = performance.now();
  combo = now - comboT < 1300 ? Math.min(combo + 1, 8) : 1;   // tez-tez bossangiz yurakchalar ko'payadi
  comboT = now;
  const n = 10 + combo * 8;
  for (let i = 0; i < n; i++) spawnHeart(e.clientX, e.clientY, true);
});

function burstAt(x, y, n) { for (let i = 0; i < n; i++) spawnHeart(x, y, true); }

/* =====================================================
   4) ASOSIY SIKL
   ===================================================== */
let last = performance.now() / 1000;
function frame(now) {
  const time = now / 1000;
  const dt = Math.min(0.05, time - last); last = time;

  sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  sctx.globalCompositeOperation = 'source-over';
  sctx.clearRect(0, 0, W, H);
  sctx.globalCompositeOperation = 'lighter';

  drawStars(time);
  updateComets(time, dt);
  drawHeartScene(time, dt);
  drawSparks(dt);

  updateHearts(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* =====================================================
   5) INTRO: "I love you"
   ===================================================== */
const introEl = $('#intro'), introText = $('#introText');
[...'I love you'].forEach((ch, i) => {
  const s = document.createElement('span');
  s.textContent = ch === ' ' ? '\u00A0' : ch;
  s.style.setProperty('--i', i);
  introText.appendChild(s);
});
let introDone = false;
function endIntro() {
  if (introDone) return;
  introDone = true;
  introEl.classList.add('hide');
  document.body.classList.add('ready');
  heartStart = performance.now() / 1000 + 0.4;
  setTimeout(() => introEl.remove(), 1800);
}
setTimeout(endIntro, 4800);
introEl.addEventListener('click', endIntro);

/* =====================================================
   6) MODALLAR
   ===================================================== */
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  document.body.classList.add('modal-open');
  if (id === 'giftModal') Ring.start();
  if (id === 'secretModal') resetSecret();
}
function closeModals() {
  $$('.modal.open').forEach(m => m.classList.remove('open'));
  document.body.classList.remove('modal-open');
  Ring.stop();
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]');
  if (o) { e.preventDefault(); openModal(o.dataset.open); return; }
  if (e.target.closest('[data-close]') || e.target.classList.contains('modal')) closeModals();
});
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });

/* =====================================================
   7) SIRLI SO'Z
   ===================================================== */
const secretReveal = $('#secretReveal');
function resetSecret() { secretReveal.innerHTML = ''; }
$('#secretBtn').addEventListener('click', e => {
  const r = e.currentTarget.getBoundingClientRect();
  burstAt(r.left + r.width / 2, r.top + r.height / 2, 40);
  secretReveal.innerHTML = '';
  const orn = document.createElement('span'); orn.className = 'orn'; orn.textContent = '✦ ❦ ✦';
  secretReveal.appendChild(orn);
  const line = document.createElement('div');
  [...CONFIG.secretLine].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className = 'ch'; s.style.setProperty('--i', i);
    s.textContent = ch === ' ' ? '\u00A0' : ch;
    line.appendChild(s);
  });
  secretReveal.appendChild(line);
  const orn2 = orn.cloneNode(true); orn2.style.animationDelay = '2s';
  secretReveal.appendChild(orn2);
  setTimeout(() => {
    const rr = secretReveal.getBoundingClientRect();
    burstAt(rr.left + rr.width / 2, rr.top + rr.height / 2, 60);
  }, 1800);
});

/* =====================================================
   8) 3D OLMOSLI UZUK (three.js)
   ===================================================== */
const Ring = (() => {
  const stage = $('#ringStage');
  let renderer, scene, camera, group, raf = 0, dragging = false, lastX = 0, sprites = [], failed = false;

  function envCube() {
    const N = 256, faces = [];
    for (let i = 0; i < 6; i++) {
      const c = document.createElement('canvas'); c.width = c.height = N;
      const g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, N);
      if (i === 2) { gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#cfd6ff'); }
      else if (i === 3) { gr.addColorStop(0, '#12121f'); gr.addColorStop(1, '#000'); }
      else { gr.addColorStop(0, '#e9ecff'); gr.addColorStop(0.35, '#4a4f80'); gr.addColorStop(1, '#05050a'); }
      g.fillStyle = gr; g.fillRect(0, 0, N, N);
      for (let k = 0; k < 16; k++) {
        const w = rand(14, 70), h = rand(8, 50), x = rand(0, N - w), y = rand(0, N - h), t = Math.random();
        g.fillStyle = t < 0.6 ? `rgba(255,255,255,${rand(0.6, 1)})`
                    : t < 0.8 ? `rgba(255,190,225,${rand(0.5, 0.9)})`
                              : `rgba(180,215,255,${rand(0.5, 0.9)})`;
        g.fillRect(x, y, w, h);
      }
      faces.push(c);
    }
    const t = new THREE.CubeTexture(faces);
    t.encoding = THREE.sRGBEncoding; t.needsUpdate = true;
    return t;
  }

  /* Brilliant kesimli olmos: stol, toj, belbog', pavilon */
  function gemGeometry() {
    const pos = [];
    const V = (r, y, a) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const tri = (a, b, c) => {
      const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
      const cen = new THREE.Vector3().add(a).add(b).add(c).multiplyScalar(1 / 3);
      if (n.dot(cen) < 0) { const t = b; b = c; c = t; }   // normal doim tashqariga qarasin
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    };
    const T = k => V(0.56, 0.36, (k % 8) * TAU / 8);
    const Gt = j => V(1, 0.05, (j % 16) * TAU / 16);
    const Gb = j => V(1, 0.0, (j % 16) * TAU / 16);
    const R = j => V(j % 2 ? 0.4 : 0.64, -0.5, (j % 16) * TAU / 16);
    const Tc = new THREE.Vector3(0, 0.36, 0), P = new THREE.Vector3(0, -0.9, 0);
    for (let k = 0; k < 8; k++) {
      tri(T(k), Gt(2 * k), Gt(2 * k + 1));
      tri(T(k), Gt(2 * k + 1), T(k + 1));
      tri(T(k + 1), Gt(2 * k + 1), Gt(2 * k + 2));
      tri(Tc, T(k), T(k + 1));
    }
    for (let j = 0; j < 16; j++) {
      tri(Gt(j), Gt(j + 1), Gb(j + 1)); tri(Gt(j), Gb(j + 1), Gb(j));
      tri(Gb(j), Gb(j + 1), R(j + 1)); tri(Gb(j), R(j + 1), R(j));
      tri(R(j), R(j + 1), P);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    return geo;
  }

  function sparkleTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.15, 'rgba(255,255,255,.7)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(255,255,255,.95)';
    g.fillRect(8, 62, 112, 4); g.fillRect(62, 8, 4, 112);
    return new THREE.CanvasTexture(c);
  }

  function build() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputEncoding = THREE.sRGBEncoding;
    stage.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 50);
    camera.position.set(0, 1.2, 6.4);
    camera.lookAt(0, 0.62, 0);

    const env = envCube();
    const silver = new THREE.MeshStandardMaterial({ color: 0xf2f4ff, metalness: 1, roughness: 0.1, envMap: env, envMapIntensity: 1.3 });
    const gemMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.02, envMap: env, envMapIntensity: 1.9, flatShading: true });

    group = new THREE.Group();
    group.rotation.x = 0.16;
    scene.add(group);

    // halqa (platina)
    group.add(new THREE.Mesh(new THREE.TorusGeometry(1, 0.1, 32, 180), silver));

    // markaziy olmos
    const geo = gemGeometry();
    const gem = new THREE.Group();
    gem.add(new THREE.Mesh(geo, gemMat));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
    gem.add(edges);
    const inside = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xaee1ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    }));
    inside.scale.setScalar(0.62); inside.rotation.y = TAU / 32;
    gem.add(inside);
    gem.scale.setScalar(0.42);
    gem.position.set(0, 1.4, 0);
    group.add(gem);

    // tirnoqchalar
    for (let k = 0; k < 6; k++) {
      const a = k * TAU / 6 + TAU / 12;
      const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.3, 12), silver);
      prong.position.set(Math.cos(a) * 0.4, 1.32, Math.sin(a) * 0.4);
      prong.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
      group.add(prong);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 12), silver);
      tip.position.set(Math.cos(a) * 0.385, 1.48, Math.sin(a) * 0.385);
      group.add(tip);
    }

    // halqa bo'ylab mayda olmoschalar
    const small = new THREE.IcosahedronGeometry(0.045, 0);
    for (let i = -7; i <= 7; i++) {
      if (Math.abs(i) < 3) continue;
      const th = i * 0.095;
      const s = new THREE.Mesh(small, gemMat);
      s.position.set(Math.sin(th) * 1.1, Math.cos(th) * 1.1, 0);
      s.lookAt(s.position.clone().multiplyScalar(2));
      group.add(s);
    }

    // yaltirash nurlari
    const tex = sparkleTexture();
    const spots = [[-0.22, 1.56, 0.3], [0.28, 1.5, 0.25], [0.02, 1.62, -0.1], [0.1, 1.38, 0.42], [-0.3, 1.42, 0.1]];
    spots.forEach(p => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, opacity: 0 }));
      sp.position.set(...p); group.add(sp); sprites.push(sp);
    });

    // yorug'lik
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const d = new THREE.DirectionalLight(0xffffff, 1.4); d.position.set(3, 5, 4); scene.add(d);
    const p1 = new THREE.PointLight(0xff6fb5, 1.2, 12); p1.position.set(-3, 2, 3); scene.add(p1);
    const p2 = new THREE.PointLight(0x7fb6ff, 1.2, 12); p2.position.set(3, 1, -3); scene.add(p2);

    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (dragging) { group.rotation.y += (e.clientX - lastX) * 0.012; lastX = e.clientX; } });
    const up = () => { dragging = false; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    const t = ts / 1000;
    if (!dragging) group.rotation.y += 0.009;
    group.position.y = Math.sin(t * 1.2) * 0.05;
    sprites.forEach((s, i) => {
      const k = Math.pow(0.5 + 0.5 * Math.sin(t * 2.6 + i * 1.7), 3);
      s.material.opacity = k; s.scale.setScalar(0.1 + 0.36 * k);
    });
    renderer.render(scene, camera);
  }

  function onResize() {
    if (!renderer) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  return {
    start() {
      if (failed) return;
      if (!window.THREE) { failed = true; stage.innerHTML = '<p class="err">3D kutubxona yuklanmadi. Internetni tekshirib, sahifani yangilang.</p>'; return; }
      if (!renderer) {
        try { build(); } catch (err) { failed = true; console.error(err); stage.innerHTML = '<p class="err">Brauzeringiz 3D (WebGL) ni qo\'llamayapti.</p>'; return; }
      }
      onResize();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    },
    stop() { cancelAnimationFrame(raf); }
  };
})();

/* =====================================================
   9) MUSIQA (fayl kerak emas — brauzerning o'zida chaladi)
   ===================================================== */
const Music = (() => {
  let ac, master, timer, step = 0, on = false;
  const prog = [[48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]];
  const pat = [0, 1, 2, 3, 2, 1, 3, 2];
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  function note(m, when, dur, vol, type) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = mf(m);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(master); o.start(when); o.stop(when + dur + 0.05);
  }
  function tick() {
    const chord = prog[Math.floor(step / 8) % 4];
    note(chord[pat[step % 8]] + 12, ac.currentTime + 0.02, 1.6, 0.12, 'sine');
    if (step % 8 === 0) chord.forEach(m => note(m, ac.currentTime + 0.02, 3.4, 0.06, 'triangle'));
    step++;
  }
  function start() {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.5;
      const d = ac.createDelay(); d.delayTime.value = 0.32;
      const fb = ac.createGain(); fb.gain.value = 0.38;
      d.connect(fb); fb.connect(d);
      master.connect(ac.destination); master.connect(d); d.connect(ac.destination);
    }
    ac.resume(); timer = setInterval(tick, 420); on = true;
  }
  function stop() { clearInterval(timer); on = false; }
  return { toggle() { on ? stop() : start(); return on; } };
})();

/* =====================================================
   10) PASTKI TUGMALAR, HISOBLAGICH, SABABLAR
   ===================================================== */
$$('.dock button').forEach(b => b.addEventListener('click', () => {
  const act = b.dataset.act;
  if (act === 'hearts') burstAt(W / 2, H / 2, 90);
  if (act === 'stars') for (let i = 0; i < 14; i++) setTimeout(() => spawnComet(true), i * 120);
  if (act === 'moon') {
    const on = document.body.classList.toggle('moonlight');
    cometRate = on ? 2.5 : 1; b.classList.toggle('active', on);
  }
  if (act === 'music') b.classList.toggle('active', Music.toggle());
}));

$('#tryHearts').addEventListener('click', e => {
  const r = e.currentTarget.getBoundingClientRect();
  burstAt(r.left + r.width / 2, r.top, 60);
});

function updateCounter() {
  const d = Math.floor((Date.now() - new Date(CONFIG.startDate).getTime()) / 864e5);
  $('#days').textContent = Math.max(0, d).toLocaleString('en-US');
}
updateCounter();

let lastReason = -1;
$('#reasonBtn').addEventListener('click', e => {
  let i; do { i = (Math.random() * CONFIG.reasons.length) | 0; } while (i === lastReason && CONFIG.reasons.length > 1);
  lastReason = i;
  const el = $('#reasonText');
  el.classList.remove('pop'); void el.offsetWidth;
  el.textContent = CONFIG.reasons[i]; el.classList.add('pop');
});

})();
