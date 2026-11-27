/* =========================================================
   DOME GALLERY – FULL WIDTH RESPONSIVE VERSION
   Plain JavaScript – No external libraries
   ========================================================= */

(function () {
    'use strict';

    var DEFAULTS = {
        fit: 0.95,
        fitBasis: 'width',
        minRadius: 560,
        maxRadius: Infinity,
        padFactor: 0.25,
        overlayBlurColor: '#14040a',
        maxVerticalRotationDeg: 5,
        dragSensitivity: 20,
        enlargeTransitionMs: 300,
        segments: 35,
        dragDampening: 2,
        openedImageWidth: 'min(420px, 82vw)',
        openedImageHeight: 'min(420px, 82vw)',
        imageBorderRadius: '24px',
        openedImageBorderRadius: '24px',
        grayscale: false
    };

    var clamp = function (v, a, b) {
        return Math.min(Math.max(v, a), b);
    };

    var normalizeAngle = function (d) {
        return ((d % 360) + 360) % 360;
    };

    var wrapSigned = function (deg) {
        return ((((deg + 180) % 360) + 360) % 360) - 180;
    };

    function readOptions(el) {
        var o = {};

        Object.keys(DEFAULTS).forEach(function (k) {
            var raw = el.getAttribute(
                'data-' + k.replace(/[A-Z]/g, function (m) {
                    return '-' + m.toLowerCase();
                })
            );

            var def = DEFAULTS[k];

            if (raw === null) {
                o[k] = def;
            } else if (typeof def === 'boolean') {
                o[k] = raw === 'true' || raw === '';
            } else if (typeof def === 'number') {
                o[k] = raw === 'Infinity' ? Infinity : parseFloat(raw);
            } else {
                o[k] = raw;
            }
        });

        return o;
    }

    function placeholder(label, i) {
        var hues = [
            ['#e0243d', '#f26f21'],
            ['#8f1226', '#e0243d'],
            ['#42102a', '#c2182f'],
            ['#f26f21', '#e0243d']
        ];

        var h = hues[i % hues.length];

        var ini = (label || 'IN')
            .replace(/[^A-Za-z0-9 ]/g, '')
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(function (w) {
                return w.charAt(0).toUpperCase();
            })
            .join('') || 'IN';

        var svg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
            '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="' + h[0] + '"/>' +
            '<stop offset="1" stop-color="' + h[1] + '"/>' +
            '</linearGradient></defs>' +
            '<rect width="200" height="200" fill="url(#g)"/>' +
            '<circle cx="100" cy="82" r="34" fill="rgba(255,255,255,.28)"/>' +
            '<path d="M36 190c4-42 32-62 64-62s60 20 64 62z" fill="rgba(255,255,255,.28)"/>' +
            '</svg>';

        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function buildItems(pool, seg) {
        var xCols = [];

        for (var i = 0; i < seg; i++) {
            xCols.push(-37 + i * 2);
        }

        var evenYs = [-4, -2, 0, 2, 4];
        var oddYs = [-3, -1, 1, 3, 5];
        var coords = [];

        xCols.forEach(function (x, c) {
            (c % 2 === 0 ? evenYs : oddYs).forEach(function (y) {
                coords.push({
                    x: x,
                    y: y,
                    sizeX: 2,
                    sizeY: 2
                });
            });
        });

        var total = coords.length;
        var used = [];

        for (i = 0; i < total; i++) {
            used.push(pool[i % pool.length]);
        }

        // Avoid identical neighbouring images.
        for (i = 1; i < used.length; i++) {
            if (used[i].src === used[i - 1].src) {
                for (var j = i + 1; j < used.length; j++) {
                    if (used[j].src !== used[i].src) {
                        var t = used[i];
                        used[i] = used[j];
                        used[j] = t;
                        break;
                    }
                }
            }
        }

        return coords.map(function (c, k) {
            return {
                x: c.x,
                y: c.y,
                sizeX: c.sizeX,
                sizeY: c.sizeY,
                src: used[k].src,
                alt: used[k].alt,
                caption: used[k].caption,
                primary: k < pool.length
            };
        });
    }

    function baseRotation(ox, oy, sx, sy, segments) {
        var unit = 360 / segments / 2;

        return {
            rotateX: unit * (oy - (sy - 1) / 2),
            rotateY: unit * (ox + (sx - 1) / 2)
        };
    }

    function Dome(host, options) {
        this.host = host;
        this.o = Object.assign(
            {},
            DEFAULTS,
            readOptions(host),
            options || {}
        );

        var pool = Array.prototype.map.call(
            host.querySelectorAll('img'),
            function (img, i) {
                return {
                    src: img.getAttribute('src'),
                    alt: img.getAttribute('alt') || '',
                    caption: img.getAttribute('data-caption') || '',
                    n: i
                };
            }
        );

        if (!pool.length) return;

        this.pool = pool;
        this.rot = { x: 0, y: 0 };
        this.startRot = { x: 0, y: 0 };
        this.startPos = null;
        this.dragging = false;
        this.moved = false;
        this.inertia = null;
        this.opening = false;
        this.openStartedAt = 0;
        this.lastDragEnd = 0;
        this.focusedEl = null;
        this.origPos = null;
        this.samples = [];

        this.build();
        this.bind();
        this.applyTransform();
    }

    Dome.prototype.build = function () {
        var self = this;
        var o = this.o;
        var host = this.host;

        host.innerHTML = '';
        host.classList.add('sphere-root');

        host.style.setProperty('--segments-x', o.segments);
        host.style.setProperty('--segments-y', o.segments);
        host.style.setProperty('--overlay-blur-color', o.overlayBlurColor);
        host.style.setProperty('--tile-radius', o.imageBorderRadius);
        host.style.setProperty('--enlarge-radius', o.openedImageBorderRadius);
        host.style.setProperty(
            '--image-filter',
            o.grayscale ? 'grayscale(1)' : 'none'
        );

        host.setAttribute('role', 'region');

        if (!host.getAttribute('aria-label')) {
            host.setAttribute(
                'aria-label',
                'Image gallery. Drag to rotate, select a photo to enlarge.'
            );
        }

        var items = buildItems(this.pool, o.segments);

        var html =
            '<main class="sphere-main">' +
            '<div class="stage">' +
            '<div class="sphere">';

        items.forEach(function (it) {
            html +=
                '<div class="item"' +
                ' data-offset-x="' + it.x + '"' +
                ' data-offset-y="' + it.y + '"' +
                ' data-size-x="' + it.sizeX + '"' +
                ' data-size-y="' + it.sizeY + '"' +
                ' style="' +
                '--offset-x:' + it.x + ';' +
                '--offset-y:' + it.y + ';' +
                '--item-size-x:' + it.sizeX + ';' +
                '--item-size-y:' + it.sizeY +
                '">' +
                '<div class="item__image"' +
                (
                    it.primary
                        ? ' role="button" tabindex="0" aria-label="' +
                          (it.alt || 'Open image').replace(/"/g, '&quot;') +
                          '"'
                        : ' aria-hidden="true"'
                ) +
                '><img draggable="false" alt=""></div></div>';
        });

        html +=
            '</div></div>' +
            '<div class="overlay"></div>' +
            '<div class="overlay overlay--blur"></div>' +
            '<div class="edge-fade edge-fade--top"></div>' +
            '<div class="edge-fade edge-fade--bottom"></div>' +
            '<div class="viewer">' +
            '<div class="scrim"></div>' +
            '<div class="frame"></div>' +
            '</div></main>';

        host.innerHTML = html;

        this.main = host.querySelector('.sphere-main');
        this.sphere = host.querySelector('.sphere');
        this.frame = host.querySelector('.frame');
        this.viewer = host.querySelector('.viewer');
        this.scrim = host.querySelector('.scrim');
        this.tiles = host.querySelectorAll('.item');

        Array.prototype.forEach.call(this.tiles, function (tile, i) {
            var it = items[i];
            var img = tile.querySelector('img');

            tile._data = it;

            img.onerror = function () {
                img.onerror = null;
                img.src = placeholder(it.alt || it.caption, i);
                it.src = img.src;
            };

            img.src = it.src;

            var btn = tile.querySelector('.item__image');

            btn.addEventListener('click', function () {
                self.onTileClick(btn);
            });

            btn.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    self.open(btn);
                }
            });
        });
    };

    Dome.prototype.applyTransform = function () {
        this.sphere.style.transform =
            'translateZ(calc(var(--radius) * -1)) ' +
            'rotateX(' + this.rot.x + 'deg) ' +
            'rotateY(' + this.rot.y + 'deg)';
    };

    Dome.prototype.sizeEnlarged = function () {
        var enlarged = this.viewer.querySelector('.enlarge');

        if (!enlarged) return;

        var frameR = this.frame.getBoundingClientRect();
        var mainR = this.main.getBoundingClientRect();

        var tmp = document.createElement('div');

        tmp.style.cssText =
            'position:absolute;visibility:hidden;width:' +
            this.o.openedImageWidth +
            ';height:' +
            this.o.openedImageHeight;

        document.body.appendChild(tmp);

        var r = tmp.getBoundingClientRect();

        document.body.removeChild(tmp);

        enlarged.style.left =
            (frameR.left - mainR.left + (frameR.width - r.width) / 2) + 'px';

        enlarged.style.top =
            (frameR.top - mainR.top + (frameR.height - r.height) / 2) + 'px';

        enlarged.style.width = r.width + 'px';
        enlarged.style.height = r.height + 'px';
    };

    /* =====================================================
       RESPONSIVE FULL-WIDTH RADIUS
       ===================================================== */

    Dome.prototype.resize = function () {
        var o = this.o;
        var host = this.host;

        var w = Math.max(1, host.clientWidth);
        var h = Math.max(1, host.clientHeight);

        var minDim = Math.min(w, h);
        var maxDim = Math.max(w, h);
        var aspect = w / h;
        var basis;

        switch (o.fitBasis) {
            case 'min':
                basis = minDim;
                break;

            case 'max':
                basis = maxDim;
                break;

            case 'width':
                basis = w;
                break;

            case 'height':
                basis = h;
                break;

            default:
                basis = aspect >= 1.3 ? w : minDim;
        }

        /*
         * IMPORTANT:
         * Removed the previous h * 1.35 restriction.
         * The sphere now scales according to viewport width.
         */

        var radius = basis * o.fit;

        radius = clamp(radius, o.minRadius, o.maxRadius);
        radius = Math.round(radius);

        host.style.setProperty('--radius', radius + 'px');

        host.style.setProperty(
            '--viewer-pad',
            Math.max(8, Math.round(minDim * o.padFactor)) + 'px'
        );

        this.applyTransform();
        this.sizeEnlarged();
    };

    /* INERTIA */

    Dome.prototype.stopInertia = function () {
        if (this.inertia) {
            cancelAnimationFrame(this.inertia);
        }

        this.inertia = null;
    };

    Dome.prototype.startInertia = function (vx, vy) {
        var self = this;
        var o = this.o;

        var MAX = 1.4;

        var vX = clamp(vx, -MAX, MAX) * 80;
        var vY = clamp(vy, -MAX, MAX) * 80;

        var frames = 0;
        var d = clamp(o.dragDampening, 0, 1);

        var friction = 0.94 + 0.055 * d;
        var stop = 0.015 - 0.01 * d;
        var maxFrames = Math.round(90 + 270 * d);

        this.stopInertia();

        var step = function () {
            vX *= friction;
            vY *= friction;

            if (
                (Math.abs(vX) < stop && Math.abs(vY) < stop) ||
                ++frames > maxFrames
            ) {
                self.inertia = null;
                return;
            }

            self.rot = {
                x: clamp(
                    self.rot.x - vY / 200,
                    -o.maxVerticalRotationDeg,
                    o.maxVerticalRotationDeg
                ),

                y: wrapSigned(self.rot.y + vX / 200)
            };

            self.applyTransform();

            self.inertia = requestAnimationFrame(step);
        };

        this.inertia = requestAnimationFrame(step);
    };

    /* SCROLL LOCK */

    Dome.prototype.lockScroll = function () {
        document.body.classList.add('dg-scroll-lock');
    };

    Dome.prototype.unlockScroll = function () {
        if (this.host.getAttribute('data-enlarging') === 'true') {
            return;
        }

        document.body.classList.remove('dg-scroll-lock');
    };

    Dome.prototype.onTileClick = function (btn) {
        if (this.dragging || this.moved || this.opening) return;

        if (performance.now() - this.lastDragEnd < 80) return;

        this.open(btn);
    };

    /* OPEN IMAGE */

    Dome.prototype.open = function (el) {
        if (this.opening || this.focusedEl) return;

        var self = this;
        var o = this.o;

        this.opening = true;
        this.openStartedAt = performance.now();

        this.lockScroll();

        var parent = el.parentElement;

        this.focusedEl = el;

        var data = parent._data;

        var ox = +parent.getAttribute('data-offset-x');
        var oy = +parent.getAttribute('data-offset-y');
        var sx = +parent.getAttribute('data-size-x');
        var sy = +parent.getAttribute('data-size-y');

        var pr = baseRotation(ox, oy, sx, sy, o.segments);

        var parentY = normalizeAngle(pr.rotateY);
        var globalY = normalizeAngle(this.rot.y);

        var rotY = -(parentY + globalY) % 360;

        if (rotY < -180) {
            rotY += 360;
        }

        var rotX = -pr.rotateX - this.rot.x;

        parent.style.setProperty('--rot-y-delta', rotY + 'deg');
        parent.style.setProperty('--rot-x-delta', rotX + 'deg');

        var refDiv = document.createElement('div');

        refDiv.className = 'item__image item__image--reference';
        refDiv.style.opacity = '0';

        refDiv.style.transform =
            'rotateX(' + (-pr.rotateX) + 'deg) ' +
            'rotateY(' + (-pr.rotateY) + 'deg)';

        parent.appendChild(refDiv);

        void refDiv.offsetHeight;

        var tileR = refDiv.getBoundingClientRect();
        var mainR = this.main.getBoundingClientRect();
        var frameR = this.frame.getBoundingClientRect();

        if (tileR.width <= 0 || tileR.height <= 0) {
            this.opening = false;
            this.focusedEl = null;
            parent.removeChild(refDiv);
            this.unlockScroll();
            return;
        }

        this.origPos = {
            left: tileR.left,
            top: tileR.top,
            width: tileR.width,
            height: tileR.height
        };

        el.style.visibility = 'hidden';

        var overlay = document.createElement('div');

        overlay.className = 'enlarge';

        overlay.style.cssText =
            'position:absolute;' +
            'left:' + (frameR.left - mainR.left) + 'px;' +
            'top:' + (frameR.top - mainR.top) + 'px;' +
            'width:' + frameR.width + 'px;' +
            'height:' + frameR.height + 'px;' +
            'opacity:0;' +
            'z-index:30;' +
            'will-change:transform,opacity;' +
            'transform-origin:top left;' +
            'transition:transform ' + o.enlargeTransitionMs +
            'ms ease,opacity ' + o.enlargeTransitionMs + 'ms ease';

        var img = document.createElement('img');

        img.src = data.src;
        img.alt = data.alt;

        overlay.appendChild(img);

        if (data.alt || data.caption) {
            var cap = document.createElement('div');

            cap.className = 'enlarge__cap';

            cap.innerHTML =
                (data.alt ? '<strong></strong>' : '') +
                (data.caption ? '<span></span>' : '');

            if (data.alt) {
                cap.querySelector('strong').textContent = data.alt;
            }

            if (data.caption) {
                cap.querySelector('span').textContent = data.caption;
            }

            overlay.appendChild(cap);
        }

        this.viewer.appendChild(overlay);

        var sx0 = isFinite(tileR.width / frameR.width) && tileR.width > 0
            ? tileR.width / frameR.width : 1;

        var sy0 = isFinite(tileR.height / frameR.height) && tileR.height > 0
            ? tileR.height / frameR.height : 1;

        overlay.style.transform =
            'translate(' +
            (tileR.left - frameR.left) + 'px,' +
            (tileR.top - frameR.top) + 'px) ' +
            'scale(' + sx0 + ',' + sy0 + ')';

        setTimeout(function () {
            if (!overlay.parentElement) return;

            overlay.style.opacity = '1';
            overlay.style.transform = 'translate(0px,0px) scale(1,1)';

            self.host.setAttribute('data-enlarging', 'true');
        }, 16);

        var onFirstEnd = function (ev) {
            if (ev.propertyName !== 'transform') return;

            overlay.removeEventListener('transitionend', onFirstEnd);

            var prev = overlay.style.transition;

            overlay.style.transition = 'none';

            overlay.style.width = o.openedImageWidth;
            overlay.style.height = o.openedImageHeight;

            var nr = overlay.getBoundingClientRect();

            overlay.style.width = frameR.width + 'px';
            overlay.style.height = frameR.height + 'px';

            void overlay.offsetWidth;

            overlay.style.transition =
                'left ' + o.enlargeTransitionMs + 'ms ease,' +
                'top ' + o.enlargeTransitionMs + 'ms ease,' +
                'width ' + o.enlargeTransitionMs + 'ms ease,' +
                'height ' + o.enlargeTransitionMs + 'ms ease';

            var left =
                frameR.left - mainR.left +
                (frameR.width - nr.width) / 2;

            var top =
                frameR.top - mainR.top +
                (frameR.height - nr.height) / 2;

            requestAnimationFrame(function () {
                overlay.style.left = left + 'px';
                overlay.style.top = top + 'px';
                overlay.style.width = nr.width + 'px';
                overlay.style.height = nr.height + 'px';
            });

            overlay.addEventListener(
                'transitionend',
                function () {
                    overlay.style.transition = prev;
                },
                { once: true }
            );
        };

        overlay.addEventListener('transitionend', onFirstEnd);
    };

    /* CLOSE IMAGE */

    Dome.prototype.close = function () {
        if (performance.now() - this.openStartedAt < 250) return;

        var self = this;
        var o = this.o;
        var el = this.focusedEl;

        if (!el) return;

        var parent = el.parentElement;
        var overlay = this.viewer.querySelector('.enlarge');

        if (!overlay) return;

        var refDiv = parent.querySelector('.item__image--reference');
        var orig = this.origPos;

        var finish = function () {
            if (refDiv) refDiv.remove();

            parent.style.setProperty('--rot-y-delta', '0deg');
            parent.style.setProperty('--rot-x-delta', '0deg');

            el.style.visibility = '';

            self.focusedEl = null;

            self.host.removeAttribute('data-enlarging');

            self.opening = false;

            self.unlockScroll();
        };

        if (!orig) {
            overlay.remove();
            finish();
            return;
        }

        var cur = overlay.getBoundingClientRect();
        var rootR = this.host.getBoundingClientRect();

        var anim = document.createElement('div');

        anim.className = 'enlarge-closing';

        anim.style.cssText =
            'position:absolute;' +
            'left:' + (cur.left - rootR.left) + 'px;' +
            'top:' + (cur.top - rootR.top) + 'px;' +
            'width:' + cur.width + 'px;' +
            'height:' + cur.height + 'px;' +
            'z-index:9999;' +
            'border-radius:var(--enlarge-radius,24px);' +
            'overflow:hidden;' +
            'box-shadow:0 10px 30px rgba(0,0,0,.35);' +
            'transition:all ' + o.enlargeTransitionMs + 'ms ease-out;' +
            'pointer-events:none;' +
            'margin:0;' +
            'transform:none';

        var oi = overlay.querySelector('img');

        if (oi) {
            var im = oi.cloneNode();

            im.style.cssText =
                'width:100%;height:100%;object-fit:cover';

            anim.appendChild(im);
        }

        overlay.remove();

        this.host.appendChild(anim);

        void anim.getBoundingClientRect();

        this.host.removeAttribute('data-enlarging');

        requestAnimationFrame(function () {
            anim.style.left = (orig.left - rootR.left) + 'px';
            anim.style.top = (orig.top - rootR.top) + 'px';
            anim.style.width = orig.width + 'px';
            anim.style.height = orig.height + 'px';
            anim.style.opacity = '0';
        });

        var done = false;

        var cleanup = function () {
            if (done) return;

            done = true;

            anim.remove();

            self.origPos = null;

            parent.style.transition = 'none';

            finish();

            requestAnimationFrame(function () {
                parent.style.transition = '';
            });
        };

        anim.addEventListener('transitionend', cleanup, {
            once: true
        });

        setTimeout(cleanup, o.enlargeTransitionMs + 120);
    };

    /* EVENTS */

    Dome.prototype.bind = function () {
        var self = this;
        var o = this.o;
        var main = this.main;

        if ('ResizeObserver' in window) {
            new ResizeObserver(function () {
                self.resize();
            }).observe(this.host);
        } else {
            window.addEventListener('resize', function () {
                self.resize();
            });
        }

        this.resize();

        main.addEventListener('pointerdown', function (e) {
            if (self.focusedEl || (e.button !== undefined && e.button > 0)) {
                return;
            }

            self.stopInertia();

            self.dragging = true;
            self.moved = false;

            self.startRot = {
                x: self.rot.x,
                y: self.rot.y
            };

            self.startPos = {
                x: e.clientX,
                y: e.clientY,
                id: e.pointerId
            };

            self.samples = [{
                x: e.clientX,
                y: e.clientY,
                t: performance.now()
            }];
        });

        main.addEventListener('pointermove', function (e) {
            if (!self.dragging || !self.startPos || self.focusedEl) {
                return;
            }

            var dx = e.clientX - self.startPos.x;
            var dy = e.clientY - self.startPos.y;

            if (!self.moved && dx * dx + dy * dy > 16) {
                self.moved = true;

                try {
                    main.setPointerCapture(self.startPos.id);
                } catch (err) {}
            }

            var now = performance.now();

            self.samples.push({
                x: e.clientX,
                y: e.clientY,
                t: now
            });

            while (
                self.samples.length > 2 &&
                now - self.samples[0].t > 100
            ) {
                self.samples.shift();
            }

            var nx = clamp(
                self.startRot.x - dy / o.dragSensitivity,
                -o.maxVerticalRotationDeg,
                o.maxVerticalRotationDeg
            );

            var ny = wrapSigned(
                self.startRot.y + dx / o.dragSensitivity
            );

            if (nx !== self.rot.x || ny !== self.rot.y) {
                self.rot = {
                    x: nx,
                    y: ny
                };

                self.applyTransform();
            }
        });

        var end = function () {
            if (!self.dragging) return;

            self.dragging = false;

            if (self.moved) {
                self.lastDragEnd = performance.now();

                var s = self.samples;
                var a = s[0];
                var b = s[s.length - 1];

                var dt = Math.max(b.t - a.t, 1);

                var vx = (b.x - a.x) / dt;
                var vy = (b.y - a.y) / dt;

                if (
                    Math.abs(vx) > 0.005 ||
                    Math.abs(vy) > 0.005
                ) {
                    self.startInertia(vx, vy);
                }
            }

            setTimeout(function () {
                self.moved = false;
            }, 0);
        };

        main.addEventListener('pointerup', end);
        main.addEventListener('pointercancel', end);

        this.scrim.addEventListener('click', function () {
            self.close();
        });

        window.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                self.close();
            }
        });

        window.addEventListener('pagehide', function () {
            document.body.classList.remove('dg-scroll-lock');
        });

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (es) {
                if (!es[0].isIntersecting) {
                    self.stopInertia();
                }
            }).observe(this.host);
        }
    };

    /* INITIALIZE */

    window.DomeGallery = Dome;

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-dome-gallery]').forEach(
            function (el) {
                el._dome = new Dome(el);
            }
        );
    });

})();