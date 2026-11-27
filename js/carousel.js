/* ==========================================================================
   Carousel – plain JavaScript, no libraries.
   Spring-physics carousel with drag/swipe, keyboard, autoplay and 5 effects.

   Carousel.mount(element, items, options) -> { goTo(i), step(dir), destroy() }

   item (object): { image, alt, icon, title, description, quote, by, role, url, html }
        icon = Font Awesome class      url  = makes the whole card a link
        quote/by/role = testimonial card   html = your own markup (trusted)
        a plain string is treated as an image URL
   options:
        effect        'tilt' | 'slide' | 'scale' | 'fade' | 'cube'   (default 'tilt')
        baseWidth     number (px, max width) or any CSS width, e.g. '100%'   (default 300)
        maxCardWidth  px cap for one card; the extra room shows neighbouring cards (0 = off)
        aspectRatio   card width / height (default 1.25)      minHeight  px floor for card height
        peek          px of the next/previous card to show     gap        px between cards
        radius        card corner radius                       frame      draw the glass frame (default true)
        indicator     'dots' | 'bars' | 'counter' | 'none'     arrows     show prev/next buttons
        autoplay, autoplayDelay (ms), pauseOnHover, loop, draggable, round, initialIndex
        theme         'light' | 'dark'                          label      aria-label for the region
        onChange(index)
   ========================================================================== */
