// Script to resize the NC icon to all required Android mipmap sizes
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ICON_SRC = path.join(
  'C:\\Users\\Freedom Labs\\.gemini\\antigravity-ide\\brain\\8a4ea69e-cdd3-4dc2-b5e2-d50b61d3519a',
  'nc_icon_1783351419824.png'
);

const MIPMAP_SIZES = {
  'mipmap-mdpi':    48,
  'mipmap-hdpi':    72,
  'mipmap-xhdpi':   96,
  'mipmap-xxhdpi':  144,
  'mipmap-xxxhdpi': 192,
};

const RES_DIR = path.join('android', 'app', 'src', 'main', 'res');

async function generateIcons() {
  for (const [folder, size] of Object.entries(MIPMAP_SIZES)) {
    const outDir = path.join(RES_DIR, folder);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // ic_launcher.png (square)
    await sharp(ICON_SRC)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, 'ic_launcher.png'));

    // ic_launcher_round.png (circle crop)
    const svgCircleMask = Buffer.from(
      `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}"/></svg>`
    );
    await sharp(ICON_SRC)
      .resize(size, size)
      .composite([{ input: svgCircleMask, blend: 'dest-in' }])
      .png()
      .toFile(path.join(outDir, 'ic_launcher_round.png'));

    console.log(`✓ Generated ${folder} (${size}x${size})`);
  }

  // Also copy 512px version for anydpi-v26 (foreground layer)
  const anydpiDir = path.join(RES_DIR, 'mipmap-anydpi-v26');
  await sharp(ICON_SRC).resize(108, 108).png().toFile(path.join(RES_DIR, 'mipmap-mdpi', 'ic_launcher_foreground.png'));

  console.log('\n✅ All Android icons generated successfully!');
}

generateIcons().catch(console.error);
