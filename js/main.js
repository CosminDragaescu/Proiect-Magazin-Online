/* =========================================================
   Logica site-ului: randare produse, coș, filtre, meniu.
   ========================================================= */

const LEI = (n) => n.toLocaleString("ro-RO") + " lei";

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

  return `
    <article class="product-card" data-category="${p.category}">
      <div class="product-media">
        ${badge}
        ${media}
        <button class="product-add" data-add="${p.id}">Adaugă în coș</button>
      </div>
      <div class="product-info">
        <p class="product-cat">${p.category}</p>
        <h3>${p.name}</h3>
        <div class="product-price">${price}</div>
        <div class="swatches">${swatches}</div>
      </div>
    </article>`;
}

/* ---------------- Randare grile ---------------- */
function renderProducts(targetId, list) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = list.map(productCard).join("");
}

/* ---------------- Filtre (pagina magazin) ---------------- */
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

/* ================= COȘ ================= */
const CART_KEY = "atelier_cart";
const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");
const saveCart = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));

function addToCart(id) {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return;
  const cart = getCart();
  const existing = cart.find((i) => i.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, qty: 1 });
  saveCart(cart);
  renderCart();
  showToast(`„${product.name}" adăugat în coș`);
  openCart();
}

function changeQty(id, delta) {
  let cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
  saveCart(cart);
  renderCart();
}

function removeItem(id) {
  saveCart(getCart().filter((i) => i.id !== id));
  renderCart();
}

function cartCount() {
  return getCart().reduce((s, i) => s + i.qty, 0);
}

function renderCart() {
  // contor
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = cartCount();
    el.style.display = cartCount() ? "inline-flex" : "none";
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

  let total = 0;
  itemsEl.innerHTML = cart
    .map((item) => {
      const p = PRODUCTS.find((x) => x.id === item.id);
      if (!p) return "";
      total += p.price * item.qty;
      const thumb = p.image
        ? `<img class="thumb" src="${p.image}" alt="${p.name}" />`
        : `<div class="thumb"></div>`;
      return `
        <div class="cart-item">
          ${thumb}
          <div>
            <h4>${p.name}</h4>
            <p class="meta">${p.category} · ${LEI(p.price)}</p>
            <div class="qty">
              <button data-minus="${p.id}">−</button>
              <span>${item.qty}</span>
              <button data-plus="${p.id}">+</button>
            </div>
          </div>
          <button class="remove" data-remove="${p.id}">Șterge</button>
        </div>`;
    })
    .join("");
  if (totalEl) totalEl.textContent = LEI(total);
}

/* ---------------- Drawer coș ---------------- */
function openCart() {
  document.getElementById("cart-drawer")?.classList.add("open");
  document.getElementById("cart-overlay")?.classList.add("open");
}
function closeCart() {
  document.getElementById("cart-drawer")?.classList.remove("open");
  document.getElementById("cart-overlay")?.classList.remove("open");
}

/* ---------------- Toast ---------------- */
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
  // grile
  renderProducts("featured-grid", PRODUCTS.slice(0, 8));
  renderProducts("shop-grid", PRODUCTS);
  initFilters();
  renderCart();

  // delegare click globală
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { addToCart(add.dataset.add); return; }

    const plus = e.target.closest("[data-plus]");
    if (plus) { changeQty(plus.dataset.plus, 1); return; }

    const minus = e.target.closest("[data-minus]");
    if (minus) { changeQty(minus.dataset.minus, -1); return; }

    const rm = e.target.closest("[data-remove]");
    if (rm) { removeItem(rm.dataset.remove); return; }

    if (e.target.closest("[data-open-cart]")) { e.preventDefault(); openCart(); return; }
    if (e.target.closest("[data-close-cart]")) { closeCart(); return; }
  });

  // meniu mobil
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");
  toggle?.addEventListener("click", () => menu.classList.toggle("open"));

  // checkout demo
  document.getElementById("checkout-btn")?.addEventListener("click", () => {
    if (!cartCount()) { showToast("Coșul tău este gol."); return; }
    showToast("Checkout demo — conectează aici plata.");
  });

  // formular contact demo
  document.getElementById("contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    showToast("Mulțumim! Mesajul tău a fost trimis.");
    e.target.reset();
  });

  // newsletter demo
  document.querySelectorAll(".newsletter-form").forEach((f) =>
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Te-ai abonat cu succes!");
      e.target.reset();
    })
  );
});