(function () {
  'use strict';

  var EFFECTS = ['tilt', 'slide', 'scale', 'fade', 'cube'];
  var STIFFNESS = 150, DAMPING = 24;
  var DEFAULTS = {
    effect: 'tilt', baseWidth: 300, maxCardWidth: 0, aspectRatio: 1.25, minHeight: 0, peek: 0, gap: 16, radius: 12,
    frame: true, indicator: 'dots', arrows: false, autoplay: false, autoplayDelay: 3000, pauseOnHover: false,
    loop: false, draggable: true, round: false, initialIndex: 0, theme: 'light', label: 'Carousel', onChange: null
  };

  var clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };
  var wrap = function (v, n) { return ((v % n) + n) % n; };
  var nearest = function (offset, n) { return wrap(offset + n / 2, n) - n / 2; };
  var smoother = function (t) { return t * t * t * (t * (t * 6 - 15) + 10); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* fade the peeking neighbours into the page instead of a hard crop */
  function edgeMask(size) {
    var pts = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map(function (t) { return [smoother(t).toFixed(3), (t * size).toFixed(1)]; });
    var left = pts.map(function (p) { return 'rgba(0,0,0,' + p[0] + ') ' + p[1] + 'px'; });
    var right = pts.slice().reverse().map(function (p) { return 'rgba(0,0,0,' + p[0] + ') calc(100% - ' + p[1] + 'px)'; });
    return 'linear-gradient(to right,' + left.concat(right).join(',') + ')';
  }

  /* rubber-band when dragged past either end */
  function band(v, max) {
    if (v < 0) return -0.3 * (1 - Math.exp(v / 0.55));
    if (v > max) return max + 0.3 * (1 - Math.exp((max - v) / 0.55));
    return v;
  }

  /* where one card sits for a given (fractional) position */
  function pose(index, position, s) {
    var offset = s.loop ? nearest(index - position, s.count) : index - position;
    var distance = Math.abs(offset), near = Math.min(distance, 1);
    var r = { transform: 'none', opacity: 1, visible: true, layer: 10 - Math.min(9, Math.round(distance * 2)), shade: 0, focus: 1 };
    if (s.mode === 'fade') {
      var half = Math.min(1, near * 2);
      r.visible = distance < 1;
      r.opacity = 1 - near * near * (3 - 2 * near);
      r.transform = 'scale(' + (1 - 0.04 * near) + ')';
      r.focus = 1 - half * half * (3 - 2 * half);
      return r;
    }
    if (s.mode === 'cube') {
      var h = s.cardWidth / 2, turn = Math.sin(Math.PI * (position - Math.floor(position)));
      r.visible = distance < 1;
      r.transform = 'scale(' + (1 - 0.12 * turn) + ') translateZ(' + (-h) + 'px) rotateY(' + (clamp(offset, -1, 1) * 90) + 'deg) translateZ(' + h + 'px)';
      r.shade = near * s.shade;
      return r;
    }
    var x = offset * s.span;
    r.visible = x > -(s.inset + s.cardWidth + 2) && x < s.width + s.bleed * 2 - s.inset + 2;
    r.focus = 1 - near * near * (3 - 2 * near);
    if (s.mode === 'tilt') {
      r.visible = r.visible && distance < 1;
      r.transform = 'translate3d(' + x + 'px,0,0) rotateY(' + (-clamp(offset, -1, 1) * 90) + 'deg)';
    } else if (s.mode === 'scale') {
      x -= (offset > 0 ? 1 : offset < 0 ? -1 : 0) * near * s.cardWidth * 0.06;
      r.transform = 'translate3d(' + x + 'px,0,0) scale(' + (1 - 0.12 * near) + ')';
      r.opacity = 1 - 0.5 * near;
    } else {
      r.transform = 'translate3d(' + x + 'px,0,0)';
    }
    return r;
  }

  function cardHTML(item, round, compact) {
    if (item && typeof item === 'object' && item.html != null) {
      return '<div class="carousel-card is-custom' + (round ? ' is-round' : '') + '">' + item.html + '<span class="carousel-card-rim"></span></div>';
    }
    var d = typeof item === 'string' ? { image: item } : (item || {});
    var text = !!(d.title || d.description);
    var quote = !!d.quote;
    var cls = 'carousel-card' + (d.image ? ' has-image' : '') + (round ? ' is-round' : '') + (quote ? ' has-quote' : '');
    var h = '<div class="' + cls + '">';
    if (d.image) h += '<img class="carousel-image" src="' + esc(d.image) + '" alt="' + esc(d.alt || '') + '" draggable="false" decoding="async"' + (d.pos ? ' style="object-position:' + esc(d.pos) + '"' : '') + '>';
    if (d.image && text) h += '<span class="carousel-scrim"></span>';
    if (d.icon) h += '<span class="carousel-icon"><i class="' + esc(d.icon) + '" aria-hidden="true"></i></span>';
    if (quote) {
      h += '<p class="carousel-quote">“' + esc(d.quote) + '”</p>';
      if (d.by) h += '<div class="carousel-by"><b>' + esc(d.by) + '</b>' + (d.role ? '<span>' + esc(d.role) + '</span>' : '') + '</div>';
    }
    if (text) {
      h += '<div class="carousel-text">' + (d.title ? '<div class="carousel-title">' + esc(d.title) + '</div>' : '') +
        (d.description && !compact ? '<p class="carousel-description">' + esc(d.description) + '</p>' : '') + '</div>';
    }
    h += '<span class="carousel-card-rim"></span>';
    if (d.url) h += '<a class="carousel-link" href="' + esc(d.url) + '" aria-label="' + esc(d.title || d.alt || 'Open') + '"></a>';
    return h + '</div>';
  }

  var CHEV_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var CHEV_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  function mount(root, items, options) {
    var o = Object.assign({}, DEFAULTS, options || {});
    items = items || [];
    var count = items.length;
    var mode = EFFECTS.indexOf(o.effect) > -1 ? o.effect : 'tilt';
    var stacked = mode === 'fade' || mode === 'cube';
    var ratio = clamp(o.aspectRatio, 0.3, 4);
    var maxWidth = typeof o.baseWidth === 'number' && o.round && o.frame ? 20 + (o.baseWidth - 20) * Math.min(1, 1 / ratio) : o.baseWidth;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var loop = o.loop && count > 1;
    var width = 300;
    var S = null;                                   /* current layout settings */
    var slides = [], shades = [], fills = [], dots = [], bars = [];
    var counter = null, prevBtn = null, nextBtn = null, controlsEl = null;
    var raf = 0, alive = true;
    var initial = clamp(Math.round(o.initialIndex), 0, Math.max(0, count - 1));
    var state = { p: initial, v: 0, target: initial, shown: initial, elapsed: 0, hovered: false, focused: false,
      visible: true, drag: null, wheeling: false, wheelTimer: 0, suppress: false, last: 0 };

    /* ---------- DOM ---------- */
    root.className = 'carousel-container theme-' + (o.theme === 'dark' ? 'dark' : 'light') + (o.frame ? ' has-frame' : '') +
      (o.round ? ' is-round' : '') + (root.dataset.extraClass ? ' ' + root.dataset.extraClass : '');
    root.style.setProperty('--carousel-radius', (o.round ? 9999 : Math.max(0, o.radius)) + 'px');
    root.style.width = typeof maxWidth === 'number' ? '100%' : maxWidth;
    if (typeof maxWidth === 'number') root.style.maxWidth = maxWidth + 'px';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', o.label);
    root.tabIndex = 0;

    var stage = document.createElement('div'); stage.className = 'carousel-stage';
    var viewport = document.createElement('div'); viewport.className = 'carousel-viewport';
    viewport.setAttribute('aria-live', o.autoplay && count > 1 ? 'off' : 'polite');
    if (o.draggable && count > 1) viewport.setAttribute('data-draggable', 'true');

    items.forEach(function (item, i) {
      var slide = document.createElement('div');
      slide.className = 'carousel-slide';
      slide.dataset.i = i;
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', (i + 1) + ' of ' + count);
      slide.innerHTML = cardHTML(item, o.round, false);
      if (mode === 'cube') {
        var sh = document.createElement('span'); sh.className = 'carousel-shade'; slide.appendChild(sh); shades[i] = sh;
      }
      viewport.appendChild(slide); slides[i] = slide;
    });
    stage.appendChild(viewport);

    var showControls = count > 1 && (o.indicator !== 'none' || o.arrows);
    if (showControls) {
      controlsEl = document.createElement('div'); controlsEl.className = 'carousel-controls';
      var h = '';
      if (o.arrows) h += '<button type="button" class="carousel-arrow" data-dir="-1" aria-label="Previous slide">' + CHEV_L + '</button>';
      if (o.indicator === 'dots') {
        h += '<div class="carousel-dots">' + items.map(function (_, i) {
          return '<button type="button" class="carousel-dot" data-go="' + i + '" aria-label="Go to slide ' + (i + 1) + '"><span class="carousel-dot-mark"></span></button>';
        }).join('') + '</div>';
      } else if (o.indicator === 'bars') {
        h += '<div class="carousel-bars">' + items.map(function (_, i) {
          return '<button type="button" class="carousel-bar" data-go="' + i + '" aria-label="Go to slide ' + (i + 1) + '"><span class="carousel-bar-track"><span class="carousel-bar-fill"></span></span></button>';
        }).join('') + '</div>';
      } else if (o.indicator === 'counter') {
        h += '<div class="carousel-counter"><span class="carousel-counter-current"></span><span>/</span><span>' + String(count).padStart(2, '0') + '</span></div>';
      }
      if (o.arrows) h += '<button type="button" class="carousel-arrow" data-dir="1" aria-label="Next slide">' + CHEV_R + '</button>';
      controlsEl.innerHTML = h;
      prevBtn = controlsEl.querySelector('[data-dir="-1"]');
      nextBtn = controlsEl.querySelector('[data-dir="1"]');
      dots = [].slice.call(controlsEl.querySelectorAll('.carousel-dot'));
      bars = [].slice.call(controlsEl.querySelectorAll('.carousel-bar'));
      fills = [].slice.call(controlsEl.querySelectorAll('.carousel-bar-fill'));
      counter = controlsEl.querySelector('.carousel-counter-current');
    }
    var inside = o.frame && !o.round;
    if (inside && controlsEl) stage.appendChild(controlsEl);
    if (o.frame) { var rim = document.createElement('span'); rim.className = 'carousel-frame-rim'; stage.appendChild(rim); }
    root.innerHTML = '';
    root.appendChild(stage);
    if (!inside && controlsEl) root.appendChild(controlsEl);

    /* ---------- layout ---------- */
    function readWidth() {
      var cs = getComputedStyle(stage);
      var w = stage.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
      return Math.max(1, Math.round(w));
    }

    function layout() {
      var w = width;
      var side = stacked || (o.round && o.frame) ? 0 : clamp(o.peek, 0, w * 0.2);
      var slot = Math.max(40, w - side * 2);
      if (o.maxCardWidth) slot = Math.max(40, Math.min(slot, o.maxCardWidth));
      var diameter = o.frame ? slot : Math.min(slot, slot / ratio);
      var cardWidth = o.round ? diameter : slot;
      var cardHeight = o.round ? diameter : Math.max(o.minHeight || 0, slot / ratio);
      var clipped = !o.frame && !stacked;
      var bleed = clipped ? Math.round(Math.min(48, cardWidth * 0.12)) : 0;
      var inset = bleed + (w - cardWidth) / 2;
      S = {
        count: count, mode: mode, width: w, bleed: bleed, inset: inset, cardWidth: cardWidth,
        span: cardWidth + Math.max(0, o.gap), loop: loop, autoplay: o.autoplay && count > 1,
        autoplayDelay: Math.max(600, o.autoplayDelay), bars: o.indicator === 'bars',
        shade: o.theme === 'light' ? 0.3 : 0.6
      };
      var mask = clipped ? edgeMask(inset) : '';
      viewport.style.height = cardHeight + 'px';
      viewport.style.marginInline = bleed ? -bleed + 'px' : '';
      viewport.style.perspective = mode === 'cube' ? Math.round(cardWidth * 2.6) + 'px' : mode === 'tilt' ? '1000px' : '';
      viewport.style.overflowX = clipped ? 'clip' : 'visible';
      viewport.style.webkitMaskImage = mask; viewport.style.maskImage = mask;
      root.style.setProperty('--carousel-scale', clamp(cardWidth / 300, 0.86, 1));
      if (controlsEl) controlsEl.style.width = cardWidth + 'px';
      slides.forEach(function (sl) { sl.style.left = inset + 'px'; sl.style.width = cardWidth + 'px'; sl.style.height = cardHeight + 'px'; });
      /* narrow cards: keep only the title so text never overflows */
      var compact = o.round && cardWidth < 240;
      if (compact !== layout.compact) {
        layout.compact = compact;
        slides.forEach(function (sl) { var d = sl.querySelector('.carousel-description'); if (d) d.hidden = compact; });
      }
    }

    /* ---------- engine ---------- */
    function unit() { return stacked ? S.cardWidth : S.span; }
    function limit(v) { return S.loop ? v : clamp(v, 0, S.count - 1); }

    function apply() {
      var i, p, sh;
      for (i = 0; i < S.count; i++) {
        p = pose(i, state.p, S);
        slides[i].style.transform = p.transform;
        slides[i].style.opacity = String(p.opacity);
        slides[i].style.visibility = p.visible ? 'visible' : 'hidden';
        slides[i].style.zIndex = String(p.layer);
        slides[i].style.setProperty('--carousel-focus', String(p.focus));
        sh = shades[i]; if (sh) sh.style.opacity = String(p.shade);
      }
      if (!S.bars) return;
      var progress = S.autoplay ? clamp(state.elapsed / S.autoplayDelay, 0, 1) : 1;
      for (i = 0; i < S.count; i++) {
        if (fills[i]) fills[i].style.transform = 'scaleX(' + (i < state.shown ? 1 : i === state.shown ? progress : 0) + ')';
      }
    }

    function paintActive(previous) {
      var a = state.shown;
      slides.forEach(function (sl, i) { if (i === a) sl.setAttribute('data-current', 'true'); else sl.removeAttribute('data-current'); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === a); if (i === a) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      bars.forEach(function (b, i) { if (i === a) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      if (prevBtn) prevBtn.disabled = !loop && a === 0;
      if (nextBtn) nextBtn.disabled = !loop && a === count - 1;
      if (counter) {
        counter.textContent = String(a + 1).padStart(2, '0');
        if (previous != null && previous !== a && counter.animate && !reduce) {
          var delta = loop ? nearest(a - previous, count) : a - previous;
          counter.animate([{ transform: 'translateY(' + (delta > 0 ? 70 : -70) + '%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
            { duration: 320, easing: 'cubic-bezier(0.2,0.8,0.2,1)' });
        }
      }
    }

    function announce() {
      if (!S.count) return;
      var idx = S.loop ? wrap(Math.round(state.target), S.count) : clamp(Math.round(state.target), 0, S.count - 1);
      if (idx === state.shown) return;
      var prev = state.shown;
      state.shown = idx;
      paintActive(prev);
      if (typeof o.onChange === 'function') o.onChange(idx);
    }

    function paused() {
      return (o.pauseOnHover && state.hovered) || state.focused || !!state.drag || state.wheeling || !state.visible || document.hidden;
    }

    function tick(now) {
      raf = 0;
      if (!alive) return;
      var dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
      state.last = now;
      var busy = false;
      if (!(state.drag && state.drag.moved) && !state.wheeling) {
        if (reduce) { state.p = state.target; state.v = 0; }
        else {
          var steps = Math.ceil(dt * 240), hh = dt / steps, k;
          for (k = 0; k < steps; k++) {
            state.v += (STIFFNESS * (state.target - state.p) - DAMPING * state.v) * hh;
            state.p += state.v * hh;
          }
          if (Math.abs(state.target - state.p) < 0.0004 && Math.abs(state.v) < 0.004) { state.p = state.target; state.v = 0; }
          else busy = true;
        }
        if (!busy && S.loop && S.count) { state.target = wrap(Math.round(state.target), S.count); state.p = state.target; }
      }
      if (S.autoplay && !paused()) {
        state.elapsed += dt * 1000;
        if (state.elapsed >= S.autoplayDelay) step(1, true);
        busy = true;
      }
      apply();
      if (busy) raf = requestAnimationFrame(tick); else state.last = 0;
    }
    function wake() { if (!raf && alive) raf = requestAnimationFrame(tick); }

    function moveTo(target) { state.target = target; state.elapsed = 0; announce(); apply(); wake(); }
    function step(dir, auto) {
      if (S.count < 2) return;
      var next = Math.round(state.target) + dir;
      if (!S.loop) { if (auto && next > S.count - 1) next = 0; next = clamp(next, 0, S.count - 1); }
      moveTo(next);
    }
    function goTo(index) {
      if (!S.count) return;
      var goal = clamp(Math.round(index), 0, S.count - 1), cur = Math.round(state.target);
      moveTo(S.loop ? cur + nearest(goal - wrap(cur, S.count), S.count) : goal);
    }
    function sync() {
      if (!S.loop && S.count) {
        state.target = clamp(Math.round(state.target), 0, S.count - 1);
        state.p = clamp(state.p, -0.3, S.count - 0.7);
      }
      announce(); apply(); wake();
    }

    /* ---------- input ---------- */
    function onPointerDown(e) {
      if (!(o.draggable && count > 1) || (e.pointerType === 'mouse' && e.button !== 0)) return;
      state.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, p: state.p, from: 0, moved: false, samples: [] };
    }
    function onPointerMove(e) {
      var drag = state.drag;
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved) {
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) { state.drag = null; return; }
        drag.moved = true; drag.x = e.clientX; drag.p = state.p; drag.from = Math.round(state.target);
        if (viewport.setPointerCapture) viewport.setPointerCapture(e.pointerId);
        viewport.dataset.dragging = 'true';
      }
      var raw = drag.p - (e.clientX - drag.x) / unit();
      state.p = S.loop ? raw : band(raw, S.count - 1);
      state.v = 0;
      state.target = Math.round(limit(state.p));
      drag.samples.push([e.timeStamp, e.clientX]);
      if (drag.samples.length > 8) drag.samples.shift();
      announce(); apply();
    }
    function onPointerUp(e) {
      var drag = state.drag;
      if (!drag || e.pointerId !== drag.id) return;
      state.drag = null;
      delete viewport.dataset.dragging;
      if (!drag.moved) { wake(); return; }
      state.suppress = true;
      setTimeout(function () { state.suppress = false; }, 0);
      var sample = drag.samples.filter(function (s) { return e.timeStamp - s[0] < 90; })[0] || [e.timeStamp, e.clientX];
      var elapsed = Math.max(16, e.timeStamp - sample[0]);
      var velocity = clamp(((sample[1] - e.clientX) / elapsed) * (1000 / unit()), -12, 12);
      var travelled = state.p - drag.from;
      var target = Math.round(state.p + velocity * 0.2);
      if (target === drag.from) {
        if (Math.abs(velocity) > 0.8) target += Math.sign(velocity);
        else if (Math.abs(travelled) > 0.18) target += Math.sign(travelled);
      }
      if (!S.loop) target = clamp(target, 0, S.count - 1);
      var insideRange = S.loop || (state.p >= 0 && state.p <= S.count - 1);
      state.v = insideRange ? velocity : 0;
      moveTo(target);
    }
    function onClickCapture(e) {
      if (!state.suppress) return;
      e.preventDefault(); e.stopPropagation(); state.suppress = false;
    }
    function onClick(e) {
      var sl = e.target.closest && e.target.closest('.carousel-slide');
      if (!sl) return;
      var i = +sl.dataset.i;
      if (i !== state.shown) { e.preventDefault(); goTo(i); }
    }
    function onWheel(e) {
      if (!(o.draggable && count > 1) || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      var raw = state.p + e.deltaX / unit();
      state.p = S.loop ? raw : clamp(raw, -0.15, S.count - 0.85);
      state.v = 0; state.wheeling = true;
      state.target = Math.round(limit(state.p));
      announce(); apply();
      clearTimeout(state.wheelTimer);
      state.wheelTimer = setTimeout(function () { state.wheeling = false; moveTo(Math.round(limit(state.p))); }, 120);
    }
    function onKeyDown(e) {
      if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      var fn = { ArrowRight: function () { step(1); }, ArrowLeft: function () { step(-1); }, Home: function () { goTo(0); }, End: function () { goTo(S.count - 1); } }[e.key];
      if (!fn) return;
      e.preventDefault(); fn();
    }
    function onControls(e) {
      var b = e.target.closest && e.target.closest('button');
      if (!b) return;
      if (b.dataset.go != null) goTo(+b.dataset.go);
      else if (b.dataset.dir) step(+b.dataset.dir);
    }
    function onEnter() { state.hovered = true; }
    function onLeave() { state.hovered = false; wake(); }
    function onFocusIn() {
      try { state.focused = root.matches(':focus-visible') || !!root.querySelector(':focus-visible'); } catch (err) { state.focused = false; }
    }
    function onFocusOut(e) { if (root.contains(e.relatedTarget)) return; state.focused = false; wake(); }
    function onVisibility() { if (document.hidden) return; state.last = 0; wake(); }

    var ro = window.ResizeObserver ? new ResizeObserver(function () {
      var w = readWidth();
      if (w !== width) { width = w; layout(); sync(); }
    }) : null;
    if (ro) ro.observe(stage); else window.addEventListener('resize', function () { width = readWidth(); layout(); sync(); });
    var io = window.IntersectionObserver ? new IntersectionObserver(function (entries) {
      state.visible = entries.some(function (en) { return en.isIntersecting; });
      if (state.visible) wake();
    }) : null;
    if (io) io.observe(root);

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('pointercancel', onPointerUp);
    viewport.addEventListener('click', onClickCapture, true);
    viewport.addEventListener('click', onClick);
    viewport.addEventListener('wheel', onWheel, { passive: false });
    if (controlsEl) controlsEl.addEventListener('click', onControls);
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', onLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    document.addEventListener('visibilitychange', onVisibility);

    width = readWidth();
    layout();
    paintActive(null);
    sync();

    return {
      goTo: goTo,
      step: function (d) { step(d, false); },
      destroy: function () {
        alive = false;
        cancelAnimationFrame(raf);
        clearTimeout(state.wheelTimer);
        if (ro) ro.disconnect();
        if (io) io.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        ['keydown', 'mouseenter', 'mouseleave', 'focusin', 'focusout'].forEach(function (n) {
          root.removeEventListener(n, { keydown: onKeyDown, mouseenter: onEnter, mouseleave: onLeave, focusin: onFocusIn, focusout: onFocusOut }[n]);
        });
        root.innerHTML = '';
      }
    };
  }

  window.Carousel = { mount: mount, defaults: DEFAULTS };
})();
