# ATELIER — Site magazin de haine

Site minimalist pentru un magazin de haine confecționate manual, inspirat de structura ashclothing.ro. Pur static (HTML/CSS/JS), fără dependențe — gata de dezvoltat mai departe.

## Structură

```
Magazin Haine/
├── index.html        # Pagina principală (hero, colecție, produse, story, newsletter)
├── magazin.html      # Catalog cu filtre pe categorii
├── contact.html      # Date contact + formular
├── css/style.css     # Tot stilul; variabile de temă sus în :root
├── js/products.js    # Datele produselor (editează aici)
├── js/main.js        # Logica: randare, coș, filtre, meniu
└── images/           # Imaginile produselor
```

## Cum personalizezi

- **Numele magazinului:** caută „Atelier” în fișierele `.html` și înlocuiește cu numele tău.
- **Culori / fonturi:** editează variabilele din `:root` în `css/style.css`.
- **Produse:** adaugă/șterge obiecte în lista `PRODUCTS` din `js/products.js`.
  - `image: ""` → afișează un placeholder; pune o cale (`images/...`) pentru poza reală.
  - `oldPrice` setat → afișează preț redus; `badge: "Nou" | "Reducere" | null`.
- **Categorii:** lista `CATEGORIES` din `js/products.js` generează filtrele.
- **Contact:** editează email/telefon/adresă în `contact.html`.

## Cum rulezi local

Deschide `index.html` direct în browser, sau pornește un server local:

```powershell
python -m http.server 8000
```

Apoi accesează http://localhost:8000

## Note

- Coșul folosește `localStorage` (se păstrează între pagini). Butonul de checkout și
  formularele sunt demo — conectează aici plata / un backend când ești gata.
- Totul e responsive (desktop, tabletă, mobil cu meniu hamburger).
