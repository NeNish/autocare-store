/*
  WindshieldSim: a real-time rain-on-glass renderer (Canvas 2D).

  Layers, back to front:
    1. A procedural road scene (sharp) and a blurred copy of it.
    2. A water film: a low-resolution wetness mask that blends in the blurred
       scene. Rain builds it up; wipers and running drops clear it.
    3. Raindrops that refract the scene: each drop shows a small, flipped,
       lens-like view of what is behind it, with a rim and a highlight.
    4. Two wiper blades sweeping real arcs that clear drops and film.
       Worn blades leave streak bands behind.
    5. Cockpit framing: A-pillars, dashboard and glass reflections.

  It is an illustrative visualisation, not a physical measurement.
*/

const DEFAULTS = {
  scene: 'night', // 'night' | 'dusk' | 'day'
  rain: 0.55, // 0..1
  repellent: false,
  wiper: 'intermittent', // 'off' | 'intermittent' | 'low' | 'high'
  blade: 'new', // 'new' | 'worn'
  fog: 0, // 0..1
  cockpit: true,
  quality: 'auto', // 'auto' | 'high' | 'low'
};

const WIPER_TIMING = {
  off: null,
  intermittent: { sweep: 1.5, pause: 2.6 },
  low: { sweep: 1.5, pause: 0.15 },
  high: { sweep: 0.95, pause: 0 },
};

