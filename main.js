(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;
  var toggle = doc.querySelector(".nav-toggle");
  var nav = doc.getElementById("nav");
  var header = doc.querySelector(".site-header");
  root.classList.add("js");

  if (header) {
    var updateHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  function setMenu(open, restoreFocus) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (!open && restoreFocus) toggle.focus();
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open"))
        setMenu(false, true);
    });
    doc.addEventListener("pointerdown", function (event) {
      if (
        nav.classList.contains("is-open") &&
        !nav.contains(event.target) &&
        !toggle.contains(event.target)
      )
        setMenu(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 800) setMenu(false);
    });
  }

  var buttons = Array.prototype.slice.call(
    doc.querySelectorAll("[data-currency]"),
  );
  var preview = doc.querySelector("[data-currency-preview]");
  var select = doc.getElementById("currency-select");
  var status = doc.querySelector("[data-save-status]");
  var names = {
    USD: "US Dollars",
    EUR: "Euro",
    GBP: "British Pounds",
    ZAR: "South African Rand",
    BWP: "Botswana Pula",
  };
  var chosen = "USD";

  function setCurrency(value) {
    chosen = Object.prototype.hasOwnProperty.call(names, value) ? value : "USD";
    buttons.forEach(function (button) {
      var selected = button.dataset.currency === chosen;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    if (preview) {
      preview.textContent = "";
      var code = doc.createElement("strong");
      code.textContent = chosen;
      preview.append(
        code,
        doc.createTextNode(" — explore protection in " + names[chosen] + "."),
      );
    }
    if (select) select.value = chosen;
  }
  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      setCurrency(button.dataset.currency);
    });
  });
  try {
    var saved = localStorage.getItem("alpha-life-currency");
    if (saved) setCurrency(saved);
  } catch (error) {
    /* The currency choice remains usable without storage. */
  }
  if (select)
    select.addEventListener("change", function () {
      setCurrency(select.value);
    });
  var save = doc.querySelector("[data-save-choice]");
  if (save)
    save.addEventListener("click", function () {
      var message =
        "Saved on this device. This preview does not send an application.";
      try {
        localStorage.setItem("alpha-life-currency", chosen);
      } catch (error) {
        message =
          "Storage is blocked, but your selection works for this visit. This preview does not send an application.";
      }
      if (status) status.textContent = message;
    });

  var film = doc.getElementById("savanna-film");
  var filmButton = doc.querySelector("[data-film-toggle]");
  var hero = doc.querySelector(".hero");
  var story = doc.getElementById("vision-film");
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = motion.matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);

  if (film && filmButton && hero) {
    var loaded = false;
    var visible = false;
    var manualPause = false;
    filmButton.hidden = false;
    film.muted = true;

    function showHeroPlaying(playing) {
      filmButton.textContent = playing ? "Pause film" : "Play film";
      filmButton.setAttribute("aria-pressed", String(playing));
      hero.classList.toggle("is-playing", playing);
    }
    function loadHero() {
      if (loaded) return;
      film.querySelectorAll("source[data-src]").forEach(function (source) {
        source.src = source.dataset.src;
      });
      loaded = true;
      film.load();
    }
    function pauseHero() {
      film.pause();
      showHeroPlaying(false);
    }
    function playHero(force) {
      if (
        manualPause ||
        !visible ||
        doc.hidden ||
        (story && !story.paused) ||
        ((reduced || saveData) && !force)
      )
        return;
      loadHero();
      var request = film.play();
      if (request && request.catch)
        request.catch(function () {
          showHeroPlaying(false);
        });
    }
    filmButton.addEventListener("click", function () {
      if (!film.paused) {
        manualPause = true;
        pauseHero();
      } else {
        manualPause = false;
        visible = true;
        playHero(true);
      }
    });
    film.addEventListener("playing", function () {
      showHeroPlaying(true);
    });
    film.addEventListener("pause", function () {
      showHeroPlaying(false);
    });
    film.addEventListener("error", pauseHero);
    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) pauseHero();
      else if (!manualPause) playHero();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          visible = entries[0].isIntersecting;
          if (visible && !manualPause) playHero();
          else if (!visible) pauseHero();
        },
        { threshold: 0.12 },
      ).observe(hero);
    } else {
      visible = true;
    }
    var changeMotion = function (event) {
      reduced = event.matches;
      if (reduced) pauseHero();
    };
    if (motion.addEventListener)
      motion.addEventListener("change", changeMotion);
    else if (motion.addListener) motion.addListener(changeMotion);
    showHeroPlaying(false);
    if (!reduced && !saveData && visible) playHero();
  }

  var storyButton = doc.querySelector("[data-vision-play]");
  var storyStatus = doc.querySelector("[data-vision-status]");
  if (story && storyButton) {
    var storyLoaded = false;
    var storyAttempted = false;
    var loadingTimer;
    storyButton.hidden = false;
    story.controls = false;
    function clearLoadingTimer() {
      window.clearTimeout(loadingTimer);
    }
    function storyFailure() {
      if (!storyAttempted) return;
      storyAttempted = false;
      storyLoaded = false;
      clearLoadingTimer();
      story.pause();
      story.controls = false;
      storyButton.hidden = false;
      if (storyStatus)
        storyStatus.textContent =
          "The film could not start. Please press Play to try again.";
    }
    story.querySelectorAll("source").forEach(function (source) {
      source.addEventListener("error", storyFailure);
    });
    storyButton.addEventListener("click", function () {
      clearLoadingTimer();
      storyAttempted = true;
      if (storyStatus) storyStatus.textContent = "";
      loadingTimer = window.setTimeout(function () {
        if (storyAttempted && story.paused) storyFailure();
      }, 10000);
      if (!storyLoaded) {
        story.querySelectorAll("source[data-src]").forEach(function (source) {
          source.src = source.dataset.src;
        });
        storyLoaded = true;
        story.load();
      }
      story.controls = true;
      var request = story.play();
      if (request && request.catch) request.catch(storyFailure);
    });
    story.addEventListener("playing", function () {
      clearLoadingTimer();
      storyButton.hidden = true;
      if (film) film.pause();
    });
    story.addEventListener("ended", function () {
      clearLoadingTimer();
      storyAttempted = false;
      storyButton.hidden = false;
    });
    story.addEventListener("error", storyFailure);
    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) {
        clearLoadingTimer();
        storyAttempted = false;
        story.pause();
        storyButton.hidden = false;
      }
    });
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {
      /* Online reading does not depend on service-worker support. */
    });
  }
})();
