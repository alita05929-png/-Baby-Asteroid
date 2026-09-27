/* ============================================================
   Hardhat PFP — build your own Sue.

   Sue herself is fixed: same cutout, same size, same position in
   every export. Only the colours and the backdrop behind her
   change, so a timeline full of these still reads as one crew
   while no two are quite identical.

   Runs entirely client-side; nothing is ever uploaded.
   ============================================================ */

(function () {
  "use strict";

  var root = document.getElementById("hc");
  var cv = document.getElementById("hcCanvas");
  if (!root || !cv) return;

  var ctx = cv.getContext("2d");

  /* ---------- the fixed frame ---------- */

  // X wants a square image, at least 400x400, under 2MB, and crops it to the
  // circle inscribed in that square. So: render square at 1000 for a crisp
  // downscale, keep every meaningful pixel inside the inscribed circle, and
  // leave no transparency anywhere — X flattens alpha when it re-encodes.
  var OUT = 1000;          // export size, square
  var INNER = 434;         // radius of the art disc; everything beyond is ring

  var PALETTE = [
    { name: "Hazard Yellow", hex: "#ffc700" },
    { name: "BNB Gold", hex: "#f0b90b" },
    { name: "Safety Orange", hex: "#ff6a13" },
    { name: "Hi-Vis Lime", hex: "#c8ff2e" },
    { name: "Blueprint Blue", hex: "#1b3a6b" },
    { name: "Site Teal", hex: "#0f766e" },
    { name: "Crimson", hex: "#d0342c" },
    { name: "Violet", hex: "#7b3fe4" },
    { name: "Concrete", hex: "#8a8578" },
    { name: "Asphalt", hex: "#0c0c0c" },
    { name: "Bone", hex: "#f0ece2" }
  ];

  var state = {
    style: "glow",
    bg: "#1b3a6b",
    ring: "#0c0c0c",
    glow: "#ffc700",
    badge: false
  };

  var sue = new Image();
  var sueReady = false;
  sue.onload = function () { sueReady = true; draw(); };
  sue.src = "assets/sue-cutout.png";

  /* ---------- colour helpers ---------- */

  function hexRgb(h) {
    h = h.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(hex, target, t) {
    var c = hexRgb(hex), d = hexRgb(target);
    return "rgb(" + Math.round(c[0] + (d[0] - c[0]) * t) + "," +
                    Math.round(c[1] + (d[1] - c[1]) * t) + "," +
                    Math.round(c[2] + (d[2] - c[2]) * t) + ")";
  }
  function rgba(hex, a) {
    var c = hexRgb(hex);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  /* ---------- backdrops ---------- */

  function circlePath(r) {
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, r, 0, Math.PI * 2);
  }

  function paintBackdrop() {
    var c = state.bg;

    if (state.style === "solid") {
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, OUT, OUT);

    } else if (state.style === "glow") {
      var g = ctx.createRadialGradient(OUT / 2, OUT * 0.44, 30, OUT / 2, OUT / 2, INNER);
      g.addColorStop(0, mix(c, "#ffffff", 0.22));
      g.addColorStop(0.55, c);
      g.addColorStop(1, mix(c, "#000000", 0.62));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, OUT, OUT);

    } else if (state.style === "hazard") {
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, OUT, OUT);
      ctx.save();
      ctx.fillStyle = mix(c, "#000000", 0.78);
      var step = 116, w = step / 2;
      for (var x = -OUT; x < OUT * 2; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, OUT);
        ctx.lineTo(x + w, OUT);
        ctx.lineTo(x + w + OUT, 0);
        ctx.lineTo(x + OUT, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

    } else { // blueprint
      var bg = ctx.createRadialGradient(OUT / 2, OUT * 0.4, 40, OUT / 2, OUT / 2, INNER);
      bg.addColorStop(0, mix(c, "#ffffff", 0.14));
      bg.addColorStop(1, mix(c, "#000000", 0.5));
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, OUT, OUT);

      ctx.save();
      ctx.strokeStyle = rgba("#ffffff", 0.16);
      ctx.lineWidth = 2;
      for (var i = 0; i <= OUT; i += 52) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, OUT); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(OUT, i); ctx.stroke();
      }
      ctx.strokeStyle = rgba("#ffffff", 0.3);
      ctx.lineWidth = 3;
      for (var j = 0; j <= OUT; j += 208) {
        ctx.beginPath(); ctx.moveTo(j, 0); ctx.lineTo(j, OUT); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(OUT, j); ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* ---------- render ---------- */

  function draw() {
    // The ring colour fills the whole square, so the export is fully opaque
    // and the ring runs right out to X's circular crop with no seam.
    ctx.fillStyle = state.ring;
    ctx.fillRect(0, 0, OUT, OUT);

    // everything inside the ring
    ctx.save();
    circlePath(INNER + 1);
    ctx.clip();

    paintBackdrop();

    // halo behind Sue, in the chosen glow colour
    var halo = ctx.createRadialGradient(OUT / 2, OUT * 0.52, 20, OUT / 2, OUT * 0.52, INNER);
    halo.addColorStop(0, rgba(state.glow, 0.5));
    halo.addColorStop(0.45, rgba(state.glow, 0.16));
    halo.addColorStop(1, rgba(state.glow, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, OUT, OUT);

    // Sue — identical placement every time
    if (sueReady) {
      var s = INNER * 2 * 0.96;
      ctx.drawImage(sue, OUT / 2 - s / 2, OUT / 2 - s / 2 + INNER * 0.13, s, s);
    }

    // vignette so she always sits into the frame the same way
    var vig = ctx.createRadialGradient(OUT / 2, OUT / 2, INNER * 0.62, OUT / 2, OUT / 2, INNER);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, OUT, OUT);

    ctx.restore();

    // a thin bright edge where the art meets the ring, so the two separate
    // cleanly whatever colours have been picked
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = rgba("#ffffff", 0.16);
    circlePath(INNER + 1.5);
    ctx.stroke();
    ctx.restore();

    if (state.badge) drawBadge();
  }

  function drawBadge() {
    var text = "$SUE";
    ctx.save();
    ctx.font = '700 56px "Archivo Black", "Arial Black", Impact, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var pw = ctx.measureText(text).width + 62, ph = 82;
    var cx = OUT / 2, cy = OUT * 0.845;

    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, ph / 2);
    else {
      var r = ph / 2, x = cx - pw / 2, y = cy - ph / 2;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + pw, y, x + pw, y + ph, r);
      ctx.arcTo(x + pw, y + ph, x, y + ph, r);
      ctx.arcTo(x, y + ph, x, y, r);
      ctx.arcTo(x, y, x + pw, y, r);
    }
    ctx.fillStyle = state.glow;
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#0c0c0c";
    ctx.fillText(text, cx, cy + 3);
    ctx.restore();
  }

  /* ---------- controls ---------- */

  function markActive(host, hex) {
    host.querySelectorAll(".hc__swatch").forEach(function (el) {
      var on = el.dataset.hex === hex;
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-pressed", String(on));
    });
  }
  function buildSwatches(hostId, key) {
    var host = document.getElementById(hostId);
    if (!host) return;
    PALETTE.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "hc__swatch";
      b.style.background = p.hex;
      b.title = p.name;
      b.setAttribute("aria-label", p.name);
      b.dataset.hex = p.hex;
      b.addEventListener("click", function () {
        state[key] = p.hex;
        markActive(host, p.hex);
        draw();
      });
      host.appendChild(b);
    });
    markActive(host, state[key]);
  }

  buildSwatches("hcBgColors", "bg");
  buildSwatches("hcRingColors", "ring");
  buildSwatches("hcGlowColors", "glow");

  var styleHost = document.getElementById("hcStyles");
  if (styleHost) {
    styleHost.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-style]");
      if (!b) return;
      state.style = b.dataset.style;
      styleHost.querySelectorAll("button").forEach(function (el) {
        el.classList.toggle("is-on", el === b);
      });
      draw();
    });
  }

  var badgeBtn = document.getElementById("hcBadgeToggle");
  badgeBtn.addEventListener("click", function () {
    state.badge = !state.badge;
    badgeBtn.classList.toggle("is-on", state.badge);
    badgeBtn.setAttribute("aria-pressed", String(state.badge));
    draw();
  });

  document.getElementById("hcRandom").addEventListener("click", function () {
    var styles = ["glow", "hazard", "blueprint", "solid"];
    var pick = function () { return PALETTE[(Math.random() * PALETTE.length) | 0].hex; };

    state.style = styles[(Math.random() * styles.length) | 0];
    state.bg = pick();
    state.ring = pick();
    state.glow = pick();
    // keep it readable: the ring must not vanish into the backdrop
    if (state.ring === state.bg) state.ring = "#0c0c0c";

    styleHost.querySelectorAll("button").forEach(function (el) {
      el.classList.toggle("is-on", el.dataset.style === state.style);
    });
    markActive(document.getElementById("hcBgColors"), state.bg);
    markActive(document.getElementById("hcRingColors"), state.ring);
    markActive(document.getElementById("hcGlowColors"), state.glow);
    draw();
  });

  /* ---------- export ---------- */

  var MAX_BYTES = 1900000;   // X rejects anything over 2MB

  function blobOut(cb) {
    cv.toBlob(function (png) {
      if (png && png.size <= MAX_BYTES) { cb(png, "png"); return; }
      // photographic PNG can run large; JPEG is safe here because the
      // canvas is fully opaque
      cv.toBlob(function (jpg) {
        if (jpg) cb(jpg, "jpg");
        else if (png) cb(png, "png");
      }, "image/jpeg", 0.92);
    }, "image/png");
  }
  document.getElementById("hcDownload").addEventListener("click", function () {
    blobOut(function (b, ext) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "sue-pfp-" + Date.now() + "." + ext;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    });
  });
  var copyBtn = document.getElementById("hcCopy");
  copyBtn.addEventListener("click", function () {
    // the clipboard only reliably accepts PNG, so it always gets PNG
    cv.toBlob(function (png) {
      if (!png) { copyBtn.textContent = "Copy failed"; return; }
      try {
        navigator.clipboard.write([new ClipboardItem({ "image/png": png })]).then(function () {
          copyBtn.textContent = "✓ Copied";
          setTimeout(function () { copyBtn.textContent = "⧉ Copy"; }, 1500);
        }, function () { copyBtn.textContent = "Copy failed"; });
      } catch (err) { copyBtn.textContent = "Not supported"; }
    }, "image/png");
  });

  // The badge uses Archivo Black; redraw once the webfont is ready so the
  // first paint isn't stuck with the fallback.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(draw);
  }

  draw();
})();
