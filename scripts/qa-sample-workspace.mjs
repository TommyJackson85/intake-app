import { spawnSync } from "node:child_process";
import { chromium } from "playwright";
import fs from "fs";

/**
 * Smoke checks for Sample Real-Estate Matter Workspace + homepage links.
 * Detailed survey/clipboard coverage: scripts/qa-sample-workspace-pulse.mjs
 */
const base = "http://127.0.0.1:8765";
const out = "/tmp/qa-artifacts";
fs.mkdirSync(out, { recursive: true });

const pulse = spawnSync(process.execPath, ["scripts/qa-sample-workspace-pulse.mjs"], {
  cwd: new URL("..", import.meta.url).pathname,
  encoding: "utf8",
  stdio: "inherit",
});
if (pulse.status !== 0) {
  process.exit(pulse.status || 1);
}

const results = [];
function log(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? ": " + detail : ""}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(base + "/product/sample-workspace/", { waitUntil: "networkidle" });
await page.screenshot({
  path: `${out}/sample-workspace-desktop-glance.png`,
  fullPage: false,
});
await page.locator("#research-questionnaire").scrollIntoViewIfNeeded();
await page.screenshot({
  path: `${out}/sample-workspace-desktop-survey.png`,
  fullPage: false,
});

await page.goto(base + "/", { waitUntil: "networkidle" });
const hrefs = await page
  .locator('a[href*="sample-workspace"]')
  .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
log("homepage has sample-workspace links", hrefs.length > 0, hrefs.slice(0, 6).join(", "));
const localLink = page.locator('a[href="./product/sample-workspace/"], a[href="/product/sample-workspace/"]').first();
if ((await localLink.count()) > 0) {
  await localLink.click();
  await page.waitForURL(/sample-workspace/);
  log("homepage sample link navigates", /sample-workspace/.test(page.url()));
} else {
  log("homepage sample link navigates", false, "no relative sample-workspace link found");
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(base + "/product/sample-workspace/", { waitUntil: "networkidle" });
await mobile.screenshot({
  path: `${out}/sample-workspace-mobile-glance.png`,
  fullPage: false,
});
await browser.close();

// Copy screenshots into artifacts dir when available
const artifacts = "/opt/cursor/artifacts/screenshots";
try {
  fs.mkdirSync(artifacts, { recursive: true });
  for (const name of [
    "sample-workspace-desktop-glance.png",
    "sample-workspace-desktop-survey.png",
    "sample-workspace-mobile-glance.png",
  ]) {
    fs.copyFileSync(`${out}/${name}`, `${artifacts}/${name}`);
  }
  log("screenshots saved", true, artifacts);
} catch (err) {
  log("screenshots saved", false, String(err.message || err));
}

const failed = results.filter((r) => !r.pass);
console.log("\nSMOKE SUMMARY", `${results.length - failed.length}/${results.length}`);
if (failed.length) process.exit(1);