// Seeded random so a scene looks the same on every rebuild
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export default class WindshieldSim {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = { ...DEFAULTS, ...options };
    this.reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.drops = [];
    this.time = 0;
    this.running = false;
    this.visible = true;
    this.listeners = new Set();
    this.lastStats = 0;
    this.wipe = { phase: 'rest', t: 0, angle: 0, prevAngle: 0 };
    this._raf = 0;
    this._last = 0;
    this._loop = this._loop.bind(this);
    this.resize();

    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(canvas);
    this._io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this._sync();
    });
    this._io.observe(canvas);
    this._onVis = () => this._sync();
    document.addEventListener('visibilitychange', this._onVis);
  }

  // ── Public API ────────────────────────────────────────────────
  setOptions(partial) {
    const prevScene = this.opts.scene;
    const prevBlade = this.opts.blade;
    this.opts = { ...this.opts, ...partial };
    if (this.opts.scene !== prevScene) this._buildScene();
    if (this.opts.blade !== prevBlade) this._buildStreaks();
    if (this.reduce || !this.running) this._renderStatic();
  }
  onStats(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  start() {
    this.wanted = true;
    this._sync();
  }
  stop() {
    this.wanted = false;
    this._sync();
  }
  destroy() {
    this.stop();
    this._ro.disconnect();
    this._io.disconnect();
    document.removeEventListener('visibilitychange', this._onVis);
    this.listeners.clear();
  }

  // ── Setup ─────────────────────────────────────────────────────
  resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    const small = w < 700;
    const q = this.opts.quality === 'auto' ? (small ? 'low' : 'high') : this.opts.quality;
    this.q = q;
    this.dpr = Math.min(window.devicePixelRatio || 1, q === 'high' ? 1.5 : 1.25);
    this.W = w;
    this.H = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.maxDrops = Math.round(Math.min(q === 'high' ? 340 : 150, (w * h) / (q === 'high' ? 3200 : 3600)));

    this.mScale = 1 / 8;
    this.mask = makeCanvas(w * this.mScale, h * this.mScale);
    this.mctx = this.mask.getContext('2d');
    this.mw = this.mask.width;
    this.mh = this.mask.height;
    // Water film lives in a float grid (canvas pixels are too coarse for slow build-up)
    this.film = new Float32Array(this.mw * this.mh);
    this.grain = new Float32Array(this.mw * this.mh).map(() => 0.55 + Math.random() * 0.9);
    this.maskImg = this.mctx.createImageData(this.mw, this.mh);
    this.wet = makeCanvas(w * this.dpr, h * this.dpr);
    this.wctx = this.wet.getContext('2d');
    this.wctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Wiper geometry: two pivots below the dashboard line, sweeping in tandem
    const base = Math.min(w * 0.52, h * 1.05);
    this.wipers = [
      { px: w * 0.27, py: h * 1.04, len: base, rest: 172, span: 102 },
      { px: w * 0.66, py: h * 1.04, len: base * 0.82, rest: 174, span: 98 },
    ];
    // Per-cell distance and angle from each wiper pivot, for fast sweep clearing
    this.polar = this.wipers.map((wp) => {
      const dist = new Float32Array(this.mw * this.mh);
      const ang = new Float32Array(this.mw * this.mh);
      for (let y = 0; y < this.mh; y++) {
        for (let x = 0; x < this.mw; x++) {
          const px = (x + 0.5) / this.mScale - wp.px;
          const py = wp.py - (y + 0.5) / this.mScale;
          dist[y * this.mw + x] = Math.hypot(px, py);
          ang[y * this.mw + x] = Math.atan2(py, px);
        }
      }
      return { dist, ang };
    });
    this._buildScene();
    this._buildStreaks();
    this.drops = this.drops.filter((d) => d.x < w && d.y < h);
    if (!this.running) this._renderStatic();
  }

  _buildStreaks() {
    const rand = rng(91);
    this.streaks = this.opts.blade === 'worn'
      ? this.wipers.map((wp) => Array.from({ length: 5 }, () => wp.len * (0.4 + rand() * 0.56)))
      : this.wipers.map(() => []);
  }

  // ── Procedural scene ──────────────────────────────────────────
  _buildScene() {
    const { W, H, dpr } = this;
    const scene = this.opts.scene;
    const sharp = makeCanvas(W * dpr, H * dpr);
    const c = sharp.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rand = rng(7);
    const horizon = H * 0.5;
    const vx = W * 0.5;

    const sky = c.createLinearGradient(0, 0, 0, horizon + 40);
    if (scene === 'day') {
      sky.addColorStop(0, '#5b6878');
      sky.addColorStop(1, '#a9b4c1');
    } else if (scene === 'dusk') {
      sky.addColorStop(0, '#0d1626');
      sky.addColorStop(0.7, '#2a3e5c');
      sky.addColorStop(1, '#6a7d98');
    } else {
      sky.addColorStop(0, '#020409');
      sky.addColorStop(0.75, '#08111f');
      sky.addColorStop(1, '#13233a');
    }
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);

    // Distant skyline with lit windows
    const sil = scene === 'day' ? '#5c6672' : scene === 'dusk' ? '#0d1522' : '#04070d';
    let x = -20;
    while (x < W + 20) {
      const bw = 30 + rand() * 90;
      const bh = 30 + rand() * (H * 0.22);
      c.fillStyle = sil;
      c.fillRect(x, horizon - bh, bw, bh + 4);
      if (scene !== 'day') {
        for (let wy = horizon - bh + 8; wy < horizon - 6; wy += 9) {
          for (let wx = x + 5; wx < x + bw - 5; wx += 8) {
            if (rand() < 0.16) {
              c.fillStyle = rand() < 0.7 ? 'rgba(170,205,255,0.55)' : 'rgba(255,236,200,0.5)';
              c.fillRect(wx, wy, 3, 4);
            }
          }
        }
      }
      x += bw + rand() * 8;
    }

    // Road
    const road = c.createLinearGradient(0, horizon, 0, H);
    road.addColorStop(0, scene === 'day' ? '#4d5560' : '#070a10');
    road.addColorStop(1, scene === 'day' ? '#2c3138' : '#020305');
    c.fillStyle = road;
    c.beginPath();
    c.moveTo(vx - 6, horizon);
    c.lineTo(vx + 6, horizon);
    c.lineTo(W * 1.4, H);
    c.lineTo(-W * 0.4, H);
    c.closePath();
    c.fill();
    // Verges
    c.fillStyle = scene === 'day' ? '#3b424b' : '#05070b';
    c.beginPath();
    c.moveTo(0, horizon + 4);
    c.lineTo(vx - 6, horizon);
    c.lineTo(-W * 0.4, H);
    c.lineTo(0, H);
    c.fill();
    c.beginPath();
    c.moveTo(W, horizon + 4);
    c.lineTo(vx + 6, horizon);
    c.lineTo(W * 1.4, H);
    c.lineTo(W, H);
    c.fill();
    // Lane markings
    c.strokeStyle = scene === 'day' ? 'rgba(235,240,245,0.75)' : 'rgba(210,225,245,0.5)';
    for (let i = 0; i < 9; i++) {
      const t0 = (i / 9) ** 2;
      const t1 = ((i + 0.45) / 9) ** 2;
      for (const side of [-1, 1]) {
        const ex = vx + side * W * 0.42;
        c.lineWidth = 1 + t1 * 5;
        c.beginPath();
        c.moveTo(vx + (ex - vx) * t0 * 0.55, horizon + (H - horizon) * t0);
        c.lineTo(vx + (ex - vx) * t1 * 0.55, horizon + (H - horizon) * t1);
        c.stroke();
      }
    }

    // Lights: street lamps, traffic ahead, oncoming headlights, signs
    const glow = (gx, gy, r, color, a = 1) => {
      const g = c.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, color.replace('A', a));
      g.addColorStop(0.25, color.replace('A', a * 0.45));
      g.addColorStop(1, color.replace('A', 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(gx, gy, r, 0, Math.PI * 2);
      c.fill();
    };
    c.globalCompositeOperation = 'lighter';
    const dim = scene === 'day' ? 0.25 : scene === 'dusk' ? 0.75 : 1;
    for (let i = 0; i < 7; i++) {
      const t = (i + 1) / 8;
      const lx = vx - (W * 0.62) * t;
      const rx = vx + (W * 0.62) * t;
      const ly = horizon - (H * 0.36) * t;
      const r = 5 + t * 40;
      glow(lx, ly, r, 'rgba(190,220,255,A)', 0.9 * dim);
      glow(rx, ly, r, 'rgba(190,220,255,A)', 0.9 * dim);
      // Wet-road reflections under each lamp
      const rg = c.createLinearGradient(0, horizon, 0, horizon + (H - horizon) * t * 1.2);
      rg.addColorStop(0, `rgba(160,200,255,${0.18 * dim})`);
      rg.addColorStop(1, 'rgba(160,200,255,0)');
      c.fillStyle = rg;
      c.fillRect(lx - r * 0.12, horizon, r * 0.24, (H - horizon) * t * 1.2);
      c.fillRect(rx - r * 0.12, horizon, r * 0.24, (H - horizon) * t * 1.2);
    }
    // Car ahead: tail lights + reflection
    const cx = vx + W * 0.04;
    const cy = horizon + H * 0.09;
    glow(cx - 26, cy, 26, 'rgba(255,50,60,A)', 0.95);
    glow(cx + 26, cy, 26, 'rgba(255,50,60,A)', 0.95);
    c.fillStyle = 'rgba(255,60,70,0.12)';
    c.fillRect(cx - 34, cy + 6, 16, H * 0.25);
    c.fillRect(cx + 18, cy + 6, 16, H * 0.25);
    // Oncoming headlights
    glow(vx - W * 0.12, horizon + H * 0.03, 34, 'rgba(255,250,240,A)', 0.9 * (scene === 'day' ? 0.5 : 1));
    glow(vx - W * 0.09, horizon + H * 0.03, 34, 'rgba(255,250,240,A)', 0.9 * (scene === 'day' ? 0.5 : 1));
    // Distant traffic and signs (bokeh)
    for (let i = 0; i < 22; i++) {
      const bx = vx + (rand() - 0.5) * W * 0.5;
      const by = horizon - rand() * 12 + 4;
      const col = rand() < 0.5 ? 'rgba(255,70,80,A)' : rand() < 0.5 ? 'rgba(255,245,230,A)' : 'rgba(80,160,255,A)';
      glow(bx, by, 4 + rand() * 8, col, 0.8 * dim + 0.2);
    }
    glow(W * 0.82, horizon - H * 0.12, 60, 'rgba(47,140,255,A)', 0.35 * dim + 0.1);
    c.globalCompositeOperation = 'source-over';

    // Blurred copy: downscale then upscale (fast, works everywhere)
    const tiny = makeCanvas((W * dpr) / 14, (H * dpr) / 14);
    const tc = tiny.getContext('2d');
    tc.drawImage(sharp, 0, 0, tiny.width, tiny.height);
    const blur = makeCanvas(W * dpr, H * dpr);
    const bc = blur.getContext('2d');
    bc.imageSmoothingQuality = 'high';
    bc.drawImage(tiny, 0, 0, blur.width, blur.height);
    bc.fillStyle = scene === 'day' ? 'rgba(220,228,236,0.12)' : 'rgba(120,150,190,0.06)';
    bc.fillRect(0, 0, blur.width, blur.height);

    this.sharp = sharp;
    this.blur = blur;
  }

  // ── Loop control ──────────────────────────────────────────────
  _sync() {
    const should = this.wanted && this.visible && !document.hidden && !this.reduce;
    if (should && !this.running) {
      this.running = true;
      this._last = performance.now();
      this._raf = requestAnimationFrame(this._loop);
    } else if (!should && this.running) {
      this.running = false;
      cancelAnimationFrame(this._raf);
    }
    if (!should) this._renderStatic();
  }

  _renderStatic() {
    // A representative still frame: settle the glass for a few simulated seconds
    if (!this._settled || this._settledFor !== JSON.stringify(this.opts)) {
      this.drops = [];
      this.film.fill(0);
      for (let i = 0; i < 90; i++) this._step(1 / 30, true);
      this._settled = true;
      this._settledFor = JSON.stringify(this.opts);
    }
    this._draw();
  }

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this._step(dt, false);
    this._draw();
    this._raf = requestAnimationFrame(this._loop);
  }

  // ── Simulation ────────────────────────────────────────────────
  _wiperAngle(dt, still) {
    const timing = WIPER_TIMING[this.opts.wiper];
    const w = this.wipe;
    w.prevAngle = w.angle;
    if (!timing || still) {
      w.phase = 'rest';
      w.angle = 0;
      return;
    }
    w.t += dt;
    if (w.phase === 'rest') {
      if (w.t >= timing.pause) {
        w.phase = 'sweep';
        w.t = 0;
      }
      w.angle = 0;
    } else {
      const p = Math.min(1, w.t / timing.sweep);
      w.angle = 0.5 - 0.5 * Math.cos(p * Math.PI * 2); // 0 → 1 → 0
      if (p >= 1) {
        w.phase = 'rest';
        w.t = 0;
        w.angle = 0;
      }
    }
  }

  _spawn(n) {
    const { W, H } = this;
    const rain = this.opts.rain;
    for (let i = 0; i < n && this.drops.length < this.maxDrops; i++) {
      const r = (1.6 + Math.random() ** 1.4 * (3 + rain * 4.6)) * (this.q === 'high' ? 1 : 1.15);
      const x = Math.random() * W;
      const y = Math.random() * H * 0.92;
      // Merge with a nearby drop to form larger beads
      const near = this.drops.find((d) => !d.sliding && Math.abs(d.x - x) < d.r + r && Math.abs(d.y - y) < d.r + r);
      if (near) {
        near.r = Math.min(9, Math.sqrt(near.r * near.r + r * r));
        continue;
      }
      this.drops.push({ x, y, r, vx: 0, vy: 0, sliding: false, life: 0 });
    }
  }

  _step(dt, still) {
    const { opts } = this;
    const rain = opts.rain;
    this.time += dt;

    // Rain builds the water film (far less with repellent: water beads instead of sheeting).
    // A gentle drain stops it saturating, and clears dry glass.
    const film = this.film;
    const grain = this.grain;
    const build = rain * dt * (opts.repellent ? 0.035 : 0.3);
    const drain = dt * (rain > 0 ? 0.035 : 0.3);
    for (let i = 0; i < film.length; i++) {
      const f = film[i] + build * grain[i] * (1 - film[i]) - drain * film[i];
      film[i] = f < 0 ? 0 : f > 1 ? 1 : f;
    }

    // New drops
    const rate = rain * rain * (this.q === 'high' ? 260 : 120);
    this._spawn(Math.floor(rate * dt + Math.random()));

    // Drop dynamics
    const slideAt = opts.repellent ? 2.4 : 5.2;
    for (const d of this.drops) {
      d.life += dt;
      if (!d.sliding && d.r > slideAt) d.sliding = true;
      if (d.sliding) {
        if (opts.repellent) {
          // At speed, beads are blown up and across the glass
          d.vx += (40 + d.r * 10) * dt;
          d.vy -= (90 + d.r * 25) * dt;
        } else {
          d.vy += (30 + d.r * 14) * dt;
        }
        const ox = d.x;
        const oy = d.y;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        // A running drop wipes a clean trail through the film
        const s = this.mScale;
        const steps = Math.max(1, Math.ceil(Math.hypot(d.x - ox, d.y - oy) * s));
        for (let k = 0; k <= steps; k++) {
          const gx = Math.floor((ox + ((d.x - ox) * k) / steps) * s);
          const gy = Math.floor((oy + ((d.y - oy) * k) / steps) * s);
          if (gx >= 0 && gy >= 0 && gx < this.mw && gy < this.mh) film[gy * this.mw + gx] *= 0.35;
        }
        if (!opts.repellent && Math.random() < dt * 3 && d.r > 3) {
          d.r *= 0.96;
          this.drops.push({ x: ox, y: oy, r: 0.9 + Math.random() * 0.8, vx: 0, vy: 0, sliding: false, life: 0 });
        }
      }
    }
    this.drops = this.drops.filter((d) => d.y < this.H + 20 && d.y > -20 && d.x < this.W + 20 && d.r > 0.5);

    // Wipers
    this._wiperAngle(dt, still);
    if (this.wipe.angle !== this.wipe.prevAngle) this._clearSwept();

    // Fog sits outside the glass: no simulation, just density
  }

  _bladeAngle(wp, a) {
    return ((wp.rest - wp.span * a) * Math.PI) / 180;
  }

  _clearSwept() {
    const film = this.film;
    this.wipers.forEach((wp, i) => {
      const a0 = this._bladeAngle(wp, this.wipe.prevAngle);
      const a1 = this._bladeAngle(wp, this.wipe.angle);
      const lo = Math.min(a0, a1) - 0.02;
      const hi = Math.max(a0, a1) + 0.02;
      const r1 = wp.len * 0.32;
      const r2 = wp.len;
      const streaks = this.streaks[i];
      const { dist, ang } = this.polar[i];
      for (let c = 0; c < film.length; c++) {
        const dd = dist[c];
        if (dd < r1 || dd > r2) continue;
        const a = ang[c];
        if (a < lo || a > hi) continue;
        // Worn rubber leaves thin wet arcs behind
        film[c] = streaks.some((sr) => Math.abs(dd - sr) < 6) ? Math.max(film[c], 0.75) : 0;
      }
      // Remove drops inside the swept sector (except along worn streaks)
      this.drops = this.drops.filter((d) => {
        const dx = d.x - wp.px;
        const dy = wp.py - d.y;
        const dd = Math.hypot(dx, dy);
        if (dd < r1 || dd > r2) return true;
        const a = Math.atan2(dy, dx);
        if (a < lo || a > hi) return true;
        return streaks.some((sr) => Math.abs(dd - sr) < 4);
      });
    });
  }

  // ── Drawing ───────────────────────────────────────────────────
  _draw() {
    const { ctx, W, H, opts } = this;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(this.sharp, 0, 0, W, H);

    // Water film: blurred scene where the glass is wet
    const px = this.maskImg.data;
    const film = this.film;
    for (let i = 0, j = 3; i < film.length; i++, j += 4) px[j] = film[i] * 242;
    this.mctx.putImageData(this.maskImg, 0, 0);
    const wc = this.wctx;
    wc.globalCompositeOperation = 'source-over';
    wc.clearRect(0, 0, W, H);
    wc.drawImage(this.blur, 0, 0, W, H);
    wc.globalCompositeOperation = 'destination-in';
    wc.imageSmoothingEnabled = true;
    wc.drawImage(this.mask, 0, 0, W, H);
    wc.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.wet, 0, 0, W, H);

    // Fog: soft haze and lost detail
    if (opts.fog > 0) {
      ctx.globalAlpha = Math.min(1, opts.fog * 0.9);
      ctx.drawImage(this.blur, 0, 0, W, H);
      ctx.globalAlpha = 1;
      const fg = ctx.createLinearGradient(0, 0, 0, H);
      const tint = opts.scene === 'day' ? '215,222,230' : '150,165,185';
      fg.addColorStop(0, `rgba(${tint},${opts.fog * 0.55})`);
      fg.addColorStop(0.55, `rgba(${tint},${opts.fog * 0.42})`);
      fg.addColorStop(1, `rgba(${tint},${opts.fog * 0.2})`);
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, W, H);
    }

    this._drawDrops();
    if (opts.wiper !== 'off' || opts.cockpit) this._drawWipers();
    if (opts.cockpit) this._drawCockpit();

    const now = performance.now();
    if (now - this.lastStats > 450 || !this.running) {
      this.lastStats = now;
      this._emitStats();
    }
  }

  _drawDrops() {
    const { ctx } = this;
    const src = this.sharp;
    const sx = src.width / this.W;
    for (const d of this.drops) {
      const r = d.r;
      if (r < 1.6) {
        ctx.fillStyle = 'rgba(220,235,255,0.45)';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 0.9, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      const ry = d.sliding && !this.opts.repellent ? r * 1.25 : r;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, r, ry, 0, 0, Math.PI * 2);
      ctx.clip();
      // Lens: a wider patch of the scene, flipped, squeezed into the drop
      const span = r * 9;
      ctx.translate(d.x, d.y);
      ctx.scale(1, -1);
      ctx.drawImage(src, (d.x - span) * sx, (d.y - span) * sx, span * 2 * sx, span * 2 * sx, -r, -ry, r * 2, ry * 2);
      // A drop gathers light: lift it slightly so it reads as water
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(120,160,215,0.14)';
      ctx.fillRect(-r, -ry, r * 2, ry * 2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
      // Rim and highlight
      ctx.lineWidth = Math.max(0.6, r * 0.16);
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + r * 0.06, r * 0.94, ry * 0.94, 0, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(d.x - r * 0.3, d.y - ry * 0.36, r * 0.26, r * 0.18, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawWipers() {
    const { ctx } = this;
    this.wipers.forEach((wp) => {
      const a = this._bladeAngle(wp, this.wipe.angle);
      const ux = Math.cos(a);
      const uy = -Math.sin(a);
      const r1 = wp.len * 0.3;
      const r2 = wp.len * 1.01;
      const tipX = wp.px + ux * wp.len * 0.98;
      const tipY = wp.py + uy * wp.len * 0.98;
      const midX = wp.px + ux * wp.len * 0.62;
      const midY = wp.py + uy * wp.len * 0.62;
      const nx = -uy;
      const ny = ux;

      ctx.lineCap = 'round';
      // Arm: dark metal with a fine silver edge
      ctx.strokeStyle = '#0b0d11';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(wp.px, wp.py);
      ctx.lineTo(midX + nx * 10, midY + ny * 10);
      ctx.lineTo(tipX + nx * 6, tipY + ny * 6);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(195,202,213,0.45)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // Blade: beam blade with spoiler
      ctx.strokeStyle = '#07080b';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(wp.px + ux * r1, wp.py + uy * r1);
      ctx.lineTo(wp.px + ux * r2, wp.py + uy * r2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(143,208,255,0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(wp.px + ux * r1 + nx * 3.6, wp.py + uy * r1 + ny * 3.6);
      ctx.lineTo(wp.px + ux * r2 + nx * 3.6, wp.py + uy * r2 + ny * 3.6);
      ctx.stroke();
    });
  }

  _drawCockpit() {
    const { ctx, W, H } = this;
    // Glass reflection: soft diagonal sheen
    const sheen = ctx.createLinearGradient(0, 0, W, H);
    sheen.addColorStop(0, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.42, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.5, 'rgba(200,225,255,0.05)');
    sheen.addColorStop(0.58, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, W, H);
    // A-pillars
    ctx.fillStyle = '#030406';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W * 0.07, 0);
    ctx.lineTo(W * 0.015, H);
    ctx.lineTo(0, H);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W, 0);
    ctx.lineTo(W * 0.93, 0);
    ctx.lineTo(W * 0.985, H);
    ctx.lineTo(W, H);
    ctx.fill();
    // Headliner
    const top = ctx.createLinearGradient(0, 0, 0, H * 0.08);
    top.addColorStop(0, '#030406');
    top.addColorStop(1, 'rgba(3,4,6,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, H * 0.08);
    // Dashboard with a fine silver edge and an ambient blue line
    const dashY = H * 0.9;
    ctx.fillStyle = '#040507';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, dashY + 10);
    ctx.quadraticCurveTo(W * 0.5, dashY - 28, W, dashY + 10);
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.strokeStyle = 'rgba(195,202,213,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, dashY + 10);
    ctx.quadraticCurveTo(W * 0.5, dashY - 28, W, dashY + 10);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(47,140,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(W * 0.2, dashY + 6);
    ctx.quadraticCurveTo(W * 0.5, dashY - 20, W * 0.8, dashY + 6);
    ctx.stroke();
    // Faint dashboard reflection on the glass
    const refl = ctx.createLinearGradient(0, dashY - H * 0.16, 0, dashY);
    refl.addColorStop(0, 'rgba(47,140,255,0)');
    refl.addColorStop(1, 'rgba(47,140,255,0.06)');
    ctx.fillStyle = refl;
    ctx.fillRect(0, dashY - H * 0.16, W, H * 0.16);
  }

  _emitStats() {
    if (!this.listeners.size) return;
    let sum = 0;
    for (let i = 0; i < this.film.length; i++) sum += this.film[i];
    const film = sum / this.film.length;
    const dropArea = this.drops.reduce((a, d) => a + Math.PI * d.r * d.r, 0) / (this.W * this.H);
    const clarity = Math.max(0, Math.min(1, 1 - film * 0.75 - dropArea * 6 - this.opts.fog * 0.7));
    const label = clarity > 0.72 ? 'Clear' : clarity > 0.45 ? 'Reduced' : 'Poor';
    const stats = { clarity, label, film, drops: this.drops.length, wiping: this.wipe.phase === 'sweep' };
    this.listeners.forEach((fn) => fn(stats));
  }
}
