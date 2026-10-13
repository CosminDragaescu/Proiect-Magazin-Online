# ATELIER — Site magazin de haine

Site minimalist pentru un magazin de haine confecționate manual, inspirat de structura ashclothing.ro. Design „Quiet Luxury" (Bodoni Moda + Hanken Grotesk). Pur static (HTML/CSS/JS), fără dependențe — gata de dezvoltat mai departe.

## Structură

```
Magazin Haine/
├── index.html        # Pagina principală (hero, colecție, produse, story, newsletter)
├── magazin.html      # Catalog cu filtre pe categorii
├── contact.html      # Date contact + formular
├── cos.html          # Pagina coș de cumpărături
├── checkout.html     # Finalizare comandă (contact, livrare, plată demo)
├── cont.html         # Cont: autentificare / înregistrare + istoric comenzi
├── css/style.css     # Tot stilul; variabile de temă sus în :root
├── js/products.js    # Datele produselor (editează aici)
├── js/layout.js      # Header/footer/coș/căutare — injectate pe toate paginile
├── js/auth.js        # Sistem de cont + comenzi (localStorage, demo)
├── js/main.js        # Logica: randare, coș, filtre, căutare, checkout
└── images/           # Imaginile produselor
```

## Funcții

- **Căutare** — buton „Caută" în header deschide un overlay cu rezultate live.
- **Mărimi** — fiecare produs are mărimi; la „Adaugă în coș" alegi mărimea.
  Același produs cu aceeași mărime crește cantitatea (nu se dublează rândul);
  mărimi diferite = rânduri separate. Editezi mărimile în `DEFAULT_SIZES`
  (sau `sizes: [...]` per produs) în `js/products.js`.
- **Cont (meniu)** — meniu în header (când ești logat): Contul tău, Comenzi,
  Returnează articol, Ajutor și contact, Deconectare. Pagina `cont.html` are
  secțiuni: prezentare cont, **istoric comenzi**, **returnare articol**.
- **Coș** — drawer lateral (din orice pagină) + pagină dedicată (`cos.html`),
  cu subtotal, livrare (gratuită peste 450 lei) și total.
- **Checkout** — pași (Coș → Adresă → Confirmare → Gata), livrare estimată,
  **cod voucher** (`ATELIER10` = −10%, `BINEAIVENIT` = −15%), formular contact +
  livrare + plată (demo). La plasare, dacă ești logat, comanda se salvează în cont.

## Cum personalizezi

- **Numele magazinului:** caută „Atelier” în `js/layout.js` și în `.html` și înlocuiește.
- **Culori / fonturi:** editează variabilele din `:root` în `css/style.css`.
- **Produse:** adaugă/șterge obiecte în lista `PRODUCTS` din `js/products.js`.
  - `image: ""` → afișează un placeholder; pune o cale (`images/...`) pentru poza reală.
  - `oldPrice` setat → afișează preț redus; `badge: "Nou" | "Reducere" | null`.
- **Categorii:** lista `CATEGORIES` din `js/products.js` generează filtrele.
- **Header / footer:** se editează o singură dată în `js/layout.js` (apar pe toate paginile).
- **Contact:** editează email/telefon/adresă în `contact.html`.

## Cum rulezi local

```powershell
python -m http.server 8000
```

Apoi accesează http://localhost:8000

## Note importante

- **Conturile și comenzile sunt DEMO** — stocate în `localStorage`, în browserul
  vizitatorului, cu un hash de parolă simplu (NU securizat). Pentru producție,
  conectează un backend real (autentificare + bază de date + procesator de plăți).
- Checkout-ul nu efectuează plăți reale — e pregătit să integrezi Stripe / Netopia etc.
- Fișierele CSS/JS au `?v=2` în `.html` pentru a evita cache vechi în dezvoltare;
  crește numărul când faci modificări majore.
- Totul e responsive (desktop, tabletă, mobil cu meniu hamburger).
