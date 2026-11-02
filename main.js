/* Alpha Life homepage behaviour: live hero shader (Paper Shaders "warp", Apache-2.0, see vendor/), word and card
   reveals, lazy video, mobile menu. Every effect has a reduced-motion or low-power fallback. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var lowPower = saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
                 (navigator.deviceMemory && navigator.deviceMemory <= 2);

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle'), nav = document.getElementById('nav');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });

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

  // Lazy video: nothing downloads until it nears the screen; it plays only while visible
  document.querySelectorAll('.lazy-video').forEach(function (video) {
    if (reduced || saveData) return; // the poster stays
    var loaded = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (!loaded) {
            video.querySelectorAll('source').forEach(function (s) { s.src = s.dataset.src; });
            video.load(); loaded = true;
          }
          var p = video.play(); if (p && p.catch) p.catch(function () {});
        } else if (loaded) { video.pause(); }
      });
    }, { rootMargin: '200px' });
    io.observe(video);
  });

  // Hero shader
  var VERT = '#version 300 es\nprecision highp float;layout(location=0)in vec4 a_position;void main(){gl_Position=a_position;}';
  // Shader settings read off the reference component: the "Prism" recipe with custom colours.
  var SHADER = { rotation: -50 * Math.PI / 180, proportion: 0.01, scale: 0.01, distortion: 0, swirl: 0.5,
                 swirlIterations: 16, softness: 0.47, shape: 0, shapeScale: 0.45, seedSeconds: -24.9, speed: 0.2 };

  function parseColor(c) {
    var m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
    return [m[1] / 255, m[2] / 255, m[3] / 255, m[4] === undefined ? 1 : parseFloat(m[4])];
  }

  function mount(canvas, fragSource) {
    var gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) return null;
    function compile(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, fragSource);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.bindAttribLocation(prog, 0, 'a_position'); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    function u(name) { return gl.getUniformLocation(prog, name); }
    gl.uniform1f(u('u_scale'), SHADER.scale); gl.uniform1f(u('u_rotation'), SHADER.rotation);
    gl.uniform1f(u('u_proportion'), SHADER.proportion); gl.uniform1f(u('u_softness'), SHADER.softness);
    gl.uniform1f(u('u_shape'), SHADER.shape); gl.uniform1f(u('u_shapeScale'), SHADER.shapeScale);
    gl.uniform1f(u('u_distortion'), SHADER.distortion); gl.uniform1f(u('u_swirl'), SHADER.swirl);
    gl.uniform1f(u('u_swirlIterations'), SHADER.swirlIterations);
    gl.uniform4fv(u('u_color1'), parseColor(canvas.dataset.c1));
    gl.uniform4fv(u('u_color2'), parseColor(canvas.dataset.c2));
    gl.uniform4fv(u('u_color3'), parseColor(canvas.dataset.c3));
    var uTime = u('u_time'), uRes = u('u_resolution'), uPx = u('u_pixelRatio');
    return {
      size: function (ratio) {
        var w = Math.round(canvas.clientWidth * ratio), h = Math.round(canvas.clientHeight * ratio);
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
        gl.uniform2f(uRes, w, h); gl.uniform1f(uPx, ratio);
      },
      draw: function (seconds) { gl.uniform1f(uTime, seconds); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 6); }
    };
  }

  function startShader(fragSource) {
    var canvases = Array.prototype.slice.call(document.querySelectorAll('.hero canvas.shader'));
    var hero = document.querySelector('.hero');
    var mounts = canvases.map(function (c) { return mount(c, fragSource); });
    if (mounts.some(function (m) { return !m; })) { canvases.forEach(function (c) { c.remove(); }); return; } // CSS gradient remains
    // Mobile and low-power devices render fewer pixels; the look is soft, so this is not visible
    var ratio = lowPower ? 0.5 : (innerWidth < 820 ? 0.75 : Math.min(devicePixelRatio || 1, 1));
    function resize() { mounts.forEach(function (m) { m.size(ratio); }); }
    addEventListener('resize', resize); resize();
    document.querySelector('.hero__shader').classList.add('live');
    var t0 = SHADER.seedSeconds, clock = 0, last = 0, raf = 0, visible = true;
    function frame(now) {
      raf = 0;
      if (last) clock += (now - last) * 0.001 * SHADER.speed;
      last = now;
      mounts.forEach(function (m) { m.draw(t0 + clock); });
      if (visible && !document.hidden && !reduced) raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    if (reduced) { frame(0); return; } // one still frame
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; wake(); }).observe(hero);
    document.addEventListener('visibilitychange', wake);
    wake();
    window.__alphaLifeShader = { canvases: canvases.length, seconds: function () { return clock; } };
  }

  fetch('vendor/warp.frag.txt').then(function (r) {
    if (!r.ok) throw new Error('shader missing');
    return r.text();
  }).then(startShader).catch(function () { /* CSS gradient remains */ });
})();
