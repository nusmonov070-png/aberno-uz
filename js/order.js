// ===== Onlayn buyurtma sahifasi (buyurtma.html) =====
// Mahsulotlar va ORDER_ENDPOINT — js/products.js da.
document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("order-products");
  if (!list) return;

  const MAX_QTY = 999;
  const variants = new Map(); // variant id -> { product, variant }
  PRODUCTS.forEach((p) => p.variants.forEach((v) => variants.set(v.id, { product: p, variant: v })));

  const money = (n) => n.toLocaleString("ru-RU").replace(/\s/g, " ") + " so'm";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Savat: { variantId: qty }, brauzerda saqlanadi
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem("cart")) || {}; } catch (e) {}
  Object.keys(cart).forEach((id) => { if (!variants.has(id) || !(cart[id] > 0)) delete cart[id]; });
  const saveCart = () => { try { localStorage.setItem("cart", JSON.stringify(cart)); } catch (e) {} };

  // --- Mahsulotlar ro'yxati ---
  list.innerHTML = PRODUCTS.map((p) => `
    <article class="order-card" data-group="${p.group}">
      <div class="order-img"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy"></div>
      <div class="order-info">
        <span class="tag">${esc(p.brand)}</span>
        <h3>${esc(p.name)}</h3>
        <ul class="variants">
          ${p.variants.map((v) => `
          <li>
            <div class="v-text">
              <span class="v-label">${esc(v.label)}</span>
              <span class="v-price">${v.price == null ? "Narxi kelishiladi" : money(v.price) + " / " + esc(v.unit)}</span>
            </div>
            <div class="stepper" data-id="${v.id}">
              <button type="button" class="minus" aria-label="Kamaytirish">−</button>
              <input type="number" inputmode="numeric" min="0" max="${MAX_QTY}" value="${cart[v.id] || 0}" aria-label="${esc(p.name + ", " + v.label)} soni">
              <button type="button" class="plus" aria-label="Ko'paytirish">+</button>
            </div>
          </li>`).join("")}
        </ul>
      </div>
    </article>`).join("");

  const setQty = (id, qty) => {
    qty = Math.max(0, Math.min(MAX_QTY, Math.floor(Number(qty) || 0)));
    if (qty) cart[id] = qty; else delete cart[id];
    const input = list.querySelector(`.stepper[data-id="${id}"] input`);
    if (input && Number(input.value) !== qty) input.value = qty;
    saveCart();
    renderCart();
  };

  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".minus, .plus");
    if (!btn) return;
    const id = btn.closest(".stepper").dataset.id;
    setQty(id, (cart[id] || 0) + (btn.classList.contains("plus") ? 1 : -1));
  });
  list.addEventListener("change", (e) => {
    const step = e.target.closest(".stepper");
    if (step) setQty(step.dataset.id, e.target.value);
  });

  // Guruh filtri
  document.querySelector("[data-order-filter]")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    btn.parentElement.querySelectorAll(".filter").forEach((b) => b.classList.toggle("active", b === btn));
    list.querySelectorAll(".order-card").forEach((c) => {
      c.hidden = btn.dataset.filter !== "all" && c.dataset.group !== btn.dataset.filter;
    });
  });

  // --- Savat ---
  const cartLines = document.getElementById("cart-lines");
  const cartTotal = document.getElementById("cart-total");
  const cartNote = document.getElementById("cart-note");
  const bar = document.querySelector(".cart-bar");

  const cartItems = () => Object.entries(cart).map(([id, qty]) => {
    const { product, variant } = variants.get(id);
    return { id, name: product.name, variant: variant.label, unit: variant.unit, price: variant.price, qty };
  });

  function renderCart() {
    const items = cartItems();
    const count = items.reduce((s, i) => s + i.qty, 0);
    const total = items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
    const unpriced = items.some((i) => i.price == null);

    cartLines.innerHTML = items.length
      ? items.map((i) => `
        <li>
          <div><b>${esc(i.name)}</b><small>${esc(i.variant)} · ${i.qty} ${esc(i.unit)}</small></div>
          <span>${i.price == null ? "—" : money(i.price * i.qty)}</span>
          <button type="button" class="remove" data-id="${i.id}" aria-label="O'chirish">×</button>
        </li>`).join("")
      : `<li class="empty-cart">Savat bo'sh — chapdagi ro'yxatdan mahsulot sonini tanlang.</li>`;
    cartTotal.textContent = money(total);
    cartNote.hidden = !unpriced;

    if (bar) {
      bar.hidden = !count;
      bar.querySelector(".count").textContent = count;
      bar.querySelector(".sum").textContent = money(total);
    }
  }
  cartLines.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove");
    if (btn) setQty(btn.dataset.id, 0);
  });
  renderCart();

  // --- Buyurtmani yuborish ---
  const form = document.getElementById("order-form");
  const note = form.querySelector(".form-note");
  const submit = form.querySelector("button[type=submit]");
  const showNote = (cls, html) => { note.className = "form-note " + cls; note.innerHTML = html; };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const items = cartItems();
    const data = Object.fromEntries(new FormData(form));
    const digits = (data.phone || "").replace(/\D/g, "");

    if (!items.length) return showNote("err", "Savat bo'sh. Avval kamida bitta mahsulot sonini tanlang.");
    if ((data.name || "").trim().length < 2) return showNote("err", "Iltimos, ismingizni kiriting.");
    if (digits.length < 9 || digits.length > 15) return showNote("err", "Iltimos, telefon raqamingizni to'liq kiriting.");
    if (!ORDER_ENDPOINT) {
      return showNote("err", "Onlayn buyurtma hozircha ulanmagan. Iltimos, qo'ng'iroq qiling: <a href=\"tel:+998953427070\"><b>+998 95 342 70 70</b></a>");
    }

    const payload = {
      name: data.name.trim(), phone: data.phone.trim(), type: data.type || "", address: (data.address || "").trim(),
      comment: (data.comment || "").trim(), website: data.website || "", // website — botlar uchun tuzoq, odam ko'rmaydi
      items: items.map(({ id, name, variant, unit, price, qty }) => ({ id, name, variant, unit, price, qty })),
    };

    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = "Yuborilmoqda…";
    try {
      // Content-Type ko'rsatilmaydi (text/plain) — Google Apps Script CORS preflight'siz qabul qiladi
      const res = await fetch(ORDER_ENDPOINT, { method: "POST", body: JSON.stringify(payload) });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || "server");
      cart = {};
      saveCart();
      list.querySelectorAll(".stepper input").forEach((i) => (i.value = 0));
      renderCart();
      form.reset();
      showNote("ok", `Rahmat! Buyurtmangiz qabul qilindi${out.id ? ` (№ ${esc(out.id)})` : ""}. Menejerimiz tez orada siz bilan bog'lanadi.`);
    } catch (err) {
      showNote("err", "Buyurtmani yuborib bo'lmadi. Iltimos, qayta urinib ko'ring yoki qo'ng'iroq qiling: <a href=\"tel:+998953427070\"><b>+998 95 342 70 70</b></a>");
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });
});
