(() => {
  "use strict";
  const OWNER = "MoYinAixiezuo";
  const REPO = "moyitech-site";
  const BRANCH = "main";
  const PATH = "content.json";
  const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
  const TOKEN_KEY = "moyin-cms-token";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let token = localStorage.getItem(TOKEN_KEY) || "";
  let sha = "";
  let content = null;

  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
  }
  function status(msg) { $("#status").textContent = msg; }
  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin);
  }
  function b64decode(str) {
    const bin = atob(str.replace(/\s/g, ""));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  async function github(url, opts = {}) {
    const res = await fetch(url, {
      ...opts,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + token,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(opts.headers || {}),
      },
    });
    if (!res.ok) {
      let msg = "HTTP " + res.status;
      try { const j = await res.json(); if (j.message) msg += " · " + j.message; } catch {}
      const e = new Error(msg); e.status = res.status; throw e;
    }
    return res.status === 204 ? null : res.json();
  }

  function fillForm(c) {
    $$("[data-k]").forEach((el) => {
      const v = c[el.dataset.k];
      if (el.type === "checkbox") el.checked = !!v;
      else el.value = Array.isArray(v) ? v.join("，") : (v == null ? "" : String(v));
    });
    const principles = Array.isArray(c.principles) ? c.principles : [];
    $$("[data-p]").forEach((el) => {
      const [i, key] = el.dataset.p.split(".");
      const p = principles[Number(i)] || {};
      el.value = p[key] == null ? "" : String(p[key]);
    });
    renderLogs(Array.isArray(c.logs) ? c.logs : []);
  }
  function renderLogs(logs) {
    const wrap = $("#logs");
    wrap.innerHTML = logs.map((l, i) => `
      <div class="log-item">
        <div class="log-grid">
          <label class="field"><span>日期 ${i + 1}</span><input class="input" data-l="${i}.date" value="${esc(l.date || "")}" /></label>
          <label class="field"><span>标题 ${i + 1}</span><input class="input" data-l="${i}.title" value="${esc(l.title || "")}" /></label>
        </div>
        <label class="field"><span>说明 ${i + 1}</span><input class="input" data-l="${i}.desc" value="${esc(l.desc || "")}" /></label>
        <label class="field"><span>标签 ${i + 1}</span><input class="input" data-l="${i}.tag" value="${esc(l.tag || "")}" /></label>
      </div>`).join("");
  }
  function gather() {
    const c = JSON.parse(JSON.stringify(content || {}));
    $$("[data-k]").forEach((el) => {
      const key = el.dataset.k;
      c[key] = key === "productTags" ? el.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : el.value;
    });
    const principles = [0, 1, 2].map((i) => {
      const get = (key) => { const el = $(`[data-p="${i}.${key}"]`); return el ? el.value : ""; };
      return { title: get("title"), desc: get("desc") };
    });
    c.principles = principles;
    const logs = [];
    $$("[data-l]").forEach((el) => {
      const [i, key] = el.dataset.l.split(".");
      const idx = Number(i);
      logs[idx] = logs[idx] || {};
      logs[idx][key] = el.value;
    });
    c.logs = logs.filter(Boolean);
    return c;
  }
  async function readContent() {
    status("正在读取 content.json…");
    try {
      const data = await github(API + "?ref=" + BRANCH, { cache: "no-store" });
      sha = data.sha;
      content = JSON.parse(b64decode(data.content));
      status("已读取 · " + new Date().toLocaleString());
      $("#login").classList.add("hidden");
      $("#editor").classList.remove("hidden");
      fillForm(content);
    } catch (e) {
      if (e.status === 401) { status("Token 无效或已过期"); return; }
      if (e.status === 404) {
        const res = await fetch("../content.json?t=" + Date.now());
        content = await res.json();
        sha = "";
        status("未找到远端文件，已载入默认内容");
        $("#login").classList.add("hidden");
        $("#editor").classList.remove("hidden");
        fillForm(content);
        return;
      }
      status("读取失败：" + e.message);
      toast("读取失败");
    }
  }
  async function save() {
    const btn = $("#save");
    btn.disabled = true; btn.textContent = "保存中…";
    try {
      const next = gather();
      const body = {
        message: "Update site copy via admin",
        content: b64encode(JSON.stringify(next, null, 2)),
        branch: BRANCH,
      };
      if (sha) body.sha = sha;
      const res = await github(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      sha = res.content.sha;
      content = next;
      status("已发布 · " + new Date().toLocaleString());
      toast("已保存并发布，1–2 分钟后生效");
    } catch (e) {
      if (e.status === 409) { toast("文件已被别处修改，请刷新页面"); status("冲突：请刷新后重试"); }
      else { toast("保存失败：" + e.message); status("保存失败：" + e.message); }
    } finally {
      btn.disabled = false; btn.textContent = "保存并发布";
    }
  }

  $("#login-btn").addEventListener("click", () => {
    const value = $("#token").value.trim();
    if (!value) { toast("先填 Token"); return; }
    token = value; localStorage.setItem(TOKEN_KEY, token);
    readContent();
  });
  $("#token").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#login-btn").click(); });
  $("#save").addEventListener("click", save);
  $("#form").addEventListener("submit", (e) => { e.preventDefault(); save(); });
  $("#logout").addEventListener("click", () => { localStorage.removeItem(TOKEN_KEY); location.reload(); });
  $("#backup").addEventListener("click", () => {
    if (!content) return;
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "moyitech-content.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 800);
  });

  if (token) readContent();
  else status("等待登录");
})();
