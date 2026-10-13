/* =========================================================
   Logica site-ului: render produse, coș (pe variantă mărime),
   filtre, căutare, pagina coș, checkout, voucher, toast.
   ========================================================= */

const LEI = (n) => Math.round(n).toLocaleString("ro-RO") + " lei";
const SHIPPING_FREE_OVER = 450;
const SHIPPING_COST = 19;
const sizesOf = (p) => p.sizes || DEFAULT_SIZES;

/* ---------------- Card produs ---------------- */
function productCard(p) {
  const badge = p.badge
    ? `<span class="badge ${p.badge === "Reducere" ? "sale" : ""}">${p.badge}</span>`
    : "";
  const media = p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy" />`
    : `<div class="ph">${p.name}</div>`;
  const price = p.oldPrice
    ? `<span class="sale">${LEI(p.price)}</span><span class="old">${LEI(p.oldPrice)}</span>`
    : `<span>${LEI(p.price)}</span>`;
  const swatches = p.colors
    .map((c) => `<span class="swatch" style="background:${c}"></span>`)
    .join("");
  const sizeChips = sizesOf(p)
    .map((s) => `<button class="size-chip" data-add="${p.id}" data-size="${s}">${s}</button>`)
    .join("");

  const href = `produs.html?id=${p.id}`;
  return `
    <article class="product-card" data-category="${p.category}">
      <div class="product-media">
        ${badge}
        <a href="${href}" class="product-media-link" aria-label="${p.name}">${media}</a>
        <div class="product-action">
          <button class="product-add" data-add-trigger="${p.id}">Adaugă în coș</button>
          <div class="size-pick">
            <span class="size-pick-label">Alege mărimea</span>
            <div class="size-pick-row">${sizeChips}</div>
          </div>
        </div>
      </div>
      <div class="product-info">
        <p class="product-cat">${p.category}</p>
        <a href="${href}"><h3>${p.name}</h3></a>
        <div class="product-price">${price}</div>
        <div class="swatches">${swatches}</div>
      </div>
    </article>`;
}

function renderProducts(targetId, list) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = list.map(productCard).join("");
}

/* ---------------- Filtre (magazin) ---------------- */
function initFilters() {
  const filterBar = document.getElementById("filters");
  if (!filterBar) return;
  filterBar.innerHTML = CATEGORIES.map(
    (c, i) =>
      `<button class="filter-btn ${i === 0 ? "active" : ""}" data-filter="${c}">${c}</button>`
  ).join("");

  filterBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    filterBar.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const cat = btn.dataset.filter;
    const list = cat === "Toate" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);
    renderProducts("shop-grid", list);
  });
}

/* ================= COȘ (date, cheie = id + mărime) ================= */
const CART_KEY = "atelier_cart";
const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");
const saveCart = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));
const sameLine = (i, id, size) => i.id === id && (i.size || "") === (size || "");

function addToCart(id, size) {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return;
  if (!size) size = sizesOf(product)[0];
  const cart = getCart();
  const existing = cart.find((i) => sameLine(i, id, size));
  if (existing) existing.qty += 1;
  else cart.push({ id, size, qty: 1 });
  saveCart(cart);
  refreshCartViews();
  showToast(`„${product.name}" (${size}) adăugat în coș`);
  openCart();
}

function changeQty(id, size, delta) {
  let cart = getCart();
  const item = cart.find((i) => sameLine(i, id, size));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => !sameLine(i, id, size));
  saveCart(cart);
  refreshCartViews();
}

function removeItem(id, size) {
  saveCart(getCart().filter((i) => !sameLine(i, id, size)));
  refreshCartViews();
}

