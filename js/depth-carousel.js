/* ==========================================================================
   DepthCarousel – plain JavaScript (no libraries)
   Usage:  <div class="depth-carousel" data-depth-carousel> <img src alt> … </div>
   Options can be set with data-* attributes, e.g. data-autoplay="true",
   data-depth="220", data-tilt-direction="left" (see DEFAULTS below).
   ========================================================================== */
(function () {
  'use strict';

 var DEFAULTS = {
  cardWidth: 590,
  cardHeight: 490,
  radius: 20,
  tint: '#05060a',
  depth: 260,
  spread: 115,
  tilt: 22,
  tiltDirection: 'right',
  perspective: 1600,
  visibleCards: 4,
  falloff: 0.2,
  blur: 6,
  duration: 700,
  autoplay: false,
  autoplayDelay: 3200,
  loop: true,
  showControls: true,
  showIndicators: true
};

  var clamp = function (v, min, max) { return Math.min(Math.max(v, min), max); };
  var mod = function (v, n) { return ((v % n) + n) % n; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); }; /* = power3.out */
  var reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');

  function readOptions(el) {
    var o = {}, k;
    for (k in DEFAULTS) {
      var raw = el.getAttribute('data-' + k.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); }));
      var def = DEFAULTS[k];
      if (raw === null) { o[k] = def; continue; }
      if (typeof def === 'boolean') o[k] = raw === 'true' || raw === '';
      else if (typeof def === 'number') o[k] = parseFloat(raw);
      else o[k] = raw;
    }
    return o;
  }

  function DepthCarousel(root, options) {
    this.root = root;
    this.o = Object.assign({}, DEFAULTS, readOptions(root), options || {});
    this.items = Array.prototype.map.call(root.querySelectorAll('img'), function (img) {
      return { image: img.getAttribute('src'), alt: img.getAttribute('alt') || '' };
    });
    this.count = this.items.length;
    this.pos = 0;
    this.focus = 0;
    this.scale = 1;
    this.raf = null;
    this.drag = null;
    this.justDragged = false;
    this.wheelTimer = null;
    this.autoTimer = null;
    if (!this.count) return;
    this.build();
    this.bind();
    this.layout(0);
  }

  DepthCarousel.prototype.build = function () {
    var self = this, o = this.o, root = this.root;
    root.innerHTML = '';
    root.classList.add('depth-carousel');
    root.style.setProperty('--dc-perspective', o.perspective + 'px');
    root.setAttribute('role', 'group');
    root.setAttribute('aria-roledescription', 'carousel');
    if (!root.getAttribute('aria-label')) root.setAttribute('aria-label', 'Depth carousel');
    root.tabIndex = 0;

    var stage = document.createElement('div');
    stage.className = 'depth-carousel__stage';
    this.cards = []; this.tints = [];
    this.items.forEach(function (item, i) {
      var card = document.createElement('div');
      card.className = 'depth-carousel__card';
      card.style.width = o.cardWidth + 'px';
      card.style.height = o.cardHeight + 'px';
      card.style.borderRadius = o.radius + 'px';
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', (i + 1) + ' of ' + self.count);
      card.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');

      var img = document.createElement('img');
      img.className = 'depth-carousel__img';
      img.src = item.image; img.alt = item.alt; img.draggable = false;
      if (i > 0) img.loading = 'lazy';
      var tint = document.createElement('span');
      tint.className = 'depth-carousel__tint';
      tint.style.background = o.tint;
      card.appendChild(img); card.appendChild(tint);
      card.addEventListener('click', function () {
        if (self.justDragged) return;
        self.setFocus(i, true);
      });
      stage.appendChild(card);
      self.cards.push(card); self.tints.push(tint);
    });
    root.appendChild(stage);

    if (o.showControls && this.count > 1) {
      var mk = function (dir, label, d) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'depth-carousel__arrow depth-carousel__arrow--' + dir;
        b.setAttribute('aria-label', label);
        b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        b.addEventListener('click', function () { self.navigateBy(dir === 'prev' ? -1 : 1); });
        root.appendChild(b);
      };
      mk('prev', 'Previous slide', 'M15 5l-7 7 7 7');
      mk('next', 'Next slide', 'M9 5l7 7-7 7');
    }

    this.dots = [];
    if (o.showIndicators && this.count > 1) {
      var wrap = document.createElement('div');
      wrap.className = 'depth-carousel__dots';
      wrap.setAttribute('role', 'tablist');
      wrap.setAttribute('aria-label', 'Slides');
      this.items.forEach(function (_, i) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'depth-carousel__dot' + (i === 0 ? ' is-active' : '');
        d.setAttribute('role', 'tab');
        d.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        d.addEventListener('click', function () { self.setFocus(i, true); });
        wrap.appendChild(d);
        self.dots.push(d);
      });
      root.appendChild(wrap);
    }
  };

  DepthCarousel.prototype.layout = function (pos) {
    var o = this.o, n = this.count;
    var dir = o.tiltDirection === 'left' ? -1 : 1;
    for (var i = 0; i < n; i++) {
      var el = this.cards[i];
      var d = i - pos;
      if (o.loop && n > 1) {
        d = mod(d, n);
        if (d > n / 2) d -= n;
      }
      var back = Math.max(0, d);
      var shown = Math.abs(d) <= o.visibleCards + 0.5;
      var tz = -o.depth * d;
      var tx = dir * o.spread * d;
      var ry = dir * o.tilt * clamp(d, 0, 1);
      var opacity = d < 0 ? Math.max(0, 1 + d) : 1;
      if (!shown) opacity = 0;
      var brightness = Math.max(0.15, 1 - back * o.falloff);
      var blurPx = o.blur > 0 ? Math.min(o.blur, (back / Math.max(1, o.visibleCards)) * o.blur) : 0;

      el.style.transform = 'translate(-50%, -50%) scale(' + this.scale + ') translateX(' + tx.toFixed(2) + 'px) translateZ(' + tz.toFixed(2) + 'px) rotateY(' + ry.toFixed(3) + 'deg)';
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = 'brightness(' + brightness.toFixed(3) + ') blur(' + blurPx.toFixed(2) + 'px)';
      el.style.zIndex = String(Math.round(2000 - d * 20));
      el.style.pointerEvents = shown && opacity > 0.05 ? 'auto' : 'none';
      this.tints[i].style.opacity = clamp(back * o.falloff * 1.25, 0, 0.86).toFixed(3);
    }
  };

  DepthCarousel.prototype.cancelTween = function () {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  };

  DepthCarousel.prototype.tweenTo = function (target, animate) {
    var self = this;
    this.cancelTween();
    var from = this.pos;
    var dur = animate && !reducedMq.matches ? this.o.duration : 0;
    var done = function () {
      self.pos = mod(self.pos, self.count);
      self.layout(self.pos);
      self.raf = null;
    };
    if (!dur) { this.pos = target; done(); return; }
    var t0 = performance.now();
    (function step(now) {
      var t = clamp((now - t0) / dur, 0, 1);
      self.pos = from + (target - from) * easeOut(t);
      self.layout(self.pos);
      if (t < 1) self.raf = requestAnimationFrame(step); else done();
    })(t0);
  };

  DepthCarousel.prototype.setFocus = function (raw, animate) {
    var o = this.o, n = this.count;
    var idx = o.loop ? mod(raw, n) : clamp(raw, 0, n - 1);
    var delta = idx - this.pos;
    if (o.loop && n > 1) {
      delta = mod(delta, n);
      if (delta > n / 2) delta -= n;
    }
    this.tweenTo(this.pos + delta, animate !== false);
    if (idx !== this.focus) {
      this.focus = idx;
      this.updateActive();
      this.root.dispatchEvent(new CustomEvent('depthcarousel:change', { detail: { index: idx, item: this.items[idx] } }));
    }
  };

  DepthCarousel.prototype.updateActive = function () {
    var a = this.focus;
    this.cards.forEach(function (c, i) { c.setAttribute('aria-hidden', i === a ? 'false' : 'true'); });
    this.dots.forEach(function (d, i) {
      d.classList.toggle('is-active', i === a);
      d.setAttribute('aria-selected', i === a ? 'true' : 'false');
    });
  };

  DepthCarousel.prototype.navigateBy = function (step) { this.setFocus(this.focus + step, true); };

  DepthCarousel.prototype.stepPx = function () {
    return Math.max(this.o.cardWidth * 0.55 * this.scale, 40);
  };

  DepthCarousel.prototype.bind = function () {
    var self = this, o = this.o, root = this.root;

    /* responsive scale */
    var resize = function () {
      var w = root.clientWidth;
      var needed = o.cardWidth + Math.abs(o.spread) * 2 + 120;
      self.scale = clamp(w / needed, 0.4, 1);
      self.layout(self.pos);
    };
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(root);
    else window.addEventListener('resize', resize);
    resize();

    /* trackpad / horizontal wheel (vertical scrolling is left to the page) */
    root.addEventListener('wheel', function (e) {
      if (self.count < 2) return;
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      self.cancelTween();
      var delta = e.deltaMode === 1 ? e.deltaX * 24 : e.deltaX;
      self.pos += clamp(delta / (o.cardWidth * 0.9), -0.6, 0.6);
      self.layout(self.pos);
      clearTimeout(self.wheelTimer);
      self.wheelTimer = setTimeout(function () { self.setFocus(Math.round(self.pos), true); }, 130);
    }, { passive: false });

    /* drag / swipe */
    root.addEventListener('pointerdown', function (e) {
      if (self.count < 2 || (e.button !== undefined && e.button > 0)) return;
      if (e.target.closest('button')) return;
      self.cancelTween();
      self.drag = { x: e.clientX, startPos: self.pos, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false, id: e.pointerId };
    });
    root.addEventListener('pointermove', function (e) {
      var d = self.drag;
      if (!d) return;
      var dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 4) {
        d.moved = true;
        try { root.setPointerCapture(d.id); } catch (err) {}
      }
      if (!d.moved) return;
      var now = performance.now();
      d.v = (e.clientX - d.lastX) / Math.max(now - d.lastT, 1);
      d.lastX = e.clientX; d.lastT = now;
      self.pos = d.startPos - dx / self.stepPx();
      self.layout(self.pos);
    });
    var end = function () {
      var d = self.drag;
      if (!d) return;
      self.drag = null;
      if (!d.moved) return;
      self.justDragged = true;
      setTimeout(function () { self.justDragged = false; }, 0);
      self.setFocus(Math.round(self.pos - (d.v * 180) / self.stepPx()), true);
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);

    /* keyboard */
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); self.navigateBy(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); self.navigateBy(1); }
    });

    /* autoplay (pauses on hover / focus / when off-screen / reduced motion) */
    if (o.autoplay && this.count > 1 && !reducedMq.matches) {
      var hovered = false, focused = false, visible = true;
      root.addEventListener('mouseenter', function () { hovered = true; });
      root.addEventListener('mouseleave', function () { hovered = false; });
      root.addEventListener('focusin', function () { focused = true; });
      root.addEventListener('focusout', function () { focused = false; });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(root);
      }
      this.autoTimer = setInterval(function () {
        if (!hovered && !focused && visible && !self.drag) self.navigateBy(1);
      }, Math.max(o.autoplayDelay, 600));
    }
  };

  window.DepthCarousel = DepthCarousel;

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-depth-carousel]').forEach(function (el) {
      el._depthCarousel = new DepthCarousel(el);
    });
  });
})();
