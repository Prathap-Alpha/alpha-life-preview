/* Alpha Life: word/card reveals, mobile menu and a lazy, silent brand film.
   Generated film is decorative; website content never depends on its playback. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);

  var toggle = document.querySelector('.nav-toggle'), nav = document.getElementById('nav');
  function setMenu(open, returnFocus) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (!open && returnFocus) toggle.focus();
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false, true);
  });
  document.addEventListener('pointerdown', function (e) {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });
  matchMedia('(min-width: 821px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  document.querySelectorAll('.reveal-words').forEach(function (el) {
    var label = el.textContent, i = 0;
    el.setAttribute('aria-label', label);
    var words = label.split(' ');
    el.textContent = '';
    words.forEach(function (word, n) {
      var w = document.createElement('span');
      w.className = 'w'; w.setAttribute('aria-hidden', 'true'); w.style.setProperty('--i', i++);
      w.textContent = word + (n < words.length - 1 ? ' ' : '');
      el.appendChild(w);
    });
  });

  document.querySelectorAll('.trio, .moments, .outcomes, .split').forEach(function (group) {
    group.querySelectorAll('.rise').forEach(function (el, n) { el.style.setProperty('--d', n * 90 + 'ms'); });
  });
  var targets = document.querySelectorAll('.rise, .reveal-words');
  if ('IntersectionObserver' in window && !reduced) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(function (el) { seen.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }

  document.querySelectorAll('video.lazy-video').forEach(function (video) {
    var scene = video.closest('.film__scene');
    var button = document.querySelector('.film-toggle[data-video="' + video.id + '"]');
    var loaded = false, visible = false, manualPause = false;
    var allowed = !reduced && !saveData;
    button.hidden = false;
    video.muted = true;

    function showPlaying(playing) {
      scene.classList.toggle('is-playing', playing);
      button.textContent = playing ? 'Pause film' : 'Play film';
    }
    function load() {
      if (loaded) return;
      video.querySelectorAll('source[data-src]').forEach(function (source) {
        source.src = source.dataset.src;
      });
      loaded = true;
      video.load();
    }
    function play() {
      if (!allowed || manualPause || !visible || document.hidden) return;
      load();
      var request = video.play();
      if (request && request.catch) request.catch(function () { showPlaying(false); });
    }
    function pause() {
      video.pause();
      showPlaying(false);
    }
    video.addEventListener('playing', function () { showPlaying(true); });
    video.addEventListener('pause', function () { showPlaying(false); });
    video.addEventListener('error', function () { showPlaying(false); });
    video.addEventListener('loadeddata', function () { if (visible) play(); });
    button.addEventListener('click', function () {
      if (!video.paused) {
        manualPause = true;
        pause();
      } else {
        allowed = true;
        manualPause = false;
        visible = true;
        play();
      }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause();
      else play();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) play();
        else pause();
      }, { threshold: 0.1 }).observe(scene);
    }
    // Without observer support, the poster stays until the viewer presses Play.
    showPlaying(false);
  });
})();
