(() => {
  "use strict";
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const setText = (id, value) => { const el = document.getElementById(id); if (el && value != null) el.textContent = String(value); };

  function apply(c) {
    setText("brand-word", c.brand);
    setText("brand-sub", c.brandSub);
    const eye = document.getElementById("hero-eyebrow");
    if (eye && c.heroEyebrow) eye.innerHTML = '<span class="dot"></span> ' + esc(c.heroEyebrow);
    setText("hero-line1", c.heroLine1);
    setText("hero-line2", c.heroLine2);
    setText("hero-sub", c.heroSub);
    const kicker = document.getElementById("product-kicker");
    if (kicker && c.productKicker) kicker.innerHTML = '<span>01</span> ' + esc(c.productKicker.replace(/^01\s*/, ""));
    setText("product-title", c.productTitle);
    setText("product-desc", c.productDesc);
    const tags = document.getElementById("product-tags");
    if (tags && Array.isArray(c.productTags)) tags.innerHTML = c.productTags.map((t) => `<li>${esc(t)}</li>`).join("");
    setText("about-title", c.aboutTitle);
    const note = document.getElementById("about-note");
    if (note && c.aboutNote) note.innerHTML = String(c.aboutNote).split(/\n/).map(esc).join("<br>");
    const principles = document.getElementById("principles");
    if (principles && Array.isArray(c.principles)) {
      principles.innerHTML = c.principles.map((p, i) => `<article><span>0${i + 1}</span><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p></article>`).join("");
    }
    setText("log-title", c.logTitle);
    setText("log-note", c.logNote);
    const timeline = document.getElementById("timeline");
    if (timeline && Array.isArray(c.logs)) {
      timeline.innerHTML = c.logs.map((l) => `<li><time>${esc(l.date)}</time><div><strong>${esc(l.title)}</strong><p>${esc(l.desc)}</p></div><span class="tag">${esc(l.tag)}</span></li>`).join("");
    }
    setText("contact-line1", c.contactLine1);
    setText("contact-line2", c.contactLine2);
    const mail = document.getElementById("contact-mail");
    if (mail && c.contactEmail) {
      mail.innerHTML = esc(c.contactEmail) + ' <span>↗</span>';
      mail.href = "mailto:" + c.contactEmail;
    }
    const copy = document.getElementById("copy-mail");
    if (copy && c.contactEmail) copy.dataset.copy = c.contactEmail;
    setText("footer-brand", c.footerBrand);
    setText("footer-sub", c.footerSub);
    setText("footer-copy", c.footerCopyright);
  }

  fetch("./content.json?t=" + Date.now(), { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => { if (data && typeof data === "object") apply(data); })
    .catch(() => {});
})();
