/* Alpha Life homepage behaviour: word and card
   reveals, mobile menu. Every effect has a reduced-motion or low-power fallback. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var lowPower = saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
                 (navigator.deviceMemory && navigator.deviceMemory <= 2);

  // Mobile menu
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

  // Word-by-word blur reveal on headings
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

  // Reveal on scroll, staggered within a row
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
})();
