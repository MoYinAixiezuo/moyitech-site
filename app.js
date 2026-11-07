(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Year
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Clock (UTC+8) — small studio system detail.
  const clock = $("#clock");
  function tick() {
    if (!clock) return;
    const now = new Date(Date.now() + (8 * 60 + new Date().getTimezoneOffset()) * 60000);
    clock.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((n) => String(n).padStart(2, "0")).join(":");
  }
  tick();
  setInterval(tick, 1000);

  // Mobile nav
  const menu = $(".nav-menu");
  const links = $(".nav-links");
  if (menu && links) {
    menu.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
    });
    $$(".nav-links a").forEach((a) => a.addEventListener("click", () => {
      links.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
    }));
  }

  // Copy email
  const toast = $("#toast");
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
  }
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        showToast("邮箱已复制");
      } catch {
        showToast(text);
      }
    });
  });
})();
