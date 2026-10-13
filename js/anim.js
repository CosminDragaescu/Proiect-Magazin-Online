/* =========================================================
   ATELIER — strat de animații (premium, cald)
   - Reveal la scroll (fade/slide + wipe pe imagini), cu stagger
   - Parallax subtil pe hero
   - Respectă prefers-reduced-motion
   Fără dependențe. Se încarcă ultimul, după main.js.
   ========================================================= */
(function () {
  /* Animațiile rulează mereu (la cererea proprietarului), indiferent de
     setarea de sistem „reduced motion”. */

  /* ---------- Reveal la scroll ---------- */
  function setupReveal() {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    // stagger: indexează copiii din grupurile [data-stagger]
    document.querySelectorAll("[data-stagger]").forEach((group) => {
      const step = parseFloat(group.dataset.stagger) || 90; // ms
      [...group.children].forEach((child, i) => {
        if (child.hasAttribute("data-reveal")) {
          child.style.setProperty("--reveal-delay", `${i * step}ms`);
        }
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach((el) => io.observe(el));
  }

  /* ---------- Produse injectate de main.js (stagger) ---------- */
  function setupProductReveal() {
    const grid = document.getElementById("featured-grid");
    if (!grid) return;
    const cards = grid.querySelectorAll(".product-card");
    if (!cards.length) return;

    if (!("IntersectionObserver" in window)) {
      cards.forEach((c) => c.classList.add("is-visible"));
      return;
    }

    cards.forEach((c, i) => {
      c.classList.add("reveal-card");
      c.style.setProperty("--reveal-delay", `${(i % 4) * 90}ms`);
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    cards.forEach((c) => io.observe(c));
  }

  /* ---------- Parallax subtil pe hero ---------- */
  function setupParallax() {
    const img = document.querySelector(".hero--editorial .hero-img");
    if (!img) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight) {
          img.style.transform = `translate3d(0, ${y * 0.18}px, 0) scale(${1 + y * 0.00012})`;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Plasă de siguranță: dacă observer-ul nu a dezvăluit un element care e
     DEJA în/peste ecran (ex. IO defect), îl facem vizibil oricum. Ce e încă
     sub fold rămâne ascuns, ca să-și păstreze reveal-ul la scroll. */
  function safetyNet() {
    setTimeout(() => {
      document
        .querySelectorAll("[data-reveal]:not(.is-visible), .reveal-card:not(.is-visible)")
        .forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add("is-visible");
          }
        });
    }, 2500);
  }

  function init() {
    document.body.classList.add("anim-ready");
    setupReveal();
    setupProductReveal();
    setupParallax();
    safetyNet();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
