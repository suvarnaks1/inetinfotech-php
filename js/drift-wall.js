/* ==========================================================================
   DriftWall – plain JavaScript (no libraries)
   Usage:  <div class="drift-wall" data-drift-wall>
             <img src="…" alt="Title" [data-href="url"] [data-fit="contain"]>
             …
           </div>
   Options via data-* attributes (see DEFAULTS), e.g. data-columns="5".
   ========================================================================== */
(function () {
  'use strict';

  var DEFAULTS = {
    columns: 5,
    tileWidth: 200,
    tileHeight: 132,
    gap: 18,
    radius: 14,
    tilt: 16,
    turn: -14,
    roll: 0,
    perspective: 1200,
    depth: 120,
    speed: 42,
    direction: 'up',
    variance: 0.45,
    parallax: 0.6,
    pauseOnHover: false,
    lift: 64,
    fade: 0.6,
    dim: 0.55,
    grayscale: false,
    overlayColor: '#060010'
  };

  var reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };

  function readOptions(el) {
    var o = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      var raw = el.getAttribute('data-' + k.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); }));
      var def = DEFAULTS[k];
      if (raw === null) o[k] = def;
      else if (typeof def === 'boolean') o[k] = raw === 'true' || raw === '';
      else if (typeof def === 'number') o[k] = parseFloat(raw);
      else o[k] = raw;
    });
    return o;
  }

  var columnFactor = function (index, variance) {
    var pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
    return 1 + variance * pseudo;
  };

  function DriftWall(root, options) {
    this.root = root;
    this.o = Object.assign({}, DEFAULTS, readOptions(root), options || {});
    this.items = Array.prototype.map.call(root.querySelectorAll('img'), function (img) {
      return {
        image: img.getAttribute('src'),
        title: img.getAttribute('alt') || '',
        href: img.getAttribute('data-href') || '',
        fit: img.getAttribute('data-fit') || '',
        pos: img.getAttribute('data-pos') || ''
      };
    });
    if (!this.items.length) return;

    this.reduced = reducedMq.matches;
    this.pointer = { x: 0, y: 0 };
    this.damped = { x: 0, y: 0 };
    this.hoveredCol = -1;
    this.wallHovered = false;
    this.activeEl = null;
    this.lastTs = null;
    this.raf = null;
    this.visible = true;
    this.sig = '';

    root.classList.add('drift-wall');
    root.setAttribute('role', 'group');
    if (!root.getAttribute('aria-label')) root.setAttribute('aria-label', 'Drifting wall of tiles');
    root.innerHTML = '';
    this.plane = document.createElement('div');
    this.plane.className = 'drift-wall__plane';
    root.appendChild(this.plane);

    this.rebuild();
    this.bind();
    this.start();
  }

  /* size everything from the container width so it stays responsive */
  DriftWall.prototype.metrics = function () {
    var o = this.o, w = this.root.clientWidth || 800, h = this.root.clientHeight || 600;
    var s = clamp(w / 1000, 0.55, 1);
    var cols = o.columns;
    if (w < 560) cols = Math.min(cols, 3);
    else if (w < 820) cols = Math.min(cols, 4);
    return {
      w: w, h: h, cols: cols,
      tw: Math.round(o.tileWidth * s), th: Math.round(o.tileHeight * s),
      gap: Math.round(o.gap * s), lift: Math.round(o.lift * s)
    };
  };

  DriftWall.prototype.rebuild = function () {
    var o = this.o, m = this.metrics();
    var sig = [m.cols, m.tw, m.th, m.gap, Math.round(m.h / 40)].join('|');
    if (sig === this.sig) return;
    this.sig = sig;
    this.m = m;

    var root = this.root;
    root.style.setProperty('--dw-tile-w', m.tw + 'px');
    root.style.setProperty('--dw-tile-h', m.th + 'px');
    root.style.setProperty('--dw-gap', m.gap + 'px');
    root.style.setProperty('--dw-radius', o.radius + 'px');
    root.style.setProperty('--dw-perspective', o.perspective + 'px');
    root.style.setProperty('--dw-lift', m.lift + 'px');
    root.style.setProperty('--dw-dim', o.dim);
    root.style.setProperty('--dw-gray', o.grayscale ? 1 : 0);
    root.style.setProperty('--dw-overlay', o.overlayColor);
    root.style.setProperty('--dw-edge', Math.max(0, (1 - o.fade) * 100) + '%');

    /* distribute items into columns */
    var cols = [], i;
    for (i = 0; i < m.cols; i++) cols.push([]);
    this.items.forEach(function (it, idx) { cols[idx % m.cols].push(it); });
    cols = cols.map(function (c) { return c.length ? c : [this.items[0]]; }, this);

    var unit = m.th + m.gap;
    this.meta = cols.map(function (col) {
      var copyHeight = Math.max(unit, col.length * unit);
      return { copyHeight: copyHeight, copies: Math.max(2, Math.ceil((m.h * 1.6) / copyHeight) + 1) };
    });

    var dirSign = o.direction === 'up' ? 1 : -1;
    this.base = cols.map(function (_, c) {
      return o.speed * columnFactor(c, o.variance) * dirSign * (c % 2 === 0 ? 1 : -1);
    });
    this.offsets = this.meta.map(function (meta, c) { return meta.copyHeight * ((c * 0.37) % 1); });
    this.vel = cols.map(function () { return 0; });

    /* DOM */
    this.plane.innerHTML = '';
    this.tracks = [];
    this.activeEl = null;
    var self = this;
    cols.forEach(function (col, c) {
      var colEl = document.createElement('div');
      colEl.className = 'drift-wall__col';
      var track = document.createElement('div');
      track.className = 'drift-wall__track';
      for (var copy = 0; copy < self.meta[c].copies; copy++) {
        col.forEach(function (item) { track.appendChild(self.makeTile(item, c, copy === 0)); });
      }
      colEl.appendChild(track);
      self.plane.appendChild(colEl);
      self.tracks.push(track);
    });
    this.applyTransforms();
  };

  DriftWall.prototype.makeTile = function (item, col, primary) {
    var self = this;
    var tile;
    if (item.href) {
      tile = document.createElement('a');
      tile.href = item.href;
      tile.target = '_blank';
      tile.rel = 'noreferrer noopener';
    } else {
      tile = document.createElement('div');
      if (primary) { tile.setAttribute('role', 'button'); }
    }
    tile.className = 'drift-wall__tile';
    tile.setAttribute('data-col', col);
    if (primary) {
      tile.tabIndex = 0;
      if (!item.href) tile.setAttribute('aria-label', item.title || 'tile');
      tile.addEventListener('focus', function () { self.activate(tile); });
      tile.addEventListener('blur', function () { self.release(); });
    } else {
      /* repeated copies exist only for the endless loop – hide from keyboard/AT */
      tile.tabIndex = -1;
      tile.setAttribute('aria-hidden', 'true');
    }

    var inner = document.createElement('span');
    inner.className = 'drift-wall__inner';
    var img = document.createElement('img');
    img.src = item.image;
    img.alt = primary ? item.title : '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    if (item.fit === 'contain') {
      img.style.objectFit = 'contain';
      inner.style.background = '#fff';
    }
    if (item.pos) img.style.objectPosition = item.pos;
    var ov = document.createElement('span');
    ov.className = 'drift-wall__overlay';
    ov.setAttribute('aria-hidden', 'true');
    inner.appendChild(img); inner.appendChild(ov);
    tile.appendChild(inner);
    return tile;
  };

  DriftWall.prototype.activate = function (tile) {
    if (this.activeEl === tile) return;
    if (this.activeEl) this.activeEl.classList.remove('is-active');
    this.activeEl = tile;
    tile.classList.add('is-active');
    this.hoveredCol = Number(tile.getAttribute('data-col'));
  };

  DriftWall.prototype.release = function () {
    if (this.activeEl) this.activeEl.classList.remove('is-active');
    this.activeEl = null;
    this.hoveredCol = -1;
  };

  DriftWall.prototype.applyPlane = function (px, py) {
    var o = this.o;
    this.plane.style.transform =
      'translate(-50%, -50%) scale(1.18) ' +
      'rotateX(' + (o.tilt + py) + 'deg) rotateY(' + (o.turn + px) + 'deg) rotateZ(' + o.roll + 'deg) ' +
      'translateZ(' + (-o.depth) + 'px)';
  };

  DriftWall.prototype.applyTransforms = function () {
    this.applyPlane(this.damped.x, this.damped.y);
    for (var c = 0; c < this.tracks.length; c++) {
      this.tracks[c].style.transform = 'translate3d(0,' + (-(this.offsets[c] || 0)) + 'px,0)';
    }
  };

  DriftWall.prototype.frame = function (ts) {
    var o = this.o;
    if (this.lastTs === null) this.lastTs = ts;
    var dt = Math.min(0.05, Math.max(0, ts - this.lastTs) / 1000);
    this.lastTs = ts;

    var maxTilt = o.parallax * 8;
    var damp = 1 - Math.exp(-dt / 0.12);
    this.damped.x += (this.pointer.x * maxTilt - this.damped.x) * damp;
    this.damped.y += (-this.pointer.y * maxTilt - this.damped.y) * damp;
    this.applyPlane(this.damped.x, this.damped.y);

    if (!this.reduced) {
      for (var c = 0; c < this.tracks.length; c++) {
        var meta = this.meta[c];
        var paused = this.wallHovered && o.pauseOnHover;
        var factor = paused || this.hoveredCol === c ? 0 : 1;
        var target = this.base[c] * factor;
        var ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
        this.vel[c] += (target - this.vel[c]) * ease;
        var next = this.offsets[c] + this.vel[c] * dt;
        next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
        this.offsets[c] = next;
        this.tracks[c].style.transform = 'translate3d(0,' + (-next) + 'px,0)';
      }
    }
  };

  DriftWall.prototype.start = function () {
    var self = this;
    if (this.raf) return;
    var loop = function (ts) {
      self.frame(ts);
      self.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  };

  DriftWall.prototype.stop = function () {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.lastTs = null;
  };

  DriftWall.prototype.hit = function (e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    var tile = el && el.closest ? el.closest('.drift-wall__tile') : null;
    if (tile && this.root.contains(tile)) this.activate(tile);
  };

  DriftWall.prototype.bind = function () {
    var self = this, root = this.root, o = this.o;

    root.addEventListener('pointerenter', function () { self.wallHovered = true; });
    root.addEventListener('pointermove', function (e) {
      var r = root.getBoundingClientRect();
      if (o.parallax > 0 && !self.reduced && e.pointerType !== 'touch') {
        self.pointer = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 };
      }
      self.hit(e);
    });
    root.addEventListener('pointerdown', function (e) { self.hit(e); }); /* tap on touch screens */
    root.addEventListener('pointerleave', function () {
      self.wallHovered = false;
      self.pointer = { x: 0, y: 0 };
      self.release();
    });

    /* keep responsive */
    var onResize = function () { self.rebuild(); };
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(root);
    else window.addEventListener('resize', onResize);

    /* only animate while on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        self.visible = es[0].isIntersecting;
        if (self.visible && !document.hidden) self.start(); else self.stop();
      }).observe(root);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) self.stop(); else if (self.visible) self.start();
    });

    var onMq = function (e) {
      self.reduced = e.matches;
      root.classList.toggle('drift-wall--reduced', e.matches);
    };
    if (reducedMq.addEventListener) reducedMq.addEventListener('change', onMq);
    root.classList.toggle('drift-wall--reduced', this.reduced);
  };

  window.DriftWall = DriftWall;

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-drift-wall]').forEach(function (el) {
      el._driftWall = new DriftWall(el);
    });
  });
})();
