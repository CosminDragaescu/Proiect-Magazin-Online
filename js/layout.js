/* =========================================================
   Layout comun: header (search + cont + coș), footer,
   drawer coș și overlay de căutare — injectate pe fiecare
   pagină. Pagina setează <body data-page="..."> pentru
   marcarea linkului activ.
   ========================================================= */

(function () {
  const page = document.body.dataset.page || "";
  const isActive = (p) => (p === page ? "active" : "");

  const header = `
    <div class="topbar">Livrare gratuită la comenzile de peste 450 lei · Confecționat manual în România</div>
    <header class="header">
      <div class="container nav">
        <button class="nav-toggle" aria-label="Meniu">☰</button>
        <nav>
          <ul class="nav-menu">
            <li><a href="index.html" class="${isActive("acasa")}">Acasă</a></li>
            <li><a href="magazin.html" class="${isActive("magazin")}">Magazin</a></li>
            <li><a href="index.html#colectie" class="${isActive("colectie")}">Colecție</a></li>
            <li><a href="contact.html" class="${isActive("contact")}">Contact</a></li>
          </ul>
        </nav>
        <a href="index.html" class="logo">Atelier</a>
        <div class="nav-actions">
          <button data-open-search aria-label="Caută">Caută</button>
          <span id="account-slot">${accountMarkup()}</span>
          <button data-open-cart aria-label="Coș">Coș <span class="cart-count">0</span></button>
        </div>
      </div>
    </header>`;

  const footer = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="index.html" class="logo">Atelier</a>
            <p>Haine confecționate manual, în ediții limitate. Croite în România.</p>
          </div>
          <div class="footer-col">
            <h4>Magazin</h4>
            <ul>
              <li><a href="magazin.html">Toate produsele</a></li>
              <li><a href="magazin.html">Hanorace</a></li>
              <li><a href="magazin.html">Pantaloni</a></li>
              <li><a href="magazin.html">Seturi</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Cont</h4>
            <ul>
              <li><a href="cont.html">Contul meu</a></li>
              <li><a href="cont.html">Comenzile mele</a></li>
              <li><a href="cos.html">Coșul</a></li>
              <li><a href="contact.html">Contact</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Abonează-te la jurnal</h4>
            <form class="newsletter-form footer-news-form">
              <input type="email" placeholder="Adresa de email" required />
              <button type="submit" aria-label="Abonează-te">→</button>
            </form>
            <div class="socials" style="margin-top:24px">
              <a href="#">Instagram</a><a href="#">TikTok</a><a href="#">Facebook</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 Atelier. Fabricat cu măiestrie în România.</span>
          <div class="socials"><a href="#">IG</a><a href="#">TT</a><a href="#">FB</a></div>
        </div>
      </div>
    </footer>`;

  const drawer = `
    <div class="cart-overlay" id="cart-overlay" data-close-cart></div>
    <aside class="cart-drawer" id="cart-drawer" aria-label="Coș de cumpărături">
      <div class="cart-header">
        <h3>Coșul tău</h3>
        <button class="cart-close" data-close-cart aria-label="Închide">×</button>
      </div>
      <div class="cart-items" id="cart-items"></div>
      <div class="cart-footer">
        <div class="cart-total"><span>Subtotal</span><span class="amount" id="cart-total">0 lei</span></div>
        <a href="cos.html" class="btn btn-light" style="width:100%;text-align:center;margin-bottom:10px">Vezi coșul</a>
        <a href="checkout.html" class="btn btn-dark" id="checkout-btn" style="width:100%;text-align:center">Finalizează comanda</a>
      </div>
    </aside>`;

  const search = `
    <div class="search-overlay" id="search-overlay">
      <div class="search-panel">
        <div class="container">
          <div class="search-bar">
            <input type="text" id="search-input" placeholder="Caută produse…" autocomplete="off" />
            <button data-close-search aria-label="Închide" class="search-close">×</button>
          </div>
          <p class="search-hint" id="search-hint">Scrie pentru a căuta printre produse.</p>
          <div class="product-grid search-results" id="search-results"></div>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer + drawer + search);

  // interacțiuni meniu cont
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-toggle-account]");
    const dropdown = document.getElementById("account-dropdown");
    if (trigger) {
      e.preventDefault();
      dropdown?.classList.toggle("open");
      return;
    }
    if (e.target.closest("#header-logout")) {
      if (typeof logoutUser === "function") logoutUser();
      location.href = "index.html";
      return;
    }
    if (dropdown && !e.target.closest(".account-menu")) {
      dropdown.classList.remove("open");
    }
  });
})();

/* markup pentru zona de cont din header (link simplu sau meniu) */
function accountMarkup() {
  const user = typeof currentUser === "function" ? currentUser() : null;
  if (!user) return `<a href="cont.html" id="account-link" aria-label="Cont">Cont</a>`;
  const first = user.name.split(" ")[0];
  return `
    <div class="account-menu">
      <button class="account-trigger" id="account-link" data-toggle-account aria-label="Contul meu">${first} ▾</button>
      <div class="account-dropdown" id="account-dropdown">
        <a href="cont.html">Contul tău</a>
        <a href="cont.html#comenzi">Comenzi</a>
        <a href="cont.html#retur">Returnează articol</a>
        <a href="contact.html">Ajutor și contact</a>
        <button class="account-logout" id="header-logout">Nu ești ${first}? Deconectează-te</button>
      </div>
    </div>`;
}

/* actualizează zona de cont din header (după login/logout) */
function updateAccountNav() {
  const slot = document.getElementById("account-slot");
  if (slot) slot.innerHTML = accountMarkup();
}
