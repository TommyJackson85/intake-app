import { chromium, devices } from "playwright";
import fs from "fs";

const base = "http://127.0.0.1:8765";
const out = "/tmp/qa-artifacts";
fs.mkdirSync(out, { recursive: true });

const results = [];
function log(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? ": " + detail : ""}`);
}

const browser = await chromium.launch({ headless: true });

{
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/product/sample-workspace/", { waitUntil: "networkidle" });
  log("desktop load", true, await page.title());
  log("no pageerror on load", errors.length === 0, errors.join("; "));
  const h1 = (await page.locator("h1").first().textContent()) || "";
  log(
    "hero platform framing",
    /matter workspace|Sample Real-Estate Matter Workspace|real-estate/i.test(h1),
    h1.trim(),
  );
  log("configurable line", (await page.getByText(/configurable/i).count()) > 0);
  log("68% present", (await page.getByText(/68%/i).count()) > 0);
  const glanceText = await page.locator(".sw-glance-card").nth(1).innerText();
  log(
    "legal caveat",
    /not a determination of legal completeness/i.test(glanceText),
    glanceText.replace(/\s+/g, " ").slice(0, 160),
  );
  log(
    "condo optional framing",
    (await page.getByText(/not mandatory for every firm|example matter-specific|optional firm-configured/i).count()) >
      0,
  );
  log("conflict section", (await page.locator("#conflict-heading").count()) > 0);

  await page.goto(base + "/product/sample-workspace/#research-questionnaire", {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() => {
    const el = document.getElementById("research-questionnaire");
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return el.classList.contains("visible") && r.bottom > 0 && r.top < window.innerHeight;
  }, null, { timeout: 5000 });
  const inView = await page.evaluate(() => {
    const el = document.getElementById("research-questionnaire");
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });
  const revealed = await page.evaluate(() => {
    const el = document.getElementById("research-questionnaire");
    return !!(el && el.classList.contains("visible"));
  });
  log("hash scrolls to survey", inView, `revealed=${revealed}`);

  await page.selectOption("#research-role", { label: "Attorney" });
  await page.selectOption("#research-enquiry-channel", { label: "Email" });
  await page.locator('input[name="status_tracking"]').first().check();
  await page.selectOption("#research-chase-method", { label: "Email threads" });
  await page.fill("#research-readiness", "We review a checklist with the attorney.");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const popupPromise = page.waitForEvent("popup", { timeout: 5000 }).catch(() => null);
  await page.click("#research-submit");
  const popup = await popupPromise;
  log("demo popup opened", !!popup, popup ? popup.url() : "blocked/none");
  if (popup) await popup.close();
  // Survey page must remain mounted (noopener null-return bug used to navigate away).
  log(
    "survey page still mounted",
    await page.evaluate(() => !!document.getElementById("research-form")),
  );
  await page.waitForFunction(() => {
    const n = document.getElementById("research-submit-notice");
    return n && /copied|clipboard|demo/i.test(n.textContent || "");
  }, null, { timeout: 5000 });
  const clip = await page.evaluate(async () => {
    try {
      return await navigator.clipboard.readText();
    } catch (e) {
      return "CLIP_ERR:" + e.message;
    }
  });
  log("clipboard has answers", /Attorney/.test(clip), String(clip).slice(0, 140).replace(/\n/g, " | "));
  const notice = await page.locator("#research-submit-notice").textContent();
  log("submit notice updated", /copied|clipboard|demo/i.test(notice || ""), (notice || "").trim().slice(0, 120));
  await page.screenshot({ path: `${out}/desktop-survey.png` });
  await page.close();
}

{
  const context = await browser.newContext({ ...devices["iPhone 12"] });
  const page = await context.newPage();
  await page.goto(base + "/product/sample-workspace/", { waitUntil: "networkidle" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
  );
  log("mobile no page overflow", !overflow);
  const wrap = page.locator(".sw-table-wrap").first();
  await wrap.scrollIntoViewIfNeeded();
  const canScroll = await wrap.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  log("mobile table horizontal scrollable", canScroll);
  await page.goto(base + "/product/sample-workspace/#research-questionnaire");
  await page.waitForTimeout(500);
  await page.selectOption("#research-role", { label: "Paralegal" });
  log("mobile select works", (await page.inputValue("#research-role")) === "Paralegal");
  await page.screenshot({ path: `${out}/mobile-hero.png`, fullPage: false });
  await wrap.screenshot({ path: `${out}/mobile-table.png` }).catch(() => {});
  await context.close();
}

{
  const page = await browser.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const hrefs = await page
    .locator('a[href*="sample-workspace"]')
    .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  log("homepage has sample-workspace links", hrefs.length > 0, hrefs.slice(0, 6).join(", "));
  await page.locator('a[href="./product/sample-workspace/"]').first().click();
  await page.waitForURL(/sample-workspace/);
  log("homepage sample link navigates", /sample-workspace/.test(page.url()));
  await page.goto(base + "/insights/");
  log(
    "insights has sample links",
    (await page.locator('a[href*="sample-workspace"]').count()) > 0,
  );
  await page.close();
}

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log("\nSUMMARY", results.length - failed.length + "/" + results.length, "passed");
if (failed.length) {
  console.log("FAILURES");
  failed.forEach((f) => console.log("-", f.name, f.detail));
  process.exit(1);
}