const cartCount = () => getCart().reduce((s, i) => s + i.qty, 0);
const cartSubtotal = () =>
  getCart().reduce((s, i) => {
    const p = PRODUCTS.find((x) => x.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
const shippingCost = () => {
  const sub = cartSubtotal();
  return sub === 0 || sub >= SHIPPING_FREE_OVER ? 0 : SHIPPING_COST;
};

function refreshCartViews() {
  renderCartDrawer();
  renderCartPage();
  renderCheckoutSummary();
}

/* ---------------- Drawer coș ---------------- */
function renderCartDrawer() {
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = cartCount();
    el.style.display = cartCount() ? "inline" : "none";
  });

  const itemsEl = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  if (!itemsEl) return;

  const cart = getCart();
  if (!cart.length) {
    itemsEl.innerHTML = `<p class="cart-empty">Coșul tău este gol.</p>`;
    if (totalEl) totalEl.textContent = LEI(0);
    return;
  }

  itemsEl.innerHTML = cart.map(cartLineMarkup).join("");
  if (totalEl) totalEl.textContent = LEI(cartSubtotal());
}

function cartLineMarkup(item) {
  const p = PRODUCTS.find((x) => x.id === item.id);
  if (!p) return "";
  const thumb = p.image
    ? `<img class="thumb" src="${p.image}" alt="${p.name}" />`
    : `<div class="thumb"></div>`;
  const sz = item.size || "—";
  return `
    <div class="cart-item">
      ${thumb}
      <div>
        <h4>${p.name}</h4>
        <p class="meta">Mărime: ${sz} · ${LEI(p.price)}</p>
        <div class="qty">
          <button data-act="minus" data-id="${p.id}" data-size="${item.size || ""}">−</button>
          <span>${item.qty}</span>
          <button data-act="plus" data-id="${p.id}" data-size="${item.size || ""}">+</button>
        </div>
      </div>
      <button class="remove" data-act="remove" data-id="${p.id}" data-size="${item.size || ""}">Șterge</button>
    </div>`;
}

function openCart() {
  document.getElementById("cart-drawer")?.classList.add("open");
  document.getElementById("cart-overlay")?.classList.add("open");
}
function closeCart() {
  document.getElementById("cart-drawer")?.classList.remove("open");
  document.getElementById("cart-overlay")?.classList.remove("open");
}

/* ================= CĂUTARE ================= */
function openSearch() {
  document.getElementById("search-overlay")?.classList.add("open");
  setTimeout(() => document.getElementById("search-input")?.focus(), 50);
}
function closeSearch() {
  document.getElementById("search-overlay")?.classList.remove("open");
}
function runSearch(q) {
  const results = document.getElementById("search-results");
  const hint = document.getElementById("search-hint");
  if (!results) return;
  q = q.trim().toLowerCase();
  if (!q) {
    results.innerHTML = "";
    hint.textContent = "Scrie pentru a căuta printre produse.";
    return;
  }
  const found = PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );
  hint.textContent = found.length
    ? `${found.length} rezultat${found.length === 1 ? "" : "e"} pentru „${q}"`
    : `Niciun rezultat pentru „${q}"`;
  results.innerHTML = found.map(productCard).join("");
}

/* ================= PAGINA COȘ (cos.html) ================= */
function renderCartPage() {
  const wrap = document.getElementById("cart-page");
  if (!wrap) return;
  const cart = getCart();

  if (!cart.length) {
    wrap.innerHTML = `
      <div class="cart-empty-page">
        <p>Coșul tău este gol.</p>
        <a href="magazin.html" class="btn btn-dark">Spre magazin</a>
      </div>`;
    return;
  }

  const lines = cart
    .map((item) => {
      const p = PRODUCTS.find((x) => x.id === item.id);
      if (!p) return "";
      const thumb = p.image
        ? `<img src="${p.image}" alt="${p.name}" />`
        : `<div class="thumb"></div>`;
      const sz = item.size || "";
      return `
        <div class="cartp-item">
          <div class="cartp-media">${thumb}</div>
          <div class="cartp-info">
            <p class="product-cat">${p.category}</p>
            <h3 class="serif">${p.name}</h3>
            <p class="cartp-price">Mărime: <strong>${sz || "—"}</strong> · ${LEI(p.price)}</p>
          </div>
          <div class="cartp-qty">
            <button data-act="minus" data-id="${p.id}" data-size="${sz}">−</button>
            <span>${item.qty}</span>
            <button data-act="plus" data-id="${p.id}" data-size="${sz}">+</button>
          </div>
          <div class="cartp-line-total">${LEI(p.price * item.qty)}</div>
          <button class="cartp-remove" data-act="remove" data-id="${p.id}" data-size="${sz}" aria-label="Șterge">×</button>
        </div>`;
    })
    .join("");

  wrap.innerHTML = `
    <div class="cartp-grid">
      <div class="cartp-list">${lines}</div>
      <aside class="cartp-summary">
        <h3 class="serif">Sumar comandă</h3>
        ${summaryRows()}
        <a href="checkout.html" class="btn btn-dark" style="width:100%;text-align:center;margin-top:20px">Continuă spre checkout</a>
        <a href="magazin.html" class="cartp-continue">Continuă cumpărăturile</a>
      </aside>
    </div>`;
}

