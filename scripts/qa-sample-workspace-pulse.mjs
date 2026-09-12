import { chromium, devices } from "playwright";

const base = "http://127.0.0.1:8765";
const results = [];
function log(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? ": " + detail : ""}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
await page.goto(base + "/product/sample-workspace/", { waitUntil: "networkidle" });

log("no 68% primary", (await page.getByText(/68%/).count()) === 0);
log(
  "blocked readiness",
  (await page.getByText("Blocked — 3 priority items require action").count()) > 0,
);
log("checklist counts", (await page.getByText("6 complete / 10 require action").count()) > 0);
log(
  "divider present",
  (await page.getByText("Matter-specific condominium requirements").count()) > 0,
);
log(
  "engagement awaiting acceptance",
  (await page.getByText("Draft ready — awaiting firm acceptance").count()) > 0,
);
log(
  "final CTA heading",
  (await page.getByText("Does this reflect a workflow challenge your team faces?").count()) > 0,
);

const demoHrefs = await page.locator('a[href*="intake-app-dun.vercel.app/demo"]').count();
log("demo CTAs present", demoHrefs >= 3, String(demoHrefs));

await page.goto(base + "/product/sample-workspace/#research-questionnaire");
await page.waitForFunction(() => {
  const el = document.getElementById("research-questionnaire");
  return el && el.getBoundingClientRect().bottom > 0;
});

await page.click("#research-submit");
const invalid = await page.evaluate(() => !document.getElementById("research-form").checkValidity());
log("blocks when empty", invalid);

await page.check('input[name="role"][value="Other"]');
await page.fill("#research-role-other", "Operations lead");
log("role other visible", await page.isVisible("#research-role-other-wrap"));

await page.check('input[name="status_tracking"][value="Other"]');
await page.fill("#research-tracking-other", "Whiteboard");
log("tracking other visible", await page.isVisible("#research-tracking-other-wrap"));

await page.check('input[name="status_tracking"][value="CRM"]');
log("tracking other hidden after CRM", await page.isHidden("#research-tracking-other-wrap"));

await page.check('input[name="friction"][value="Other"]');
await page.fill("#research-friction-other", "Scheduling appraisals");
log("friction other visible", await page.isVisible("#research-friction-other-wrap"));

await page.check('input[name="open_to_conversation"][value="Not right now"]');
log("contact hidden for Not right now", await page.isHidden("#research-contact-wrap"));

await page.check('input[name="open_to_conversation"][value="Yes"]');
log("contact visible for Yes", await page.isVisible("#research-contact-wrap"));

await page.check('input[name="open_to_conversation"][value="Maybe"]');
log("contact visible for Maybe", await page.isVisible("#research-contact-wrap"));
await page.fill("#research-contact", "https://linkedin.com/in/example");
await page.fill("#research-comment", "Clearer next-action ownership.");

const popupPromise = page.waitForEvent("popup", { timeout: 5000 }).catch(() => null);
await page.click("#research-submit");
const popup = await popupPromise;
log("demo popup", !!popup, popup ? popup.url() : "none");
if (popup) await popup.close();
log("page still mounted", await page.evaluate(() => !!document.getElementById("research-form")));

const clip = await page.evaluate(async () => navigator.clipboard.readText());
log("clipboard title", clip.startsWith("LawIntake workflow pulse check"), clip.split("\n")[0]);
log("clipboard role other", /Role: Other — Operations lead/.test(clip), clip);
log("clipboard tracking", /Current intake tracking: CRM/.test(clip));
log("clipboard friction other", /Main follow-up \/ uncertainty: Other — Scheduling appraisals/.test(clip));
log("clipboard contact", /Contact: https:\/\/linkedin.com\/in\/example/.test(clip));
log("clipboard comment", /Additional comment: Clearer next-action ownership\./.test(clip));
log(
  "notice updated",
  /copied to the clipboard/i.test((await page.locator("#research-submit-notice").textContent()) || ""),
);

await page.check('input[name="open_to_conversation"][value="Not right now"]');
log("contact wrap hidden again", await page.isHidden("#research-contact-wrap"));

const popupPromise2 = page.waitForEvent("popup", { timeout: 5000 }).catch(() => null);
await page.click("#research-submit");
const popup2 = await popupPromise2;
if (popup2) await popup2.close();
const clip2 = await page.evaluate(async () => navigator.clipboard.readText());
log(
  "clipboard excludes contact when Not right now",
  !/Contact:/.test(clip2) && /Open to a 15-minute research conversation: Not right now/.test(clip2),
  clip2,
);
log("clipboard excludes hidden tracking other", !/Whiteboard/.test(clip2));

const mobile = await browser.newContext({ ...devices["iPhone 12"] });
const mpage = await mobile.newPage();
await mpage.goto(base + "/product/sample-workspace/", { waitUntil: "networkidle" });
const overflow = await mpage.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
);
log("mobile no overflow", !overflow);
const canScroll = await mpage
  .locator(".sw-table-wrap")
  .first()
  .evaluate((el) => el.scrollWidth > el.clientWidth + 1);
log("mobile table scrollable", canScroll);
await mobile.close();
await browser.close();

const failed = results.filter((r) => !r.pass);
console.log("\nSUMMARY", `${results.length - failed.length}/${results.length}`);
if (failed.length) {
  failed.forEach((f) => console.log("FAIL", f.name, f.detail));
  process.exit(1);
}
