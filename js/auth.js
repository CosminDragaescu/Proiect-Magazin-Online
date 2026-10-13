/* =========================================================
   Sistem de cont (DEMO, client-side cu localStorage).
   ⚠️ Parolele sunt stocate doar local cu un hash simplu —
   pentru producție, conectează un backend real cu autentificare.
   ========================================================= */

const AUTH_KEY = "atelier_session";
const USERS_KEY = "atelier_users";
const ORDERS_KEY = "atelier_orders";

function _hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return "h" + h;
}

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}
function saveUsers(u) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

function currentUser() {
  const email = localStorage.getItem(AUTH_KEY);
  if (!email) return null;
  return getUsers().find((u) => u.email === email) || null;
}

function registerUser(name, email, password) {
  email = (email || "").trim().toLowerCase();
  name = (name || "").trim();
  if (!name || !email || !password)
    return { ok: false, error: "Completează toate câmpurile." };
  if (password.length < 6)
    return { ok: false, error: "Parola trebuie să aibă minim 6 caractere." };
  const users = getUsers();
  if (users.find((u) => u.email === email))
    return { ok: false, error: "Există deja un cont cu acest email." };
  users.push({ name, email, password: _hash(password), createdAt: Date.now() });
  saveUsers(users);
  localStorage.setItem(AUTH_KEY, email);
  return { ok: true };
}

function loginUser(email, password) {
  email = (email || "").trim().toLowerCase();
  const u = getUsers().find((x) => x.email === email);
  if (!u || u.password !== _hash(password))
    return { ok: false, error: "Email sau parolă incorecte." };
  localStorage.setItem(AUTH_KEY, email);
  return { ok: true };
}

function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
}

/* ---------------- Comenzi ---------------- */
function getOrders() {
  const u = currentUser();
  if (!u) return [];
  const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || "{}");
  return all[u.email] || [];
}
function addOrder(order) {
  const u = currentUser();
  if (!u) return false;
  const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || "{}");
  if (!all[u.email]) all[u.email] = [];
  all[u.email].unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
  return true;
}
function setOrderStatus(orderId, status) {
  const u = currentUser();
  if (!u) return;
  const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || "{}");
  const list = all[u.email] || [];
  const o = list.find((x) => x.id === orderId);
  if (o) {
    o.status = status;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
  }
}

/* ================= Pagina cont (cont.html) ================= */
function renderAccountPage() {
  const root = document.getElementById("account-root");
  if (!root) return;

  const user = currentUser();
  if (!user) {
    root.innerHTML = accountAuthMarkup();
    wireAuthForms();
    return;
  }

  root.innerHTML = accountDashboardMarkup(user);
  // tab inițial din hash (#comenzi / #retur)
  const map = { "#comenzi": "orders", "#retur": "returns" };
  renderTab(map[location.hash] || "overview");

  root.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) {
      e.preventDefault();
      renderTab(tab.dataset.tab);
      return;
    }
    if (e.target.closest("#logout-btn")) {
      logoutUser();
      renderAccountPage();
      if (typeof updateAccountNav === "function") updateAccountNav();
      return;
    }
    const ret = e.target.closest("[data-return]");
    if (ret) {
      setOrderStatus(ret.dataset.return, "Retur solicitat");
      if (typeof showToast === "function") showToast("Cerere de retur înregistrată.");
      renderTab("returns");
      return;
    }
  });
}

function accountAuthMarkup() {
  return `
    <div class="auth-grid">
      <div class="auth-card">
        <h2 class="serif">Autentificare</h2>
        <p class="auth-sub">Ai deja un cont? Conectează-te.</p>
        <form id="login-form">
          <div class="form-row"><label for="li-email">Email</label>
            <input type="email" id="li-email" required /></div>
          <div class="form-row"><label for="li-pass">Parolă</label>
            <input type="password" id="li-pass" required /></div>
          <p class="form-error" id="login-error"></p>
          <button type="submit" class="btn btn-dark" style="width:100%">Conectează-te</button>
        </form>
      </div>
      <div class="auth-card">
        <h2 class="serif">Cont nou</h2>
        <p class="auth-sub">Creează un cont ca să-ți urmărești comenzile.</p>
        <form id="register-form">
          <div class="form-row"><label for="rg-name">Nume complet</label>
            <input type="text" id="rg-name" required /></div>
          <div class="form-row"><label for="rg-email">Email</label>
            <input type="email" id="rg-email" required /></div>
          <div class="form-row"><label for="rg-pass">Parolă (min. 6 caractere)</label>
            <input type="password" id="rg-pass" required /></div>
          <p class="form-error" id="register-error"></p>
          <button type="submit" class="btn btn-dark" style="width:100%">Creează cont</button>
        </form>
      </div>
    </div>`;
}