function summaryRows() {
  const sub = cartSubtotal();
  const ship = shippingCost();
  const shipLabel = ship === 0 ? "Gratuită" : LEI(ship);
  const remaining = SHIPPING_FREE_OVER - sub;
  const freeNote =
    sub > 0 && sub < SHIPPING_FREE_OVER
      ? `<p class="ship-note">Mai adaugă ${LEI(remaining)} pentru livrare gratuită.</p>`
      : "";
  return `
    <div class="sum-row"><span>Subtotal</span><span>${LEI(sub)}</span></div>
    <div class="sum-row"><span>Livrare</span><span>${shipLabel}</span></div>
    ${freeNote}
    <div class="sum-row sum-total"><span>Total</span><span class="amount">${LEI(sub + ship)}</span></div>`;
}

/* ================= CHECKOUT (checkout.html) ================= */
let VOUCHER = { code: null, pct: 0 };
const VOUCHERS = { ATELIER10: 0.1, BINEAIVENIT: 0.15 };

function deliveryRange() {
  const fmt = (d) =>
    d.toLocaleDateString("ro-RO", { weekday: "short", day: "2-digit", month: "short" });
  const from = new Date(Date.now() + 2 * 864e5);
  const to = new Date(Date.now() + 4 * 864e5);
  return `${fmt(from)} – ${fmt(to)}`;
}

function checkoutTotals() {
  const sub = cartSubtotal();
  const discount = Math.round(sub * VOUCHER.pct);
  const ship = shippingCost();
  return { sub, discount, ship, total: sub - discount + ship };
}

function renderCheckoutSummary() {
  const el = document.getElementById("checkout-summary");
  if (!el) return;
  const cart = getCart();
  if (!cart.length) {
    el.innerHTML = `<p class="cart-empty">Coșul este gol.</p>`;
    return;
  }
  const lines = cart
    .map((item) => {
      const p = PRODUCTS.find((x) => x.id === item.id);
      if (!p) return "";
      const thumb = p.image ? `<img src="${p.image}" alt="${p.name}" />` : "";
      return `
        <div class="co-line">
          <div class="co-thumb">${thumb}<span class="co-qty">${item.qty}</span></div>
          <div class="co-name">
            <h4>${p.name}</h4>
            <span>${p.category} · Mărime ${item.size || "—"}</span>
          </div>
          <div class="co-price">${LEI(p.price * item.qty)}</div>
        </div>`;
    })
    .join("");

  const t = checkoutTotals();
  const shipLabel = t.ship === 0 ? "Gratuită" : LEI(t.ship);
  const discountRow = t.discount
    ? `<div class="sum-row sum-discount"><span>Reducere (${VOUCHER.code})</span><span>−${LEI(t.discount)}</span></div>`
    : "";

  el.innerHTML = `
    <div class="co-delivery">
      <span class="co-deliv-label">Livrare estimată</span>
      <strong>${deliveryRange()}</strong>
      <span class="co-deliv-free">${t.ship === 0 ? "Livrare standard gratuită" : "Livrare standard"}</span>
    </div>
    <div class="co-lines">${lines}</div>
    <div class="voucher">
      <input type="text" id="voucher-input" placeholder="Cod voucher" value="${VOUCHER.code || ""}" />
      <button type="button" id="voucher-apply">Aplică</button>
    </div>
    <p class="voucher-msg" id="voucher-msg"></p>
    <div class="sum-row"><span>Subtotal</span><span>${LEI(t.sub)}</span></div>
    ${discountRow}
    <div class="sum-row"><span>Livrare</span><span>${shipLabel}</span></div>
    <div class="sum-row sum-total"><span>Total <small>(TVA inclus)</small></span><span class="amount">${LEI(t.total)}</span></div>`;
}

