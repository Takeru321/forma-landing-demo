/* ============================================================
   FORMA — shared interaction core
   Lenis smooth scroll + reveal system + cursor + magnetic buttons
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var lenis = null;

  /* ---------- Smooth scroll (Lenis) ---------- */
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({
      lerp: 0.08,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.25,
      syncTouch: false
    });

    if (window.gsap && window.ScrollTrigger) {
      window.ScrollTrigger.config({ ignoreMobileResize: true });
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      })(0);
    }
  }
  window.FORMA_LENIS = lenis;

  /* ---------- Anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -60, duration: 1.65 });
      } else {
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      }
    });
  });

  /* ---------- Scroll reveals ---------- */
  var revealTargets = document.querySelectorAll("[data-reveal], [data-split-group]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    function animateCount(el) {
      var end = parseFloat(el.getAttribute("data-count"));
      var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 2200;
      var start = 0;
      var startTime = null;
      function step(ts) {
        if (!startTime) startTime = ts;
        var p = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 5);
        var value = (end * eased).toFixed(decimals);
        el.textContent = prefix + Number(value).toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ("IntersectionObserver" in window && !reduceMotion) {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { countObserver.observe(el); });
    } else {
      counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
    }
  }

  /* ---------- Magnetic elements ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = parseFloat(el.getAttribute("data-magnetic")) || 0.35;
      var tx = 0, ty = 0, cx = 0, cy = 0, active = false;

      function render() {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        if (Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05) {
          cx = tx; cy = ty;
          el.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
          active = false;
          return;
        }
        el.style.transform = "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0)";
        requestAnimationFrame(render);
      }

      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        tx = (e.clientX - r.left - r.width / 2) * strength;
        ty = (e.clientY - r.top - r.height / 2) * strength;
        if (!active) { active = true; requestAnimationFrame(render); }
      });
      el.addEventListener("mouseleave", function () {
        tx = 0; ty = 0;
        if (!active) { active = true; requestAnimationFrame(render); }
      });
    });
  }

  /* ---------- Pointer-follow glow ---------- */
  if (finePointer) {
    document.querySelectorAll("[data-spotlight]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer) {
    var dot = document.createElement("div");
    var ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    var ringX = mouseX, ringY = mouseY;

    window.addEventListener("mousemove", function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
      dot.style.opacity = "1";
      ring.style.opacity = "1";
      dot.style.transform = "translate3d(" + mouseX + "px," + mouseY + "px,0)";
    }, { passive: true });

    var lastFrame = performance.now();
    function loop(now) {
      var dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      var k = 1 - Math.exp(-dt * 10);
      ringX += (mouseX - ringX) * k;
      ringY += (mouseY - ringY) * k;
      ring.style.transform = "translate3d(" + ringX.toFixed(2) + "px," + ringY.toFixed(2) + "px,0)";
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.addEventListener("mouseover", function (e) {
      var interactive = e.target.closest("a, button, [data-cursor-hover], input, textarea");
      ring.classList.toggle("is-hover", Boolean(interactive));
    });
  }

  /* ---------- Header scrolled state ---------- */
  var headers = document.querySelectorAll("[data-header]");
  if (headers.length) {
    function updateHeader() {
      var y = window.scrollY || document.documentElement.scrollTop;
      headers.forEach(function (h) { h.classList.toggle("is-scrolled", y > 24); });
    }
    window.addEventListener("scroll", updateHeader, { passive: true });
    if (lenis) lenis.on("scroll", updateHeader);
    updateHeader();
  }

  /* ---------- Dynamic year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
