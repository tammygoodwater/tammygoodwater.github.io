/* Raised: fundraising progress graphics. Everything runs in the browser. */
(function () {
  "use strict";

  const CFG = window.RAISED_CONFIG || {};
  const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const PREMIUM_STYLES = ["thermometer", "milestones"];

  /* Sizes. pt/pb = top and bottom padding (Stories keep clear of Instagram's own buttons). */
  const SIZES = {
    square: { w: 1080, h: 1080, s: 1, pad: 84, pt: 84, pb: 84 },
    story: { w: 1080, h: 1920, s: 1.05, pad: 90, pt: 230, pb: 250 },
    wide: { w: 1200, h: 630, s: 0.62, pad: 64, pt: 56, pb: 56 },
  };

  const THEMES = [
    { name: "River", bg: "#0D3B40", fill: "#5FD3DA", track: "#1C5A61" },
    { name: "Clean", bg: "#FFFFFF", fill: "#00B2BD", track: "#E3F1F2" },
    { name: "Sunrise", bg: "#FFF4E8", fill: "#E0602A", track: "#F5D8C3" },
    { name: "Forest", bg: "#1F3B2C", fill: "#F2B33D", track: "#35573F" },
    { name: "Berry", bg: "#4A1D3F", fill: "#FF8FB1", track: "#6A3060" },
    { name: "Navy", bg: "#13294B", fill: "#7FC8F8", track: "#24406B" },
    { name: "Charcoal", bg: "#1E272B", fill: "#C6F06A", track: "#36444A" },
    { name: "Meadow", bg: "#F3F7EC", fill: "#4E7D52", track: "#DCE7CF" },
  ];

  const DEFAULTS = {
    org: "Riverbend Food Pantry",
    title: "Holiday Meals Drive",
    raised: "12450",
    goal: "20000",
    donors: "148",
    currency: "USD",
    deadline: "Ends Dec 31",
    cta: "Give at riverbendpantry.org",
    size: "square",
    style: "bar",
    bg: THEMES[0].bg,
    fill: THEMES[0].fill,
    track: THEMES[0].track,
  };

  /* ---------- Safe storage (works even when the browser blocks it) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
  };

  const $ = (sel) => document.querySelector(sel);
  const form = $("#form");
  const canvas = $("#canvas");
  const ctx = canvas.getContext("2d");
  let logoImg = null;

  /* ---------- Pro unlock ---------- */
  function isPro() { return store.get("raised:pro") === "1"; }
  function setPro() {
    store.set("raised:pro", "1");
    document.body.classList.add("is-pro");
    render();
  }
  function tryCode(code) {
    const want = String(CFG.unlockCode || "").trim().toUpperCase();
    return want && String(code || "").trim().toUpperCase() === want;
  }
  (function checkUrlUnlock() {
    const params = new URLSearchParams(location.search);
    const code = params.get("unlock");
    if (code === null) return;
    if (tryCode(code)) {
      store.set("raised:pro", "1");
      setTimeout(() => toast("Pro unlocked. Thank you for your support!"), 300);
    }
    history.replaceState(null, "", location.pathname);
  })();
  if (isPro()) document.body.classList.add("is-pro");

  /* ---------- Form state ---------- */
  function readState() {
    const d = new FormData(form);
    const st = {};
    for (const k of Object.keys(DEFAULTS)) st[k] = d.get(k) ?? DEFAULTS[k];
    return st;
  }
  function writeState(st) {
    for (const [k, v] of Object.entries(st)) {
      const els = form.elements[k];
      if (!els) continue;
      if (els instanceof RadioNodeList) {
        for (const r of els) r.checked = r.value === v;
      } else {
        els.value = v;
      }
    }
  }
  function loadState() {
    let saved = {};
    try { saved = JSON.parse(store.get("raised:state") || "{}") || {}; } catch (e) { saved = {}; }
    writeState(Object.assign({}, DEFAULTS, saved));
  }
  function saveState() { store.set("raised:state", JSON.stringify(readState())); }

  /* ---------- Color helpers ---------- */
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function luminance(hex) {
    const c = hexToRgb(hex).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    const la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function inkOn(hex) { return luminance(hex) > 0.4 ? "#1E272B" : "#FFFFFF"; }
  function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

  /* ---------- Drawing helpers ---------- */
  function font(weight, px) { return `${weight} ${Math.round(px)}px ${FONT}`; }
  function spacing(px) { if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`; }
  function wrap(text, maxW, maxLines) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width <= maxW || !line) line = test;
      else { lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    if (maxLines && lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      let last = kept[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
      kept[maxLines - 1] = last.trim() + "…";
      return kept;
    }
    return lines;
  }
  function roundRect(x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function money(n, cur) {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
    } catch (e) { return "$" + Math.round(n).toLocaleString(); }
  }
  function num(v) { const n = parseFloat(String(v).replace(/[^0-9.]/g, "")); return isFinite(n) && n >= 0 ? n : 0; }

  /* ---------- Main render ---------- */
  function render() {
    const st = readState();
    const size = SIZES[st.size] || SIZES.square;
    const W = size.w, H = size.h, s = size.s;
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;

    const pro = isPro();
    const raised = num(st.raised);
    const goal = Math.max(num(st.goal), 1);
    const pct = raised / goal;
    const pctShown = Math.floor(pct * 100);
    const reached = pct >= 1;
    const ink = inkOn(st.bg);
    const muted = rgba(ink, 0.72);
    /* Use the progress color for accent text only when it is readable on the background. */
    const accentText = contrast(st.fill, st.bg) >= 3 ? st.fill : ink;

    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    spacing(0);

    /* Background with a soft decorative circle */
    ctx.fillStyle = st.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rgba(st.fill, 0.1);
    ctx.beginPath();
    ctx.arc(W * 0.98, H * 0.02, Math.max(W, H) * 0.42, 0, Math.PI * 2);
    ctx.fill();

    const L = size.pad, R = W - size.pad, CW = R - L;
    let y = size.pt;

    /* Logo (Pro) */
    if (logoImg) {
      const lh = 96 * s, maxW = 340 * s;
      let w = (logoImg.width / logoImg.height) * lh, h = lh;
      if (w > maxW) { h = (maxW / w) * h; w = maxW; }
      ctx.drawImage(logoImg, L, y, w, h);
      y += h + 30 * s;
    }

    /* Organization name */
    if (st.org.trim()) {
      ctx.font = font(700, 30 * s);
      spacing(4 * s);
      ctx.fillStyle = accentText;
      const orgLine = wrap(st.org.toUpperCase(), CW, 1)[0];
      y += 30 * s;
      ctx.fillText(orgLine, L, y);
      spacing(0);
      y += 22 * s;
    }

    /* Campaign title, shrinking to fit in 2 lines when possible */
    let titlePx = 80 * s, titleLines = [];
    if (st.title.trim()) {
      for (; titlePx >= 52 * s; titlePx -= 4 * s) {
        ctx.font = font(800, titlePx);
        titleLines = wrap(st.title, CW, 3);
        if (titleLines.length <= 2) break;
      }
      ctx.font = font(800, titlePx);
      spacing(-1.5 * s);
      ctx.fillStyle = ink;
      for (const ln of titleLines) { y += titlePx * 1.02; ctx.fillText(ln, L, y); }
      spacing(0);
    }
    const headerBottom = y + 10 * s;

    /* Footer: call-to-action pill and deadline, from the bottom up */
    let fy = H - size.pb;
    if (!pro) fy -= 56 * s; // room for the watermark
    const footerItems = [];
    if (st.cta.trim()) {
      ctx.font = font(700, 32 * s);
      const t = wrap(st.cta, CW - 64 * s, 1)[0];
      const pw = ctx.measureText(t).width + 64 * s, ph = 74 * s;
      fy -= ph;
      const ctaY = fy;
      footerItems.push(() => {
        ctx.fillStyle = st.fill;
        roundRect(L, ctaY, pw, ph, ph / 2);
        ctx.fill();
        ctx.fillStyle = inkOn(st.fill);
        ctx.font = font(700, 32 * s);
        ctx.fillText(t, L + 32 * s, ctaY + ph / 2 + 11 * s);
      });
    }
    if (st.deadline.trim()) {
      fy -= (st.cta.trim() ? 22 : 0) * s + 30 * s;
      const dy = fy + 26 * s;
      footerItems.push(() => {
        ctx.font = font(700, 28 * s);
        spacing(2 * s);
        ctx.fillStyle = muted;
        ctx.fillText(wrap(st.deadline.toUpperCase(), CW, 1)[0], L, dy);
        spacing(0);
      });
    }
    const footerTop = fy - 20 * s;
    footerItems.forEach((f) => f());

    /* Middle area: stats + meter */
    const midTop = headerBottom + 30 * s, midH = Math.max(footerTop - midTop, 120 * s);
    const style = st.style;
    const side = (style === "ring" || style === "thermometer") && W / H >= 0.9;
    const showPctInStats = style === "bar" || style === "milestones" || style === "thermometer";

    const statsLines = (k, maxW) => {
      const items = [];
      const big = 132 * s * k;
      ctx.font = font(800, big);
      let bigPx = big;
      const amount = money(raised, st.currency);
      while (ctx.measureText(amount).width > maxW && bigPx > 40 * s) { bigPx -= 4; ctx.font = font(800, bigPx); }
      items.push({ text: amount, px: bigPx, weight: 800, color: ink, gap: 0, track: -3 * s * k });
      items.push({ text: `raised of ${money(goal, st.currency)} goal`, px: 38 * s * k, weight: 400, color: muted, gap: 14 * s * k });
      const bits = [];
      if (reached) bits.push("Goal reached. Thank you!");
      else if (showPctInStats) bits.push(`${pctShown}% of the way there`);
      const donors = num(st.donors);
      if (donors > 0) bits.push(`${Math.round(donors).toLocaleString()} ${donors === 1 ? "donor" : "donors"}`);
      if (bits.length) {
        const px = 36 * s * k;
        ctx.font = font(700, px);
        const joined = bits.join("  ·  ");
        const lines = ctx.measureText(joined).width <= maxW ? [joined] : bits;
        lines.forEach((t, i) => items.push({ text: t, px, weight: 700, color: accentText, gap: (i ? 6 : 18) * s * k }));
      }
      let h = 0;
      for (const it of items) h += it.gap + it.px * 1.05;
      return { items, h };
    };
    const drawStats = (st2, x, top, maxW, align) => {
      let yy = top;
      ctx.textAlign = align;
      for (const it of st2.items) {
        yy += it.gap + it.px * 0.96;
        ctx.font = font(it.weight, it.px);
        spacing(it.track || 0);
        ctx.fillStyle = it.color;
        ctx.fillText(wrap(it.text, maxW, 1)[0], x, yy);
        spacing(0);
        yy += it.px * 0.09;
      }
      ctx.textAlign = "left";
    };

    if (side) {
      /* Meter on the left, numbers on the right */
      const meterW = style === "ring" ? Math.min(CW * 0.42, midH * 0.92) : Math.min(CW * 0.3, 260 * s);
      const statsX = L + meterW + 50 * s, statsW = R - statsX;
      let k = 1, stats = statsLines(k, statsW);
      while (stats.h > midH && k > 0.5) { k -= 0.05; stats = statsLines(k, statsW); }
      if (style === "ring") {
        const r = meterW / 2;
        drawRing(L + r, midTop + midH / 2, r * 0.98, pct, st, s, ink);
      } else {
        drawThermometer(L, midTop + midH * 0.04, meterW, midH * 0.92, pct, st, s, muted);
      }
      drawStats(stats, statsX, midTop + (midH - stats.h) / 2, statsW, "left");
    } else {
      /* Stacked layout */
      const gap = 44 * s;
      let k = 1, stats = statsLines(k, CW);
      let meterH = 0;
      if (style === "bar") meterH = 64 * s;
      if (style === "milestones") meterH = 140 * s;
      const minMeter = { ring: 260 * s, thermometer: 320 * s }[style] || meterH;
      while (stats.h + gap + minMeter > midH && k > 0.5) { k -= 0.05; stats = statsLines(k, CW); }
      /* Tall formats (Stories): grow the numbers to fill the space */
      if (style === "bar" || style === "milestones") {
        while (k < 1.6) {
          const next = statsLines(k + 0.05, CW);
          if (next.h + gap + meterH * (k + 0.05) > midH * 0.75) break;
          k += 0.05; stats = next;
        }
        meterH *= Math.min(k, 1.3);
      }

      if (style === "bar" || style === "milestones") {
        const total = stats.h + gap + meterH;
        const top = midTop + Math.max((midH - total) / 2, 0);
        drawStats(stats, L, top, CW, "left");
        const by = top + stats.h + gap;
        if (style === "bar") drawBar(L, by, CW, meterH, pct, st, s);
        else drawMilestones(L, by, CW, pct, goal, st, s * Math.min(k, 1.3), ink, muted);
      } else {
        const avail = midH - stats.h - gap;
        const meterSize = Math.max(Math.min(avail, style === "ring" ? CW * 0.8 : 900 * s), 120 * s);
        const total = meterSize + gap + stats.h;
        const top = midTop + Math.max((midH - total) / 2, 0);
        if (style === "ring") drawRing(W / 2, top + meterSize / 2, meterSize / 2, pct, st, s, ink);
        else {
          const tw = Math.min(260 * s, meterSize * 0.4);
          drawThermometer(W / 2 - tw / 2, top, tw, meterSize, pct, st, s, muted);
        }
        drawStats(stats, W / 2, top + meterSize + gap, CW, "center");
      }
    }

    /* Watermark (free version) */
    if (!pro) {
      ctx.font = font(700, 24 * s);
      const t = "Made with Raised";
      const tw = ctx.measureText(t).width;
      const ph = 46 * s, pw = tw + 40 * s;
      const px = R - pw, py = H - size.pb - ph + 8 * s;
      ctx.fillStyle = rgba("#FFFFFF", 0.92);
      roundRect(px, py, pw, ph, ph / 2);
      ctx.fill();
      ctx.fillStyle = "#1E272B";
      ctx.fillText(t, px + 20 * s, py + ph / 2 + 8.5 * s);
    }
  }

  /* ---------- Meter styles ---------- */
  function drawBar(x, y, w, h, pct, st, s) {
    ctx.fillStyle = st.track;
    roundRect(x, y, w, h, h / 2);
    ctx.fill();
    if (pct > 0) {
      const fw = Math.max(Math.min(pct, 1) * w, h);
      ctx.fillStyle = st.fill;
      roundRect(x, y, fw, h, h / 2);
      ctx.fill();
      if (fw > 150 * s) {
        ctx.font = font(800, h * 0.46);
        ctx.fillStyle = inkOn(st.fill);
        ctx.textAlign = "right";
        ctx.fillText(`${Math.floor(pct * 100)}%`, x + fw - h * 0.42, y + h * 0.66);
        ctx.textAlign = "left";
      }
    }
  }

  function drawRing(cx, cy, r, pct, st, s, ink) {
    const lw = r * 0.2;
    const rr = r - lw / 2;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.strokeStyle = st.track;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
    if (pct > 0) {
      ctx.strokeStyle = st.fill;
      ctx.beginPath();
      const start = -Math.PI / 2;
      ctx.arc(cx, cy, rr, start, start + Math.PI * 2 * Math.min(pct, 0.9999));
      ctx.stroke();
    }
    ctx.lineCap = "butt";
    ctx.textAlign = "center";
    ctx.fillStyle = ink;
    ctx.font = font(800, r * 0.5);
    spacing(-2 * s);
    ctx.fillText(`${Math.floor(pct * 100)}%`, cx, cy + r * 0.17);
    spacing(0);
    ctx.textAlign = "left";
  }

  function drawThermometer(x, y, w, h, pct, st, s, muted) {
    /* Tube on the left part of the box, tick labels to its right */
    const tubeW = Math.min(w * 0.42, 110 * s);
    const bulbR = tubeW * 0.95;
    const cx = x + bulbR + 4 * s;
    const top = y + tubeW / 2;
    const bulbCy = y + h - bulbR;
    const tubeBottom = bulbCy;
    const tubeLen = tubeBottom - top;
    const inset = tubeW * 0.2;

    /* Track */
    ctx.fillStyle = st.track;
    roundRect(cx - tubeW / 2, y, tubeW, tubeBottom - y, tubeW / 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, bulbCy, bulbR, 0, Math.PI * 2);
    ctx.fill();

    /* Fill */
    ctx.fillStyle = st.fill;
    const innerW = tubeW - inset * 2;
    const fillTopY = tubeBottom - (tubeLen - 0) * Math.min(pct, 1);
    if (pct > 0) {
      roundRect(cx - innerW / 2, Math.min(fillTopY, tubeBottom - innerW), innerW, tubeBottom - Math.min(fillTopY, tubeBottom - innerW), innerW / 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx, bulbCy, bulbR - inset, 0, Math.PI * 2);
    ctx.fill();

    /* Ticks */
    ctx.font = font(700, 24 * s);
    ctx.fillStyle = muted;
    ctx.strokeStyle = muted;
    ctx.lineWidth = 3 * s;
    for (let i = 1; i <= 4; i++) {
      const ty = tubeBottom - tubeLen * (i / 4);
      const tx = cx + tubeW / 2 + 12 * s;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + 18 * s, ty);
      ctx.stroke();
      if (x + w - (tx + 26 * s) > 50 * s) ctx.fillText(`${i * 25}%`, tx + 26 * s, ty + 8 * s);
    }
  }

  function drawMilestones(x, y, w, pct, goal, st, s, ink, muted) {
    const h = 34 * s;
    const dotR = 30 * s;
    const barY = y + dotR - h / 2;
    const innerX = x + dotR, innerW = w - dotR * 2;
    ctx.fillStyle = st.track;
    roundRect(innerX, barY, innerW, h, h / 2);
    ctx.fill();
    if (pct > 0) {
      ctx.fillStyle = st.fill;
      roundRect(innerX, barY, Math.max(innerW * Math.min(pct, 1), h), h, h / 2);
      ctx.fill();
    }
    for (let i = 1; i <= 4; i++) {
      const f = i / 4;
      const cx = innerX + innerW * f;
      const cy = y + dotR;
      const done = pct >= f;
      ctx.fillStyle = done ? st.fill : st.track;
      ctx.beginPath();
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6 * s;
      ctx.strokeStyle = st.bg;
      ctx.stroke();
      if (done) {
        ctx.strokeStyle = inkOn(st.fill);
        ctx.lineWidth = 6 * s;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(cx - 11 * s, cy + 1 * s);
        ctx.lineTo(cx - 3 * s, cy + 9 * s);
        ctx.lineTo(cx + 12 * s, cy - 8 * s);
        ctx.stroke();
        ctx.lineCap = "butt";
      }
      ctx.font = font(700, 26 * s);
      ctx.fillStyle = done ? ink : muted;
      ctx.textAlign = i === 4 ? "right" : "center";
      const lx = i === 4 ? x + w : cx;
      const label = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(goal * f);
      ctx.fillText(label, lx, y + dotR * 2 + 40 * s);
    }
    ctx.textAlign = "left";
  }

  /* ---------- Theme swatches ---------- */
  function buildSwatches() {
    const box = $("#swatches");
    THEMES.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch";
      b.title = t.name;
      b.setAttribute("aria-label", `${t.name} colors`);
      b.style.background = `linear-gradient(135deg, ${t.bg} 0 55%, ${t.fill} 55% 100%)`;
      b.addEventListener("click", () => {
        form.elements.bg.value = t.bg;
        form.elements.fill.value = t.fill;
        form.elements.track.value = t.track;
        onChange();
      });
      box.appendChild(b);
    });
  }
  function markSwatch() {
    const st = readState();
    document.querySelectorAll(".swatch").forEach((b, i) => {
      const t = THEMES[i];
      const on = t.bg.toLowerCase() === st.bg.toLowerCase() && t.fill.toLowerCase() === st.fill.toLowerCase();
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* ---------- Logo ---------- */
  function loadLogo(dataUrl) {
    if (!dataUrl) { logoImg = null; $("#logoClear").hidden = true; render(); return; }
    const img = new Image();
    img.onload = () => { logoImg = img; $("#logoClear").hidden = false; render(); };
    img.src = dataUrl;
  }
  $("#logoFile").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        /* Shrink big logos so they save on the device */
        const max = 700;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const url = c.toDataURL("image/png");
        store.set("raised:logo", url);
        loadLogo(url);
        if (!isPro()) toast("Logo preview added. Download with Pro.");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });
  $("#logoClear").addEventListener("click", () => { store.del("raised:logo"); loadLogo(null); });

  /* ---------- Download & share ---------- */
  function gateReason() {
    if (isPro()) return "";
    const st = readState();
    if (PREMIUM_STYLES.includes(st.style)) return "The Thermometer and Milestones styles come with Raised Pro. Switch to Progress bar or Ring to download for free, or upgrade.";
    if (logoImg) return "Adding your logo comes with Raised Pro. Remove the logo to download for free, or upgrade.";
    return "";
  }
  function fileName() {
    const st = readState();
    const slug = (st.title || "fundraising").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "fundraising";
    return `${slug}-${st.size}.png`;
  }
  function getBlob() { return new Promise((res) => canvas.toBlob(res, "image/png")); }

  $("#downloadBtn").addEventListener("click", async () => {
    const reason = gateReason();
    if (reason) return showUpgrade(reason);
    const blob = await getBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("Image saved");
  });

  const shareBtn = $("#shareBtn");
  try {
    const probe = new File([new Blob([""], { type: "image/png" })], "x.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [probe] })) shareBtn.hidden = false;
  } catch (e) { /* sharing files not supported */ }
  shareBtn.addEventListener("click", async () => {
    const reason = gateReason();
    if (reason) return showUpgrade(reason);
    const blob = await getBlob();
    const file = new File([blob], fileName(), { type: "image/png" });
    try { await navigator.share({ files: [file] }); } catch (e) { /* user cancelled */ }
  });

  /* ---------- Upgrade ---------- */
  const dialog = $("#upgradeDialog");
  function showUpgrade(reason) {
    $("#upgradeReason").textContent = reason;
    if (dialog.showModal) dialog.showModal(); else alert(reason);
  }
  $("#dialogClose").addEventListener("click", () => dialog.close());
  document.querySelectorAll("[data-upgrade]").forEach((b) =>
    b.addEventListener("click", () => {
      if (CFG.paymentLink) { location.href = CFG.paymentLink; return; }
      if (dialog.open) dialog.close();
      toast("Pro is coming soon. Check back shortly!");
    })
  );
  document.querySelectorAll("[data-price]").forEach((el) => (el.textContent = CFG.price || "$29"));
  document.querySelectorAll("[data-price-note]").forEach((el) => (el.textContent = CFG.priceNote || ""));
  $("#codeBtn").addEventListener("click", () => {
    if (tryCode($("#codeInput").value)) { setPro(); toast("Pro unlocked. Thank you!"); }
    else toast("That code didn’t work. Check it and try again.");
  });
  if (CFG.contactEmail) {
    const a = document.createElement("a");
    a.href = `mailto:${CFG.contactEmail}`;
    a.textContent = "Need a custom design? Get in touch.";
    $("#contactLine").appendChild(a);
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  /* ---------- Install (Android/desktop prompt, iPhone instructions) ---------- */
  let deferredPrompt = null;
  const installBtn = $("#installBtn");
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = "inline-flex";
  });
  if (isIOS && !standalone) installBtn.style.display = "inline-flex";
  installBtn.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.style.display = "none";
    } else if (isIOS) {
      toast("Tap the Share button, then “Add to Home Screen”");
    }
  });
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  /* ---------- Wire up ---------- */
  function onChange() { saveState(); markSwatch(); render(); }
  form.addEventListener("input", onChange);
  form.addEventListener("change", onChange);

  buildSwatches();
  loadState();
  markSwatch();
  render();
  loadLogo(store.get("raised:logo"));
})();