function applyVoucher() {
  const input = document.getElementById("voucher-input");
  const msg = document.getElementById("voucher-msg");
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  if (!code) {
    VOUCHER = { code: null, pct: 0 };
    renderCheckoutSummary();
    return;
  }
  if (VOUCHERS[code]) {
    VOUCHER = { code, pct: VOUCHERS[code] };
    renderCheckoutSummary();
    const m = document.getElementById("voucher-msg");
    if (m) {
      m.textContent = `Voucher aplicat: −${VOUCHER.pct * 100}%`;
      m.className = "voucher-msg ok";
    }
  } else {
    VOUCHER = { code: null, pct: 0 };
    renderCheckoutSummary();
    const m = document.getElementById("voucher-msg");
    if (m) {
      m.textContent = "Cod voucher invalid.";
      m.className = "voucher-msg err";
    }
  }
}

function setStep(n) {
  document.querySelectorAll(".checkout-steps li").forEach((li, i) => {
    li.classList.toggle("active", i === n);
    li.classList.toggle("done", i < n);
  });
}

function initCheckout() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  const user = currentUser();
  const note = document.getElementById("checkout-auth-note");
  if (user) {
    if (note)
      note.innerHTML = `Conectat ca <strong>${user.email}</strong> — comanda va fi salvată în contul tău.`;
    const n = document.getElementById("co-name");
    const e = document.getElementById("co-email");
    if (n && !n.value) n.value = user.name;
    if (e && !e.value) e.value = user.email;
  } else if (note) {
    note.innerHTML = `<a href="cont.html">Autentifică-te</a> ca să salvezi comanda în istoricul contului (opțional).`;
  }

  if (!getCart().length) {
    showCheckoutEmpty();
    return;
  }
  setStep(1);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!getCart().length) {
      showToast("Coșul este gol.");
      return;
    }
    placeOrder(new FormData(form));
  });
}

function showCheckoutEmpty() {
  const layout = document.getElementById("checkout-layout");
  if (layout)
    layout.innerHTML = `<div class="cart-empty-page"><p>Coșul tău este gol.</p><a href="magazin.html" class="btn btn-dark">Spre magazin</a></div>`;
}

function placeOrder(fd) {
  const cart = getCart();
  const items = cart.map((item) => {
    const p = PRODUCTS.find((x) => x.id === item.id);
    return { id: p.id, name: p.name, size: item.size || "", qty: item.qty, price: p.price };
  });
  const t = checkoutTotals();
  const order = {
    id: "#ATL-" + Date.now().toString(36).toUpperCase().slice(-6),
    date: new Date().toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    items,
    subtotal: t.sub,
    discount: t.discount,
    voucher: VOUCHER.code,
    shipping: t.ship,
    total: t.total,
    status: "În procesare",
    payment: fd.get("pay") === "ramburs" ? "Plată la livrare" : "Card bancar",
    address: {
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      address: fd.get("address"),
      city: fd.get("city"),
      zip: fd.get("zip"),
    },
  };

  const saved = addOrder(order);
  saveCart([]);
  VOUCHER = { code: null, pct: 0 };
  setStep(3);

  const layout = document.getElementById("checkout-layout");
  if (layout) {
    layout.innerHTML = `
      <div class="order-success">
        <p class="eyebrow">Mulțumim pentru comandă</p>
        <h1 class="serif">Comanda ${order.id} a fost plasată</h1>
        <p>Vei primi un email de confirmare la <strong>${order.address.email}</strong>.<br>Livrare estimată: <strong>${deliveryRange()}</strong> · Total: <strong>${LEI(order.total)}</strong></p>
        <div class="success-actions">
          ${
            saved
              ? `<a href="cont.html#comenzi" class="btn btn-dark">Vezi comanda în cont</a>`
              : `<a href="cont.html" class="btn btn-dark">Creează cont</a>`
          }
          <a href="magazin.html" class="btn btn-light">Continuă cumpărăturile</a>
        </div>
        ${
          saved
            ? ""
            : `<p class="success-hint">Nu ești autentificat — creează un cont cu acest email ca să-ți regăsești comenzile.</p>`
        }
      </div>`;
  }
  refreshCartViews();
}

