// アプリのアイコン（icon-192.png・icon-512.png）を作る。紺の地に、白い傘（みんなで支える保険のしるし）。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#123554"/>
      <path d="M14 54 Q50 8 86 54 Q77 46 68 54 Q59 46 50 54 Q41 46 32 54 Q23 46 14 54Z" fill="#fffdf7"/>
      <path d="M50 54 V80 Q50 88 42 88 Q36 88 35 82" fill="none" stroke="#fffdf7" stroke-width="6" stroke-linecap="round"/></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
