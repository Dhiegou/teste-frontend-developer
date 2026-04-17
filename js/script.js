/**
 * ============================================================
 * D-LAB — Custom Animation Engine
 * GSAP-level animations using pure Vanilla JavaScript
 * ============================================================
 *
 * Modules:
 *  1. Easing Library       — 12+ custom easing functions
 *  2. Tween Engine         — animate() with duration, delay, easing, onUpdate
 *  3. ScrollObserver       — IntersectionObserver with stagger + progress
 *  4. Parallax Controller  — rAF-based parallax transforms
 *  5. Tilt Engine          — Mouse-follow 3D card tilt
 *  6. Magnetic Button      — Cursor-follow button distortion
 *  7. Counter Animator     — Smooth count-up with easing
 *  8. Accordion Controller — FAQ with height animation
 *  9. Form Controller      — Validation + phone mask + modal
 * 10. Scroll Progress      — Top bar progress indicator
 * 11. Header Controller    — Scroll class toggle
 */

(function () {
  'use strict';

  /* ===========================================================
   * 1. EASING LIBRARY
   * =========================================================== */
  var Ease = {
    linear: function (t) { return t; },
    inQuad: function (t) { return t * t; },
    outQuad: function (t) { return t * (2 - t); },
    inOutQuad: function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
    inCubic: function (t) { return t * t * t; },
    outCubic: function (t) { return (--t) * t * t + 1; },
    inOutCubic: function (t) { return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; },
    outQuart: function (t) { return 1 - Math.pow(1 - t, 4); },
    outQuint: function (t) { return 1 - Math.pow(1 - t, 5); },
    outExpo: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); },
    outBack: function (t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    outElastic: function (t) {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
    },
    spring: function (t) {
      return 1 - Math.cos(t * Math.PI * 0.5) * Math.exp(-6 * t);
    }
  };


  /* ===========================================================
   * 2. TWEEN ENGINE
   * =========================================================== */
  /**
   * animate(options)
   * @param {Object} options
   *   - from:     {Object} start values, e.g. { y: 40, opacity: 0 }
   *   - to:       {Object} end values,   e.g. { y: 0, opacity: 1 }
   *   - duration: {Number} ms
   *   - delay:    {Number} ms (default 0)
   *   - easing:   {Function} from Ease (default outQuart)
   *   - onUpdate: {Function} receives interpolated values object
   *   - onDone:   {Function} called on completion
   */
  function animate(opts) {
    var from = opts.from || {};
    var to = opts.to || {};
    var duration = opts.duration || 600;
    var delay = opts.delay || 0;
    var easing = opts.easing || Ease.outQuart;
    var onUpdate = opts.onUpdate || function () {};
    var onDone = opts.onDone || function () {};
    var keys = Object.keys(to);
    var startTime = null;
    var cancelled = false;

    function step(ts) {
      if (cancelled) return;
      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;
      if (elapsed < delay) { requestAnimationFrame(step); return; }

      var rawProgress = Math.min((elapsed - delay) / duration, 1);
      var progress = easing(rawProgress);

      var current = {};
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var s = from[k] !== undefined ? from[k] : 0;
        var e = to[k];
        current[k] = s + (e - s) * progress;
      }

      onUpdate(current, rawProgress);
      if (rawProgress < 1) {
        requestAnimationFrame(step);
      } else {
        onDone();
      }
    }

    requestAnimationFrame(step);

    return { cancel: function () { cancelled = true; } };
  }


  /* ===========================================================
   * 3. SCROLL OBSERVER — Reveal animations on scroll
   * =========================================================== */
  function initScrollAnimations() {
    var animElements = document.querySelectorAll('[data-anim]');
    if (!animElements.length) return;

    if (!('IntersectionObserver' in window)) {
      animElements.forEach(function (el) { el.classList.add('anim-done'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var type = el.dataset.anim;
        var delay = parseInt(el.dataset.delay || '0', 10);

        if (type === 'fade-up') {
          animate({
            from: { y: 40, opacity: 0 },
            to: { y: 0, opacity: 1 },
            duration: 800,
            delay: delay,
            easing: Ease.outExpo,
            onUpdate: function (v) {
              el.style.transform = 'translateY(' + v.y + 'px)';
              el.style.opacity = v.opacity;
            },
            onDone: function () { el.classList.add('anim-done'); }
          });
        }

        else if (type === 'fade-left') {
          animate({
            from: { x: 60, opacity: 0 },
            to: { x: 0, opacity: 1 },
            duration: 900,
            delay: delay,
            easing: Ease.outExpo,
            onUpdate: function (v) {
              el.style.transform = 'translateX(' + v.x + 'px)';
              el.style.opacity = v.opacity;
            },
            onDone: function () { el.classList.add('anim-done'); }
          });
        }

        else if (type === 'split-lines') {
          var lines = el.querySelectorAll('.hero__title-line');
          lines.forEach(function (line, i) {
            animate({
              from: { y: 110 },
              to: { y: 0 },
              duration: 1000,
              delay: delay + i * 150,
              easing: Ease.outExpo,
              onUpdate: function (v) {
                line.style.transform = 'translateY(' + v.y + '%)';
              }
            });
          });
          el.classList.add('anim-done');
        }

        else if (type === 'reveal-image') {
          var wrap = el.querySelector('.about__image-wrap');
          animate({
            from: { clip: 100 },
            to: { clip: 0 },
            duration: 1200,
            delay: delay,
            easing: Ease.outExpo,
            onUpdate: function (v) {
              wrap.style.clipPath = 'inset(' + v.clip + '% 0 0 0)';
            },
            onDone: function () { el.classList.add('anim-done'); }
          });
        }

        observer.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    animElements.forEach(function (el) { observer.observe(el); });
  }


  /* ===========================================================
   * 4. PARALLAX CONTROLLER
   * =========================================================== */
  function initParallax() {
    var items = document.querySelectorAll('[data-parallax]');
    if (!items.length) return;

    var ticking = false;

    function update() {
      var scrollY = window.pageYOffset;
      items.forEach(function (el) {
        var speed = parseFloat(el.dataset.speed || '0.05');
        var rect = el.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var offset = (center - window.innerHeight / 2) * speed;
        el.style.transform = 'translateY(' + offset + 'px)';
      });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
  }


  /* ===========================================================
   * 4b. SCROLL-DRIVEN ABOUT SCENE
   *
   * Timeline (scroll progress 0 → 1):
   *   0.00 – 0.35  Image wipe reveal (clip-path left→right) + zoom
   *   0.20 – 0.40  Float card slides in
   *   0.25 – 0.42  Section label fades up
   *   0.30 – 0.50  Heading fades up
   *   0.40 – 0.58  Paragraph 1 fades up
   *   0.48 – 0.65  Paragraph 2 fades up
   *   0.55 – 0.72  Stats line draws in
   *   0.60 – 0.80  Stats fade up + counters
   *   0.80 – 1.00  Hold (everything visible)
   * =========================================================== */
  function initAboutScrollScene() {
    var wrapper = document.getElementById('about-scroll');
    if (!wrapper) return;

    // Cache DOM references
    var progressFill = document.getElementById('about-progress-fill');
    var imageWrap    = document.getElementById('about-image-wrap');
    var image        = imageWrap ? imageWrap.querySelector('.about__image') : null;
    var floatCard    = document.getElementById('about-float-card');
    var label        = document.getElementById('about-label');
    var heading      = document.getElementById('about-heading');
    var text1        = document.getElementById('about-text-1');
    var text2        = document.getElementById('about-text-2');
    var statsLine    = document.getElementById('about-stats-line');
    var stats        = document.getElementById('about-stats');
    var counters     = document.querySelectorAll('[data-scroll-count]');
    var countersTriggered = false;

    // Utility: clamp value between 0 and 1
    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

    // Utility: map a progress value within a range to 0–1
    function rangeProgress(progress, start, end) {
      return clamp01((progress - start) / (end - start));
    }

    // Easing: smooth ease-out for natural feel
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

    var ticking = false;

    function update() {
      var rect = wrapper.getBoundingClientRect();
      var scrollable = wrapper.offsetHeight - window.innerHeight;
      var rawProgress = clamp01(-rect.top / scrollable);

      // --- Progress bar ---
      if (progressFill) {
        progressFill.style.height = (rawProgress * 100) + '%';
      }

      // --- 1. Image wipe reveal (0.00 – 0.35) ---
      var imgP = easeOutCubic(rangeProgress(rawProgress, 0.0, 0.35));
      if (imageWrap) {
        var clipRight = 100 - (imgP * 100);
        imageWrap.style.clipPath = 'inset(0 ' + clipRight + '% 0 0)';
      }
      if (image) {
        var imgScale = 1.15 - (imgP * 0.15);
        image.style.transform = 'scale(' + imgScale + ')';
      }

      // --- 2. Float card (0.20 – 0.40) ---
      var cardP = easeOutQuart(rangeProgress(rawProgress, 0.20, 0.40));
      if (floatCard) {
        var cardX = 40 - (cardP * 40);
        var cardScale = 0.8 + (cardP * 0.2);
        floatCard.style.opacity = cardP;
        floatCard.style.transform = 'translateX(' + cardX + 'px) scale(' + cardScale + ')';
      }

      // --- 3. Label (0.25 – 0.42) ---
      var labelP = easeOutCubic(rangeProgress(rawProgress, 0.25, 0.42));
      if (label) {
        label.style.opacity = labelP;
        label.style.transform = 'translateY(' + (20 - labelP * 20) + 'px)';
      }

      // --- 4. Heading (0.30 – 0.50) ---
      var headP = easeOutCubic(rangeProgress(rawProgress, 0.30, 0.50));
      if (heading) {
        heading.style.opacity = headP;
        heading.style.transform = 'translateY(' + (30 - headP * 30) + 'px)';
      }

      // --- 5. Paragraph 1 (0.40 – 0.58) ---
      var t1P = easeOutCubic(rangeProgress(rawProgress, 0.40, 0.58));
      if (text1) {
        text1.style.opacity = t1P;
        text1.style.transform = 'translateY(' + (24 - t1P * 24) + 'px)';
      }

      // --- 6. Paragraph 2 (0.48 – 0.65) ---
      var t2P = easeOutCubic(rangeProgress(rawProgress, 0.48, 0.65));
      if (text2) {
        text2.style.opacity = t2P;
        text2.style.transform = 'translateY(' + (24 - t2P * 24) + 'px)';
      }

      // --- 7. Stats line draw (0.55 – 0.72) ---
      var lineP = easeOutCubic(rangeProgress(rawProgress, 0.55, 0.72));
      if (statsLine) {
        statsLine.style.setProperty('--line-width', (lineP * 100) + '%');
      }

      // --- 8. Stats (0.60 – 0.80) ---
      var statP = easeOutCubic(rangeProgress(rawProgress, 0.60, 0.80));
      if (stats) {
        stats.style.opacity = statP;
        stats.style.transform = 'translateY(' + (20 - statP * 20) + 'px)';
      }

      // Counter animation — trigger once at 65% progress
      if (!countersTriggered && rawProgress > 0.65) {
        countersTriggered = true;
        counters.forEach(function (el) {
          var target = parseInt(el.dataset.scrollCount, 10);
          animate({
            from: { n: 0 },
            to: { n: target },
            duration: 2000,
            easing: Ease.outExpo,
            onUpdate: function (v) {
              el.textContent = Math.floor(v.n).toLocaleString('pt-BR');
            },
            onDone: function () {
              el.textContent = target.toLocaleString('pt-BR');
            }
          });
        });
      }

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    // Run once on load
    update();
  }


  /* ===========================================================
   * 5. TILT ENGINE — 3D card perspective on hover
   * =========================================================== */
  function initTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return; // Skip on touch

    var cards = document.querySelectorAll('[data-tilt]');
    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        var rotateX = y * -8;
        var rotateY = x * 8;
        card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';

        // Card glow tracking
        var px = ((e.clientX - rect.left) / rect.width * 100).toFixed(0);
        var py = ((e.clientY - rect.top) / rect.height * 100).toFixed(0);
        card.style.setProperty('--mouse-x', px + '%');
        card.style.setProperty('--mouse-y', py + '%');
      });

      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
        setTimeout(function () { card.style.transition = ''; }, 500);
      });
    });
  }


  /* ===========================================================
   * 6. MAGNETIC BUTTON — Cursor-follow effect
   * =========================================================== */
  function initMagneticButtons() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    var btns = document.querySelectorAll('.btn-magnetic');
    btns.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - (rect.left + rect.width / 2);
        var y = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform = 'translate(' + (x * 0.2) + 'px, ' + (y * 0.2) + 'px)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        btn.style.transform = 'translate(0, 0)';
        setTimeout(function () { btn.style.transition = ''; }, 400);
      });
    });
  }


  /* ===========================================================
   * 7. COUNTER ANIMATOR
   * =========================================================== */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    if (!('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = el.dataset.count; });
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.dataset.count, 10);

        animate({
          from: { n: 0 },
          to: { n: target },
          duration: 2400,
          easing: Ease.outExpo,
          onUpdate: function (v) {
            el.textContent = Math.floor(v.n).toLocaleString('pt-BR');
          },
          onDone: function () {
            el.textContent = target.toLocaleString('pt-BR');
          }
        });

        obs.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { obs.observe(el); });
  }


  /* ===========================================================
   * 8. ACCORDION CONTROLLER
   * =========================================================== */
  function initAccordion() {
    var list = document.getElementById('faq-list');
    if (!list) return;

    list.addEventListener('click', function (e) {
      var trigger = e.target.closest('.accordion__trigger');
      if (!trigger) return;

      var item = trigger.closest('.accordion');
      var panel = item.querySelector('.accordion__panel');
      var wasOpen = item.classList.contains('accordion--open');

      // Close all
      list.querySelectorAll('.accordion').forEach(function (acc) {
        acc.classList.remove('accordion--open');
        acc.querySelector('.accordion__trigger').setAttribute('aria-expanded', 'false');
        var p = acc.querySelector('.accordion__panel');
        animate({
          from: { h: p.scrollHeight },
          to: { h: 0 },
          duration: 400,
          easing: Ease.outQuart,
          onUpdate: function (v) { p.style.maxHeight = v.h + 'px'; }
        });
      });

      // Toggle clicked
      if (!wasOpen) {
        item.classList.add('accordion--open');
        trigger.setAttribute('aria-expanded', 'true');
        var target = panel.scrollHeight;
        panel.style.maxHeight = '0px';
        animate({
          from: { h: 0 },
          to: { h: target },
          duration: 500,
          easing: Ease.outExpo,
          onUpdate: function (v) { panel.style.maxHeight = v.h + 'px'; },
          onDone: function () { panel.style.maxHeight = target + 'px'; }
        });
      }
    });
  }


  /* ===========================================================
   * 9. FORM CONTROLLER
   * =========================================================== */
  var validators = {
    name: function (v) {
      if (!v.trim()) return 'Insira seu nome.';
      if (v.trim().length < 3) return 'Mínimo 3 caracteres.';
      return '';
    },
    email: function (v) {
      if (!v.trim()) return 'Insira seu e-mail.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'E-mail inválido.';
      return '';
    },
    phone: function (v) {
      if (!v.trim()) return 'Insira seu telefone.';
      if (v.replace(/\D/g, '').length < 10) return 'Telefone inválido.';
      return '';
    },
    message: function (v) {
      if (!v.trim()) return 'Descreva sua necessidade.';
      if (v.trim().length < 10) return 'Mínimo 10 caracteres.';
      return '';
    },
  };

  function setError(field, msg) {
    var inp = document.getElementById('form-' + field);
    var err = document.getElementById(field + '-error');
    if (msg) {
      inp.classList.add('form-field__input--error');
      err.textContent = msg;
    } else {
      inp.classList.remove('form-field__input--error');
      err.textContent = '';
    }
  }

  function validateOne(field) {
    var inp = document.getElementById('form-' + field);
    var msg = validators[field](inp.value);
    setError(field, msg);
    return !msg;
  }

  function initForm() {
    var form = document.getElementById('contact-form');
    var phoneInput = document.getElementById('form-phone');
    var submitBtn = document.getElementById('form-submit');
    var modal = document.getElementById('modal');
    var modalBackdrop = document.getElementById('modal-backdrop');
    var modalClose = document.getElementById('modal-close');
    var lastFocusedEl = null;

    // Phone mask
    phoneInput.addEventListener('input', function (e) {
      var d = e.target.value.replace(/\D/g, '');
      var m = '';
      if (d.length > 0) m += '(' + d.substring(0, 2);
      if (d.length > 2) m += ') ' + d.substring(2, 3);
      if (d.length > 3) m += ' ' + d.substring(3, 7);
      if (d.length > 7) m += '-' + d.substring(7, 11);
      e.target.value = m;
    });

    // Field events
    ['name', 'email', 'phone', 'message'].forEach(function (f) {
      var inp = document.getElementById('form-' + f);
      inp.addEventListener('blur', function () { validateOne(f); });
      inp.addEventListener('focus', function () { setError(f, ''); });
    });

    // Submit with loading spinner
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ok = validateOne('name') & ok;
      ok = validateOne('email') & ok;
      ok = validateOne('phone') & ok;
      ok = validateOne('message') & ok;

      if (ok) {
        submitBtn.disabled = true;
        submitBtn.classList.add('btn-magnetic--loading');

        setTimeout(function () {
          submitBtn.classList.remove('btn-magnetic--loading');
          showModal();
          form.reset();
          submitBtn.disabled = false;
        }, 1200);
      }
    });

    // Modal with focus trap
    function showModal() {
      lastFocusedEl = document.activeElement;
      modal.hidden = false;
      requestAnimationFrame(function () { modal.classList.add('modal--open'); });
      document.body.style.overflow = 'hidden';
      modalClose.focus();
    }

    function hideModal() {
      modal.classList.remove('modal--open');
      document.body.style.overflow = '';
      setTimeout(function () { modal.hidden = true; }, 350);
      if (lastFocusedEl) lastFocusedEl.focus();
    }

    // Focus trap inside modal
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    modalClose.addEventListener('click', hideModal);
    modalBackdrop.addEventListener('click', hideModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('modal--open')) hideModal();
    });
  }


  /* ===========================================================
   * 10. SCROLL PROGRESS
   * =========================================================== */
  function initScrollProgress() {
    var bar = document.getElementById('scroll-progress');
    var ticking = false;

    function update() {
      var scrollTop = window.pageYOffset;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = percent + '%';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
  }


  /* ===========================================================
   * 11. HEADER CONTROLLER
   * =========================================================== */
  function initHeader() {
    var header = document.getElementById('header');
    var ticking = false;

    function update() {
      header.classList.toggle('header--scrolled', window.pageYOffset > 40);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });

    update();
  }


  /* ===========================================================
   * 12. SMOOTH SCROLL — Anchor links
   * =========================================================== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = this.getAttribute('href');
        if (id === '#') return;
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          var offset = 68;
          var to = target.getBoundingClientRect().top + window.pageYOffset - offset;
          var from = window.pageYOffset;

          animate({
            from: { s: from },
            to: { s: to },
            duration: 1000,
            easing: Ease.outExpo,
            onUpdate: function (v) { window.scrollTo(0, v.s); }
          });
        }
      });
    });
  }


  /* ===========================================================
   * 13. FOOTER YEAR
   * =========================================================== */
  function initYear() {
    document.getElementById('footer-year').textContent = new Date().getFullYear();
  }


  /* ===========================================================
   * 14. WHATSAPP FAB — Hide on scroll down, show on scroll up
   * =========================================================== */
  function initWhatsAppFab() {
    var fab = document.getElementById('whatsapp-fab');
    if (!fab) return;

    var lastScroll = 0;
    var hidden = false;

    window.addEventListener('scroll', function () {
      var currentScroll = window.pageYOffset;
      if (currentScroll > lastScroll && currentScroll > 300 && !hidden) {
        fab.style.transform = 'translateY(100px)';
        fab.style.opacity = '0';
        hidden = true;
      } else if (currentScroll < lastScroll && hidden) {
        fab.style.transform = 'translateY(0)';
        fab.style.opacity = '1';
        hidden = false;
      }
      lastScroll = currentScroll;
    }, { passive: true });
  }


  /* ===========================================================
   * INIT
   * =========================================================== */
  function boot() {
    initHeader();
    initScrollProgress();
    initScrollAnimations();
    initParallax();
    initTilt();
    initMagneticButtons();
    initCounters();
    initAccordion();
    initForm();
    initSmoothScroll();
    initYear();
    initWhatsAppFab();
    initAboutScrollScene();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