/* ================= PAGINA PRODUS (produs.html) ================= */
function productDesc(p) {
  return (
    p.description ||
    `${p.name} face parte din colecția ${p.category} confecționată manual de Atelier. Croială atemporală, finisaje atente și materiale premium selectate să îmbătrânească frumos. Piesă în ediție limitată, lucrată în loturi mici.`
  );
}

function initProductDetail() {
  const root = document.getElementById("product-detail");
  if (!root) return;

  const id = new URLSearchParams(location.search).get("id");
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) {
    root.innerHTML = `<div class="cart-empty-page"><p>Produsul nu a fost găsit.</p><a href="magazin.html" class="btn btn-dark">Spre magazin</a></div>`;
    return;
  }
  document.title = `${p.name} — ATELIER`;

  const media = p.image
    ? `<img src="${p.image}" alt="${p.name}" id="pdp-main-img" />`
    : `<div class="ph">${p.name}</div>`;
  const thumbs = p.image
    ? Array.from({ length: 3 })
        .map(
          (_, i) =>
            `<button class="pdp-thumb ${i === 0 ? "active" : ""}" data-thumb="${p.image}"><img src="${p.image}" alt="${p.name} ${i + 1}" /></button>`
        )
        .join("")
    : "";
  const price = p.oldPrice
    ? `<span class="sale">${LEI(p.price)}</span> <span class="old">${LEI(p.oldPrice)}</span>`
    : `<span>${LEI(p.price)}</span>`;
  const sizeChips = sizesOf(p)
    .map((s) => `<button class="pdp-size" data-size="${s}">${s}</button>`)
    .join("");
  const colorNames = p.colors.map((c) => `<span class="swatch" style="background:${c}"></span>`).join("");

  root.innerHTML = `
    <nav class="pdp-crumbs">
      <a href="index.html">Acasă</a> / <a href="magazin.html">Magazin</a> / <span>${p.category}</span>
    </nav>
    <div class="pdp-grid">
      <div class="pdp-gallery">
        <div class="pdp-thumbs">${thumbs}</div>
        <div class="pdp-main">${badgeFor(p)}${media}</div>
      </div>
      <div class="pdp-info">
        <p class="product-cat">${p.category}</p>
        <h1 class="serif">${p.name}</h1>
        <p class="pdp-price">${price} <small>TVA inclus</small></p>
        <div class="pdp-colors"><span class="pdp-label">Culoare</span><div class="swatches">${colorNames}</div></div>
        <div class="pdp-sizes">
          <span class="pdp-label">Mărime</span>
          <div class="pdp-size-row">${sizeChips}</div>
          <p class="pdp-size-msg" id="pdp-size-msg"></p>
        </div>
        <button class="btn btn-dark pdp-add" id="pdp-add">Adaugă în coș</button>

        <div class="pdp-delivery">
          <div class="pdp-deliv-row">
            <span>🚚 Livrare standard</span>
            <strong>${deliveryRange()} · gratuită peste 450 lei</strong>
          </div>
          <div class="pdp-deliv-row"><span>↩ Retur gratuit</span><strong>14 zile</strong></div>
        </div>

        <details class="pdp-acc" open>
          <summary>Descriere</summary>
          <p>${productDesc(p)}</p>
        </details>
        <details class="pdp-acc">
          <summary>Material și îngrijire</summary>
          <p>Materiale naturale premium (bumbac / in / lână, în funcție de model). Spălare la 30°C, fără înălbitor, călcare la temperatură medie. Confecționat manual în România.</p>
        </details>
        <details class="pdp-acc">
          <summary>Livrare și retur</summary>
          <p>Livrare în 2–4 zile lucrătoare prin curier. Gratuită la comenzile de peste 450 lei. Retur simplu în 14 zile de la primire.</p>
        </details>
      </div>
    </div>

    <section class="pdp-related">
      <div class="section-head"><h2 class="section-title">Ar putea să-ți placă</h2></div>
      <div class="product-grid" id="related-grid"></div>
    </section>`;

  // produse similare (aceeași categorie)
  const related = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const fallback = PRODUCTS.filter((x) => x.id !== p.id).slice(0, 4);
  renderProducts("related-grid", related.length ? related : fallback);

  // selecție mărime
  let selectedSize = null;
  root.querySelectorAll(".pdp-size").forEach((btn) =>
    btn.addEventListener("click", () => {
      root.querySelectorAll(".pdp-size").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSize = btn.dataset.size;
      document.getElementById("pdp-size-msg").textContent = "";
    })
  );

  document.getElementById("pdp-add").addEventListener("click", () => {
    if (!selectedSize) {
      const msg = document.getElementById("pdp-size-msg");
      msg.textContent = "Te rugăm să alegi o mărime.";
      msg.classList.add("show");
      document.querySelector(".pdp-size-row")?.classList.add("shake");
      setTimeout(() => document.querySelector(".pdp-size-row")?.classList.remove("shake"), 500);
      return;
    }
    addToCart(p.id, selectedSize);
  });

  // galerie thumbnails
  root.querySelectorAll(".pdp-thumb").forEach((t) =>
    t.addEventListener("click", () => {
      root.querySelectorAll(".pdp-thumb").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      const img = document.getElementById("pdp-main-img");
      if (img) img.src = t.dataset.thumb;
    })
  );
}

