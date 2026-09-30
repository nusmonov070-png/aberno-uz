// ===== Aberno — umumiy skriptlar =====
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
      themeBtn.setAttribute("aria-label", dark ? "Yorug' rejimni yoqish" : "Qorong'u rejimni yoqish");
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

  // Formalar (backend ulanmaguncha faqat tekshiruv va xabar)
  document.querySelectorAll("form.form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = form.querySelector(".form-note");
      const phone = form.querySelector("[name=phone]");
      if (phone && phone.value.replace(/\D/g, "").length < 9) {
        note.className = "form-note err";
        note.textContent = "Iltimos, telefon raqamingizni to'liq kiriting.";
        return;
      }
      note.className = "form-note ok";
      note.textContent = "Rahmat! So'rovingiz qabul qilindi. Tez orada siz bilan bog'lanamiz.";
      form.reset();
    });
  });

  // Yil
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
});

// Katalog filtri (margarin.html)
document.addEventListener("DOMContentLoaded", () => {
  const group = document.querySelector("[data-filter-group]");
  if (!group) return;
  const items = document.querySelectorAll(".catalog-item");
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
