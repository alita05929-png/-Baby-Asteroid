const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const root = "E:/pack/solana/6";
const gen = "C:/Users/Alita/.cursor/projects/e-pack-solana-6/assets";
const out = path.join(root, "assets");

function isBg(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (r + g + b) / 3;
  return lum > 226 && sat < 0.16;
}

async function knockOut(src, dest) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const n = width * height;
  const visited = new Uint8Array(n);
  const q = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (visited[i]) return;
    const o = i * channels;
    if (!isBg(data[o], data[o + 1], data[o + 2])) return;
    visited[i] = 1;
    q.push(i);
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  while (q.length) {
    const i = q.pop();
    const x = i % width;
    const y = (i / width) | 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }
  for (let i = 0; i < n; i++) {
    if (visited[i]) data[i * channels + 3] = 0;
  }
  await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(dest);
  const meta = await sharp(src).metadata();
  console.log("cutout", meta.width, meta.height, "->", dest);
}

async function main() {
  fs.mkdirSync(out, { recursive: true });
  await knockOut(path.join(root, "logo.png"), path.join(out, "mascot.png"));

  const icon = path.join(gen, "baby-icon.png");
  await sharp(icon).resize(512, 512).png().toFile(path.join(out, "icon-512.png"));
  await sharp(icon).resize(180, 180).png().toFile(path.join(out, "apple-touch-icon.png"));
  await sharp(icon).resize(32, 32).png().toFile(path.join(out, "favicon-32.png"));
  await sharp(icon).resize(256, 256).png().toFile(path.join(out, "logo-nav.png"));

  await sharp(path.join(gen, "baby-portrait.png")).png().toFile(path.join(out, "portrait.png"));
  await sharp(path.join(gen, "baby-mark.png")).png().toFile(path.join(out, "mark.png"));

  const bannerMeta = await sharp(path.join(root, "banner.png")).metadata();
  console.log("banner", bannerMeta.width, bannerMeta.height);
  await sharp(path.join(root, "banner.png")).png().toFile(path.join(out, "banner.png"));
  await sharp(path.join(root, "banner.png"))
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .jpeg({ quality: 86 })
    .toFile(path.join(out, "og.jpg"));

  for (const old of [
    "sue-cutout.png",
    "sue-hero.jpg",
    "sue-logo.jpg",
    "sue-icon-512.png",
    "og-born-to-build.jpg",
  ]) {
    const p = path.join(out, old);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  const ico = path.join(root, "favicon.ico");
  if (fs.existsSync(ico)) fs.unlinkSync(ico);

  const files = fs.readdirSync(out);
  for (const f of files) {
    const st = fs.statSync(path.join(out, f));
    console.log(String(st.size).padStart(8), f);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