function accountDashboardMarkup(user) {
  const first = user.name.split(" ")[0];
  return `
    <div class="dash">
      <aside class="dash-side">
        <p class="eyebrow">Contul meu</p>
        <h2 class="serif">Salut, ${first}</h2>
        <p class="dash-email">${user.email}</p>
        <nav class="dash-nav">
          <a href="#" data-tab="overview">Contul tău</a>
          <a href="#comenzi" data-tab="orders">Comenzile mele</a>
          <a href="#retur" data-tab="returns">Returnează articol</a>
          <a href="contact.html">Ajutor și contact</a>
          <button id="logout-btn">Nu ești ${first}? Deconectează-te</button>
        </nav>
      </aside>
      <div class="dash-content" id="dash-content"></div>
    </div>`;
}

function renderTab(tab) {
  const content = document.getElementById("dash-content");
  if (!content) return;
  document.querySelectorAll(".dash-nav [data-tab]").forEach((a) =>
    a.classList.toggle("active", a.dataset.tab === tab)
  );
  const user = currentUser();
  const orders = getOrders();

  if (tab === "orders") {
    content.innerHTML = `
      <h2 class="dash-title serif">Comenzile mele</h2>
      <div class="orders-list">${ordersListMarkup(orders)}</div>`;
  } else if (tab === "returns") {
    content.innerHTML = `
      <h2 class="dash-title serif">Returnează articol</h2>
      <p class="dash-lead">Selectează o comandă pentru a solicita returul. Ai 14 zile de la livrare.</p>
      <div class="orders-list">${returnsListMarkup(orders)}</div>`;
  } else {
    const last = orders[0];
    content.innerHTML = `
      <h2 class="dash-title serif">Contul tău</h2>
      <div class="overview-grid">
        <div class="overview-card">
          <h4>Date personale</h4>
          <p>${user.name}</p>
          <p>${user.email}</p>
        </div>
        <div class="overview-card">
          <h4>Comenzi</h4>
          <p class="overview-big">${orders.length}</p>
          <a href="#comenzi" data-tab="orders" class="section-link">Vezi toate</a>
        </div>
        <div class="overview-card">
          <h4>Ultima comandă</h4>
          ${
            last
              ? `<p>${last.id}</p><p class="dash-email">${last.date} · ${(last.total).toLocaleString("ro-RO")} lei</p>`
              : `<p class="dash-email">Nicio comandă încă.</p>`
          }
        </div>
      </div>`;
  }
}

function ordersListMarkup(orders) {
  if (!orders.length)
    return `<p class="cart-empty" style="padding:48px 0">Nu ai nicio comandă încă.<br><a href="magazin.html" class="section-link" style="display:inline-block;margin-top:16px">Începe cumpărăturile</a></p>`;
  return orders
    .map((o) => {
      const items = o.items
        .map((i) => `${i.name} (${i.size || "—"}) × ${i.qty}`)
        .join(", ");
      return `
        <div class="order-card">
          <div class="order-top">
            <div><span class="order-id">${o.id}</span><span class="order-date">${o.date}</span></div>
            <span class="order-status">${o.status}</span>
          </div>
          <p class="order-items">${items}</p>
          <div class="order-bottom">
            <span>${o.items.reduce((s, i) => s + i.qty, 0)} produse · ${o.payment || ""}</span>
            <span class="order-total">${(o.total).toLocaleString("ro-RO")} lei</span>
          </div>
        </div>`;
    })
    .join("");
}

function returnsListMarkup(orders) {
  const eligible = orders.filter((o) => o.status !== "Retur solicitat");
  if (!orders.length)
    return `<p class="cart-empty" style="padding:48px 0">Nu ai comenzi de returnat.</p>`;
  return orders
    .map((o) => {
      const items = o.items
        .map((i) => `${i.name} (${i.size || "—"}) × ${i.qty}`)
        .join(", ");
      const requested = o.status === "Retur solicitat";
      return `
        <div class="order-card">
          <div class="order-top">
            <div><span class="order-id">${o.id}</span><span class="order-date">${o.date}</span></div>
            <span class="order-status">${o.status}</span>
          </div>
          <p class="order-items">${items}</p>
          <div class="order-bottom">
            <span class="order-total">${(o.total).toLocaleString("ro-RO")} lei</span>
            ${
              requested
                ? `<span class="return-done">Retur solicitat ✓</span>`
                : `<button class="btn btn-light btn-sm" data-return="${o.id}">Solicită retur</button>`
            }
          </div>
        </div>`;
    })
    .join("");
}

function wireAuthForms() {
  document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const res = loginUser(
      document.getElementById("li-email").value,
      document.getElementById("li-pass").value
    );
    if (!res.ok) {
      document.getElementById("login-error").textContent = res.error;
      return;
    }
    renderAccountPage();
    if (typeof updateAccountNav === "function") updateAccountNav();
  });

  document.getElementById("register-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const res = registerUser(
      document.getElementById("rg-name").value,
      document.getElementById("rg-email").value,
      document.getElementById("rg-pass").value
    );
    if (!res.ok) {
      document.getElementById("register-error").textContent = res.error;
      return;
    }
    renderAccountPage();
    if (typeof updateAccountNav === "function") updateAccountNav();
  });
}
