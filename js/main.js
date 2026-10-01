// ===== Aberno — umumiy skriptlar =====

// Google Apps Script "Web app" manzili: saytdagi barcha formalar va buyurtmalar shu orqali
// Telegram botga yuboriladi (google-apps-script/SOZLASH.md). Bo'sh bo'lsa, formalar yubormaydi.
const ORDER_ENDPOINT = "https://script.google.com/macros/s/AKfycbzhylnFwo2DfRcw9pyeWNR4SSMcJigAy2cOitZRZQAYCu5Hyn3Bnods3IytHcvqGwZx/exec";
document.addEventListener("DOMContentLoaded", () => {
  // Mobil menyu
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");
  if (burger && nav) {
    burger.addEventListener("click", () => {
      burger.classList.toggle("open");
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        burger.classList.remove("open");
        nav.classList.remove("open");
      })
    );
  }

  // Yorug' / qorong'u rejim (boshlang'ich holatni <head> dagi skript o'rnatadi)
  const themeBtn = document.querySelector(".theme-toggle");
  if (themeBtn) {
    const root = document.documentElement;
    const syncLabel = () => {
      const dark = root.dataset.theme === "dark";
      themeBtn.setAttribute("aria-label", t(dark ? "Yorug' rejimni yoqish" : "Qorong'u rejimni yoqish"));
      themeBtn.setAttribute("aria-pressed", dark);
    };
    syncLabel();
    themeBtn.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
      syncLabel();
    });
  }

  // Sayt rangi (10 ta mavzu; ranglarning o'zi css/style.css da [data-color] bo'yicha)
  const picker = document.querySelector(".color-picker");
  if (picker) {
    const COLORS = [
      ["aberno", "Aberno (asl)"], ["zumrad", "Zumrad"], ["bordo", "Bordo"], ["binafsha", "Binafsha"],
      ["okean", "Okean"], ["grafit", "Grafit"], ["qizil", "Qizil"], ["jigarrang", "Jigarrang"],
      ["osmon", "Osmon"], ["pushti", "Pushti"],
    ];
    const root = document.documentElement;
    const btn = picker.querySelector(".color-btn");
    const panel = picker.querySelector(".color-panel");
    const nameEl = picker.querySelector(".color-name");
    const box = picker.querySelector(".swatches");
    const current = () => root.dataset.color || "aberno";

    const mark = () => {
      box.querySelectorAll(".swatch").forEach((s) => s.setAttribute("aria-pressed", s.dataset.color === current()));
      nameEl.textContent = t(COLORS.find((c) => c[0] === current())?.[1] || "");
    };
    COLORS.forEach(([id, name]) => {
      const s = document.createElement("button");
      s.type = "button";
      s.className = "swatch";
      s.dataset.color = id;
      s.title = t(name);
      s.setAttribute("aria-label", t(name));
      s.addEventListener("click", () => {
        if (id === "aberno") delete root.dataset.color;
        else root.dataset.color = id;
        try { localStorage.setItem("color", id); } catch (e) {}
        mark();
      });
      box.appendChild(s);
    });
    mark();

    const setOpen = (open) => {
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", open);
    };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(panel.hidden);
    });
    document.addEventListener("click", (e) => {
      if (!picker.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) { setOpen(false); btn.focus(); }
    });
  }

  // Joriy sahifani menyuda belgilash
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach((a) => {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });

  // Scroll paytida paydo bo'lish animatsiyasi
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  // Raqamlarni sanash animatsiyasi
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min((t - start) / 1400, 1);
        el.textContent = Math.round(target * p) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    new IntersectionObserver((e, o) => {
      if (e[0].isIntersecting) { run(); o.disconnect(); }
    }).observe(el);
  });

  // Yuqoriga qaytish tugmasi
  const toTop = document.querySelector(".to-top");
  if (toTop) {
    window.addEventListener("scroll", () => toTop.classList.toggle("show", scrollY > 500));
    toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  }

  // Bog'lanish / Savdo / Xomashyo formalari -> Telegram bot (buyurtma formasi — js/order.js)
  document.querySelectorAll("form.form[data-form]").forEach((form) => {
    const note = form.querySelector(".form-note");
    const submit = form.querySelector("button[type=submit]");
    const show = (cls, html) => { note.className = "form-note " + cls; note.innerHTML = html; };
    const callUs = t("qo'ng'iroq qiling:") + ' <a href="tel:+998953427070"><b>+998 95 342 70 70</b></a>';

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get("name") || "").trim();
      const phone = (data.get("phone") || "").trim();
      const digits = phone.replace(/\D/g, "");
      if (name.length < 2) return show("err", t("Iltimos, ismingizni kiriting."));
      if (digits.length < 9 || digits.length > 15) return show("err", t("Iltimos, telefon raqamingizni to'liq kiriting."));
      if (!ORDER_ENDPOINT) return show("err", t("Xabar yuborish hozircha ulanmagan. Iltimos,") + " " + callUs);

      // Qolgan to'ldirilgan maydonlar Telegram xabarida o'z yorlig'i bilan chiqadi
      const fields = [];
      form.querySelectorAll("input[name], select[name], textarea[name]").forEach((el) => {
        if (["name", "phone", "website"].includes(el.name) || !el.value.trim()) return;
        const label = el.closest("div")?.querySelector("label")?.textContent.trim() || el.name;
        fields.push([label, el.value.trim()]);
      });
      if (LANG !== "uz") fields.push(["Til", LANG.toUpperCase()]); // menejer qaysi tilda javob berishni bilsin
      const payload = { kind: "contact", form: form.dataset.form, name, phone, website: data.get("website") || "", fields };

      submit.disabled = true;
      const label = submit.textContent;
      submit.textContent = t("Yuborilmoqda…");
      try {
        // Content-Type ko'rsatilmaydi (text/plain) — Google Apps Script CORS preflight'siz qabul qiladi
        const res = await fetch(ORDER_ENDPOINT, { method: "POST", body: JSON.stringify(payload) });
        const out = await res.json();
        if (!out.ok) throw new Error(out.error || "server");
        show("ok", t("Rahmat! Xabaringiz yuborildi. Tez orada siz bilan bog'lanamiz."));
        form.reset();
      } catch (err) {
        show("err", t("Xabarni yuborib bo'lmadi. Iltimos, qayta urinib ko'ring yoki") + " " + callUs);
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });
  });

  // Video: YouTube faqat bosilganda yuklanadi (sahifa tez ochiladi)
  document.querySelectorAll(".video-play").forEach((btn) =>
    btn.addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.yt}?autoplay=1&rel=0`;
      f.title = btn.getAttribute("aria-label") || "Video";
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      btn.replaceWith(f);
    })
  );

  // Namuna so'rash oynasi: mahsulot nomi tugma turgan kartochkadan olinadi
  const dlg = document.getElementById("sample-dialog");
  if (dlg && dlg.showModal) {
    const product = dlg.querySelector("[name=product]");
    document.querySelectorAll("[data-sample]").forEach((b) =>
      b.addEventListener("click", () => {
        product.value = b.closest("article")?.querySelector("h3")?.textContent.trim() || "";
        dlg.querySelector(".form-note").className = "form-note";
        dlg.showModal();
        (product.value ? dlg.querySelector("[name=name]") : product).focus();
      })
    );
    dlg.querySelector(".dialog-close").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  }

  // Suzuvchi Telegram tugmasi: tezkor xabar oynasi (xabar botga — yuqoridagi formalar bilan bir xil yo'l)
  const fcBtn = document.querySelector(".fc-toggle");
  const fcPanel = document.getElementById("fc-panel");
  if (fcBtn && fcPanel) {
    const setFc = (open) => {
      fcPanel.hidden = !open;
      fcBtn.setAttribute("aria-expanded", open);
      fcBtn.classList.toggle("open", open);
      if (open) fcPanel.querySelector("[name=name]").focus();
    };
    fcBtn.addEventListener("click", (e) => { e.stopPropagation(); setFc(fcPanel.hidden); });
    document.addEventListener("click", (e) => {
      if (!fcPanel.hidden && !fcPanel.contains(e.target) && !fcBtn.contains(e.target)) setFc(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !fcPanel.hidden) { setFc(false); fcBtn.focus(); }
    });
  }

  // Yil
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
});

// Katalog filtri (margarin.html, salfetka.html)
document.addEventListener("DOMContentLoaded", () => {
  const group = document.querySelector("[data-filter-group]");
  if (!group) return;
  const items = document.querySelectorAll("[data-tags]");
  group.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter");
    if (!btn) return;
    group.querySelectorAll(".filter").forEach((b) => b.classList.toggle("active", b === btn));
    const f = btn.dataset.filter;
    items.forEach((it) => {
      it.hidden = f !== "all" && !it.dataset.tags.split(" ").includes(f);
      if (!it.hidden) it.classList.add("visible");
    });
  });
});
