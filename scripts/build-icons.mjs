// Renders the app icon from assets/icon.svg into the sizes the manifest and iOS
// need. Run with `npm run icons` after changing the source; the PNGs are
// committed so neither the build nor CI depends on this step.
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SOURCE = new URL("../assets/icon.svg", import.meta.url);
const OUT_DIR = fileURLToPath(new URL("../public/icons/", import.meta.url));

/** A maskable icon must survive an aggressive circular crop, so the glyph sits
 *  inside the middle 80%. */
function maskableSvg(base) {
  return base
    .replace('width="512" height="512"', 'width="512" height="512"')
    .replace('font-size="200"', 'font-size="160"');
}

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-512-maskable.png", size: 512, maskable: true },
  { file: "apple-touch-icon-180.png", size: 180, maskable: false },
];

const source = await readFile(SOURCE, "utf8");
await mkdir(OUT_DIR, { recursive: true });

for (const { file, size, maskable } of targets) {
  const svg = maskable ? maskableSvg(source) : source;
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`${OUT_DIR}${file}`);
  console.log(`${file} — ${size}×${size}${maskable ? " (maskable)" : ""}`);
}
