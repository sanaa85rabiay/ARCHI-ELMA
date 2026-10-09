/* ARCHI-ELMA — interactions */
(function () {
  "use strict";

  /* ---------- header ---------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (!header) return;
    if (header.classList.contains("solid")) return; // pages internes : toujours sombre
    header.classList.toggle("scrolled", window.scrollY > 60);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- menu mobile ---------- */
  var burger = document.querySelector(".burger");
  var menu = document.querySelector(".mobile-menu");
  var closeBtn = document.querySelector(".menu-close");
  function toggleMenu(open) {
    if (!menu) return;
    menu.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (burger) burger.addEventListener("click", function () { toggleMenu(true); });
  if (closeBtn) closeBtn.addEventListener("click", function () { toggleMenu(false); });
  if (menu) menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { toggleMenu(false); });
  });

  /* ---------- apparition au scroll : AOS (CDN) ----------
     fade-up léger, 600 ms, offset 20 px, une seule fois.
     Désactivé si l'utilisateur préfère réduire les animations. */
  if (window.AOS) {
    AOS.init({
      duration: 600,
      offset: 20,
      once: true,
      disable: window.matchMedia("(prefers-reduced-motion: reduce)").matches
    });
  } else {
    // filet de sécurité si le CDN est indisponible : tout afficher sans animation
    var st = document.createElement("style");
    st.textContent = "[data-aos]{opacity:1!important;transform:none!important;transition:none!important}";
    document.head.appendChild(st);
  }

  /* ---------- hero slider (7 s / slide) ---------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dotsWrap = hero.querySelector(".hero-dots");
    var DURATION = 7000;
    var current = 0, timer = null;

    // construction des points
    slides.forEach(function (_, i) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", "Slide " + (i + 1));
      b.innerHTML = "<i></i>";
      b.addEventListener("click", function () { go(i, true); });
      dotsWrap.appendChild(b);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);
    var countEl = hero.querySelector(".hero-count");

    function playMedia(slide, play) {
      var vs = slide.querySelectorAll("video");
      vs.forEach(function (v) {
        if (play) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else { v.pause(); v.currentTime = 0; }
      });
    }

    function go(n, manual) {
      slides[current].classList.remove("active");
      dots[current].classList.remove("active");
      playMedia(slides[current], false);
      current = (n + slides.length) % slides.length;
      slides[current].classList.add("active");
      dots[current].classList.remove("active");
      void dots[current].offsetWidth; // relance l'animation de progression
      dots[current].classList.add("active");
      playMedia(slides[current], true);
      if (countEl) countEl.innerHTML = "<b>0" + (current + 1) + "</b> / 0" + slides.length;
      scheduleAdvance();
    }

    // le slide 1 (vidéo) reste affiché jusqu'à la fin du clip, puis on passe au slide 2
    var heroTimer = null;
    function scheduleAdvance() {
      clearTimeout(heroTimer);
      var slide = slides[current];
      var v = slide.querySelector("video");
      var dotFill = dots[current].querySelector("i");
      var isClip = v && !v.hasAttribute("loop") && !v.loop;
      var dur = DURATION;
      if (isClip) {
        if (isFinite(v.duration) && v.duration > 0) {
          dur = v.duration * 1000;
        } else {
          v.addEventListener("loadedmetadata", function () {
            if (slides[current] === slide && isFinite(v.duration)) {
              dur = v.duration * 1000;
              if (dotFill) dotFill.style.animationDuration = dur + "ms";
            }
          }, { once: true });
          dur = 12000; // valeur de secours en attendant les métadonnées
        }
        v.onended = function () { go(current + 1, false); };
      }
      if (dotFill) dotFill.style.animationDuration = dur + "ms";
      if (!isClip) heroTimer = setTimeout(function () { go(current + 1, false); }, DURATION);
    }

    var prev = hero.querySelector(".arr-prev");
    var next = hero.querySelector(".arr-next");
    if (prev) prev.addEventListener("click", function () { go(current - 1, true); });
    if (next) next.addEventListener("click", function () { go(current + 1, true); });

    // initialise
    slides[0].classList.add("active");
    dots[0].classList.add("active");
    playMedia(slides[0], true);
    if (countEl) countEl.innerHTML = "<b>01</b> / 0" + slides.length;
    scheduleAdvance();
  }

  /* ---------- accordéon projets (hover / tactile) ---------- */
  var accord = document.querySelector(".accord");
  if (accord) {
    var panels = Array.prototype.slice.call(accord.querySelectorAll(".accord-panel"));
    var soundOn = false;
    var soundBtn = accord.querySelector(".sound-btn");
    function openPanel(p) {
      panels.forEach(function (x) {
        var isTarget = x === p;
        x.classList.toggle("open", isTarget);
        var v = x.querySelector("video");
        if (v) {
          v.muted = !soundOn;
          if (isTarget) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else { v.pause(); }
        }
      });
      // mobile / tablette : l'icône son suit le panneau ouvert
      if (soundBtn && window.matchMedia("(max-width:1080px)").matches) {
        p.appendChild(soundBtn);
      }
    }
    panels.forEach(function (p) {
      p.addEventListener("mouseenter", function () { openPanel(p); });
      p.addEventListener("click", function () { openPanel(p); });
    });
    // premier panneau ouvert par défaut
    panels[0].classList.add("open");
    var v0 = panels[0].querySelector("video");
    if (v0) { var pr0 = v0.play(); if (pr0 && pr0.catch) pr0.catch(function () {}); }

    // bouton son : les vidéos ont été ré-encodées AVEC piste audio,
    // elles démarrent en sourdine (politique des navigateurs) et se démutent ici
    if (soundBtn) {
      var iconOn = soundBtn.querySelector(".ic-on");
      var iconOff = soundBtn.querySelector(".ic-off");
      soundBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        var enable = soundBtn.getAttribute("aria-pressed") !== "true";
        soundOn = enable;
        soundBtn.setAttribute("aria-pressed", enable ? "true" : "false");
        panels.forEach(function (x) {
          var v = x.querySelector("video");
          if (v) v.muted = !enable;
        });
        if (iconOn) iconOn.style.display = enable ? "" : "none";
        if (iconOff) iconOff.style.display = enable ? "none" : "";
        soundBtn.classList.toggle("on", enable);
      });
    }

    // état initial : sur mobile, placer l'icône dans le panneau déjà ouvert
    if (soundBtn && window.matchMedia("(max-width:1080px)").matches) {
      var initOpen = accord.querySelector(".accord-panel.open") || panels[0];
      initOpen.appendChild(soundBtn);
    }
  }

  /* ---------- vidéo du cabinet : son automatique à l'arrivée dans la section ----------
     La vidéo démarre en sourdine (autoplay autorisé), puis dès que la section
     devient visible on tente de jouer ; la promesse play() résolue permet de
     couper le mute sans geste utilisateur — comme sur le site de Sara. */
  var cabinetMedia = document.querySelector(".cabinet-media");
  if (cabinetMedia) {
    var cv = cabinetMedia.querySelector("video");
    var cSoundBtn = cabinetMedia.querySelector(".sound-btn");
    var cIconOn = cSoundBtn ? cSoundBtn.querySelector(".ic-on") : null;
    var cIconOff = cSoundBtn ? cSoundBtn.querySelector(".ic-off") : null;

    function setCabinetSound(on) {
      if (!cv) return;
      cv.muted = !on;
      if (cSoundBtn) {
        cSoundBtn.setAttribute("aria-pressed", on ? "true" : "false");
        cSoundBtn.classList.toggle("on", on);
        if (cIconOn) cIconOn.style.display = on ? "" : "none";
        if (cIconOff) cIconOff.style.display = on ? "none" : "";
      }
    }

    if (cv && "IntersectionObserver" in window) {
      var cabIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var pr = cv.play();
            if (pr && pr.then) {
              pr.then(function () { setCabinetSound(true); }).catch(function () {});
            } else {
              setCabinetSound(true);
            }
          } else {
            setCabinetSound(false); // hors de la section : on coupe le son
          }
        });
      }, { threshold: 0.35 });
      cabIO.observe(cabinetMedia);
    }

    if (cSoundBtn && cv) {
      cSoundBtn.addEventListener("click", function () {
        var on = cSoundBtn.getAttribute("aria-pressed") !== "true";
        var pr = cv.play();
        if (pr && pr.catch) pr.catch(function () {});
        setCabinetSound(on);
      });
    }
  }

  /* ---------- formulaire → WhatsApp ---------- */
  var form = document.querySelector("#project-form");
  if (form) {
    var isEnForm = form.getAttribute("data-lang") === "en";
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var d = new FormData(form);
      var msg = isEnForm
        ? "Hello ARCHI-ELMA,%0A%0A" +
          "Name: " + encodeURIComponent(d.get("nom") || "") + "%0A" +
          "Phone: " + encodeURIComponent(d.get("tel") || "") + "%0A" +
          "Email: " + encodeURIComponent(d.get("email") || "") + "%0A" +
          "Project type: " + encodeURIComponent(d.get("type") || "") + "%0A" +
          "Message: " + encodeURIComponent(d.get("message") || "")
        : "Bonjour ARCHI-ELMA,%0A%0A" +
          "Nom : " + encodeURIComponent(d.get("nom") || "") + "%0A" +
          "Téléphone : " + encodeURIComponent(d.get("tel") || "") + "%0A" +
          "Email : " + encodeURIComponent(d.get("email") || "") + "%0A" +
          "Type de projet : " + encodeURIComponent(d.get("type") || "") + "%0A" +
          "Message : " + encodeURIComponent(d.get("message") || "");
      window.open("https://wa.me/212666587783?text=" + msg, "_blank");
    });
  }

  /* ---------- carte Google (chargement différé) ---------- */
  var mapFrame = document.querySelector("iframe[data-src]");
  if (mapFrame) {
    var loadMap = function () { mapFrame.src = mapFrame.getAttribute("data-src"); };
    if ("IntersectionObserver" in window) {
      var mapIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { loadMap(); mapIO.disconnect(); }
        });
      }, { rootMargin: "200px" });
      mapIO.observe(mapFrame);
    } else { setTimeout(loadMap, 1500); }
  }

  /* ---------- année du footer ---------- */
  document.querySelectorAll(".js-year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
