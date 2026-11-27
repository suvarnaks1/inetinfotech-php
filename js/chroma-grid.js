/* ==========================================================================
   ChromaGrid – plain JavaScript, no libraries.
   Cards are grey until a soft pointer spotlight reveals their real colour.

   ChromaGrid.mount(element, items, options) -> { update(items, options), destroy() }

   item:    { image, icon, title, subtitle, desc, tags[], accent, url, alt, fit }
              image  = path/URL of a picture (logo or photo)
              icon   = Font Awesome class, used when there is no image
              fit    = 'contain' (logos, default when icon/logo) | 'cover' (photos)
   options: columns, minCardWidth, gap, radius, softness, damping, fadeOut,
            grayscale, dim, glow, borderGlow, reveal ('spotlight' | 'card'),
            aspectRatio, cardRadius, showInfo, showDesc, frame, theme ('light' | 'dark')
   ========================================================================== */
(function () {
  'use strict';

  var DEFAULTS = {
    columns: 3, minCardWidth: 180, gap: 12, radius: 260, softness: 0.6, damping: 0.45,
    fadeOut: 0.6, grayscale: 1, dim: 0.12, glow: 0.5, borderGlow: 1, reveal: 'spotlight',
    aspectRatio: '3 / 2', cardRadius: 22, showInfo: true, showDesc: true, frame: false, theme: 'light'
  };

  var clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* soft radial falloff: opaque in the core, smootherstep to transparent at the edge */
  function falloffStops(softness) {
    var core = clamp(1 - softness, 0, 0.95), stops = [], i, t, u, a;
    for (i = 0; i <= 12; i++) {
      t = i / 12;
      u = clamp((t - core) / Math.max(0.0001, 1 - core), 0, 1);
      a = 1 - u * u * u * (u * (u * 6 - 15) + 10);
      stops.push('rgba(0, 0, 0, ' + a.toFixed(3) + ') ' + (t * 100).toFixed(1) + '%');
    }
    return stops.join(', ');
  }

  function cardHTML(item, o) {
    var accent = item.accent || '#ffffff';
    var contain = item.fit ? item.fit === 'contain' : true;
    var title = item.title || '';
    var media;
    if (item.image) {
      media = '<img class="chroma-mono" src="' + esc(item.image) + '" alt="' + esc(item.alt || title) + '" loading="lazy" decoding="async">' +
              '<img class="chroma-color" src="' + esc(item.image) + '" alt="" aria-hidden="true" loading="lazy" decoding="async">';
    } else {
      var ic = esc(item.icon || 'fa-solid fa-certificate');
      media = '<div class="chroma-glyph chroma-mono" role="img" aria-label="' + esc(item.alt || title) + '"><i class="' + ic + '" aria-hidden="true"></i></div>' +
              '<div class="chroma-glyph chroma-color" aria-hidden="true"><i class="' + ic + '"></i></div>';
      contain = true;
    }
    var info = '';
    if (o.showInfo && (item.title || item.subtitle || (o.showDesc && (item.desc || (item.tags && item.tags.length))))) {
      info = '<div class="chroma-info">' +
        (item.title ? '<span class="chroma-title">' + esc(item.title) + '</span>' : '') +
        (item.subtitle ? '<span class="chroma-subtitle">' + esc(item.subtitle) + '</span>' : '') +
        (o.showDesc && item.desc ? '<div class="chroma-desc">' + esc(item.desc) + '</div>' : '') +
        (o.showDesc && item.tags && item.tags.length
          ? '<div class="chroma-tags">' + item.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
        '</div>';
    }
    var body = '<span class="chroma-wash" aria-hidden="true"></span>' +
      '<div class="chroma-media' + (contain ? ' is-contain' : '') + '" data-chroma-area>' + media +
      '<span class="chroma-media-rim" aria-hidden="true"></span></div>' + info +
      '<span class="chroma-card-rim" aria-hidden="true"></span><span class="chroma-card-glow" aria-hidden="true"></span>';
    var style = ' style="--chroma-accent:' + esc(accent) + '"';
    return item.url
      ? '<a class="chroma-card" data-chroma-area' + style + ' href="' + esc(item.url) + '">' + body + '</a>'
      : '<article class="chroma-card" data-chroma-area tabindex="0"' + style + '>' + body + '</article>';
  }

  function mount(root, items, options) {
    var o = Object.assign({}, DEFAULTS, options || {});
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var state = { x: 0, y: 0, tx: 0, ty: 0, power: 0, target: 0, primed: false };
    var raf = 0, last = 0, inner, rim;

    root.classList.add('chroma-grid');
    root.innerHTML = '<div class="chroma-grid-inner"></div>';
    inner = root.firstChild;

    function applyOptions() {
      root.classList.toggle('has-frame', !!o.frame);
      root.dataset.theme = o.theme === 'dark' ? 'dark' : 'light';
      root.dataset.reveal = o.reveal === 'card' ? 'card' : 'spotlight';
      root.setAttribute('data-touch-color', '');
      var s = root.style;
      s.setProperty('--chroma-cols', Math.max(1, Math.round(o.columns)));
      s.setProperty('--chroma-min', Math.max(80, o.minCardWidth) + 'px');
      s.setProperty('--chroma-gap', Math.max(0, o.gap) + 'px');
      s.setProperty('--chroma-r', Math.max(20, o.radius) + 'px');
      s.setProperty('--chroma-stops', falloffStops(clamp(o.softness, 0, 1)));
      s.setProperty('--chroma-gray', clamp(o.grayscale, 0, 1));
      s.setProperty('--chroma-dim', clamp(o.dim, 0, 0.9));
      s.setProperty('--chroma-glow', clamp(o.glow, 0, 1));
      s.setProperty('--chroma-border', clamp(o.borderGlow, 0, 1));
      s.setProperty('--chroma-fade', Math.max(0, o.fadeOut) + 's');
      s.setProperty('--chroma-ratio', o.aspectRatio);
      s.setProperty('--chroma-radius', Math.max(0, o.cardRadius) + 'px');
      if (o.frame && !rim) { rim = document.createElement('span'); rim.className = 'chroma-frame-rim'; rim.setAttribute('aria-hidden', 'true'); root.appendChild(rim); }
      if (!o.frame && rim) { rim.remove(); rim = null; }
    }

    /* each tinted layer needs its own offset so one spotlight lines up across every card */
    function place() {
      var box = root.getBoundingClientRect();
      Array.prototype.forEach.call(root.querySelectorAll('[data-chroma-area]'), function (node) {
        var r = node.getBoundingClientRect();
        node.style.setProperty('--chroma-ox', (r.left - box.left) + 'px');
        node.style.setProperty('--chroma-oy', (r.top - box.top) + 'px');
      });
    }

    function render(list) {
      inner.innerHTML = (list || []).map(function (it) { return cardHTML(it, o); }).join('');
      place();
    }

    function frame(now) {
      raf = 0;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      var follow = reduce ? 1 : 1 - Math.exp(-dt / Math.max(0.01, o.damping * 0.32));
      state.x += (state.tx - state.x) * follow;
      state.y += (state.ty - state.y) * follow;
      var span = state.target > state.power ? 0.1 : Math.max(0.02, o.fadeOut * 0.35);
      state.power += (state.target - state.power) * (reduce ? 1 : 1 - Math.exp(-dt / span));
      root.style.setProperty('--chroma-x', state.x.toFixed(2) + 'px');
      root.style.setProperty('--chroma-y', state.y.toFixed(2) + 'px');
      root.style.setProperty('--chroma-power', state.power.toFixed(4));
      var settled = Math.abs(state.tx - state.x) < 0.1 && Math.abs(state.ty - state.y) < 0.1 && Math.abs(state.target - state.power) < 0.002;
      if (settled) {
        state.power = state.target;
        root.style.setProperty('--chroma-power', state.power.toFixed(4));
        last = 0;
      } else raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf) raf = requestAnimationFrame(frame); }

    function moveTo(cx, cy) {
      var box = root.getBoundingClientRect();
      state.tx = cx - box.left; state.ty = cy - box.top;
      if (!state.primed || state.power < 0.02) { state.x = state.tx; state.y = state.ty; state.primed = true; }
      state.target = 1; wake();
    }
    function onMove(e) { if (o.reveal !== 'card') moveTo(e.clientX, e.clientY); }
    function onLeave() { state.target = 0; wake(); }
    /* keyboard: spotlight the focused card */
    function onFocusIn(e) {
      if (o.reveal === 'card') return;
      var card = e.target.closest && e.target.closest('.chroma-card');
      if (!card) return;
      var r = card.getBoundingClientRect();
      moveTo(r.left + r.width / 2, r.top + r.height / 2);
    }
    function onFocusOut(e) { if (!root.contains(e.relatedTarget)) onLeave(); }

    var ro = window.ResizeObserver ? new ResizeObserver(place) : null;
    if (ro) ro.observe(root); else window.addEventListener('resize', place);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointercancel', onLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);

    applyOptions();
    render(items);

    return {
      update: function (list, opts) {
        if (opts) { o = Object.assign(o, opts); applyOptions(); }
        render(list);
      },
      destroy: function () {
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', place);
        root.removeEventListener('pointermove', onMove);
        root.removeEventListener('pointerdown', onMove);
        root.removeEventListener('pointerleave', onLeave);
        root.removeEventListener('pointercancel', onLeave);
        root.removeEventListener('focusin', onFocusIn);
        root.removeEventListener('focusout', onFocusOut);
        root.innerHTML = '';
      }
    };
  }

  window.ChromaGrid = { mount: mount, defaults: DEFAULTS };
})();