function badgeFor(p) {
  return p.badge
    ? `<span class="badge ${p.badge === "Reducere" ? "sale" : ""}">${p.badge}</span>`
    : "";
}

/* ================= TOAST ================= */
let toastTimer;
function showToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  renderProducts("featured-grid", PRODUCTS.slice(0, 8));
  renderProducts("shop-grid", PRODUCTS);
  initFilters();
  refreshCartViews();
  initCheckout();
  initProductDetail();
  if (typeof renderAccountPage === "function") renderAccountPage();

  document.addEventListener("click", (e) => {
    // deschide selectorul de mărime
    const trigger = e.target.closest("[data-add-trigger]");
    if (trigger) {
      const card = trigger.closest(".product-card");
      const pick = card.querySelector(".size-pick");
      document.querySelectorAll(".size-pick.show").forEach((el) => {
        if (el !== pick) el.classList.remove("show");
      });
      pick.classList.toggle("show");
      return;
    }
    // alege mărime → adaugă în coș
    const chip = e.target.closest("[data-add][data-size]");
    if (chip) {
      addToCart(chip.dataset.add, chip.dataset.size);
      chip.closest(".size-pick")?.classList.remove("show");
      return;
    }
    // controale coș
    const act = e.target.closest("[data-act]");
    if (act) {
      const { id, size, act: a } = act.dataset;
      if (a === "plus") changeQty(id, size, 1);
      else if (a === "minus") changeQty(id, size, -1);
      else if (a === "remove") removeItem(id, size);
      return;
    }

    if (e.target.closest("[data-open-cart]")) { e.preventDefault(); openCart(); return; }
    if (e.target.closest("[data-close-cart]")) { closeCart(); return; }
    if (e.target.closest("[data-open-search]")) { e.preventDefault(); openSearch(); return; }
    if (e.target.closest("[data-close-search]")) { closeSearch(); return; }
    if (e.target.closest("#voucher-apply")) { applyVoucher(); return; }

    const co = e.target.closest("#checkout-btn");
    if (co && !cartCount()) { e.preventDefault(); showToast("Coșul tău este gol."); return; }

    // închide selectoarele de mărime la click în afară
    if (!e.target.closest(".product-action")) {
      document.querySelectorAll(".size-pick.show").forEach((el) => el.classList.remove("show"));
    }
  });

  document.getElementById("search-input")?.addEventListener("input", (e) =>
    runSearch(e.target.value)
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeCart(); closeSearch(); }
  });

  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");
  toggle?.addEventListener("click", () => menu.classList.toggle("open"));

  document.getElementById("contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("Mulțumim! Mesajul tău a fost trimis.");
    e.target.reset();
  });

  document.querySelectorAll(".newsletter-form").forEach((f) =>
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Te-ai abonat cu succes!");
      e.target.reset();
    })
  );
});
