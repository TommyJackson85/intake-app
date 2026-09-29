import { chromium, devices } from "playwright";
import fs from "fs";
import { JSDOM } from "jsdom";

const base = "http://127.0.0.1:8765";
const results = [];
function log(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? ": " + detail : ""}`);
}

function deriveCountsFromHtml(html) {
  const dom = new JSDOM(html);
  const rows = [
    ...dom.window.document.querySelectorAll("#sw-checklist-body tr[data-status]"),
  ];
  const completeStatuses = new Set(["complete", "received"]);
  const actionStatuses = new Set([
    "needs-review",
    "missing",
    "waiting",
    "not-ready",
    "in-progress",
  ]);
  let complete = 0;
  let action = 0;
  let applicability = 0;
  let coreComplete = 0;
  let coreAction = 0;
  let condoComplete = 0;
  let condoAction = 0;
  for (const row of rows) {
    const status = row.getAttribute("data-status") || "";
    const scope = row.getAttribute("data-scope") || "core";
    if (status === "review-applicability") {
      applicability += 1;
      continue;
    }
    if (completeStatuses.has(status)) {
      complete += 1;
      if (scope === "condo") condoComplete += 1;
      else coreComplete += 1;
      continue;
    }
    if (actionStatuses.has(status)) {
      action += 1;
      if (scope === "condo") condoAction += 1;
      else coreAction += 1;
    }
  }
  return {
    complete,
    action,
    applicability,
    coreComplete,
    coreAction,
    condoComplete,
    condoAction,
    rowCount: rows.length,
  };
}

const html = fs.readFileSync("product/sample-workspace/index.html", "utf8");
const compact = html.replace(/\s+/g, " ");
const derived = deriveCountsFromHtml(html);

log("same-page has sample-workflow before survey", html.indexOf('id="sample-workflow"') < html.indexOf('id="research-pulse-check"'));
log(
  "same-page has survey before full workspace",
  html.indexOf('id="research-pulse-check"') < html.indexOf('id="full-fictional-workspace"'),
);
log(
  "product-first hero heading",
  /Make the next action and handoff blocker visible on every new real-estate matter\./.test(html),
);
log(
  "research question secondary in hero",
  /Where do Florida real-estate firms lose time between enquiry and matter handoff\?/.test(html),
);
log("hero primary scrolls to sample workflow", /href="#sample-workflow"/.test(html));
log("hero secondary scrolls to survey", /href="#research-pulse-check"/.test(html));
log("skip link scrolls to full workspace", /href="#full-fictional-workspace"/.test(html));
log("eight glance cards", (html.match(/sw-glance-card"/g) || []).length === 8 || (html.match(/class="sw-glance-card"/g) || []).length === 8);
log("no duplicate not-ready glance cards", (html.match(/Not marked ready for handoff/g) || []).length <= 3);
log("target closing visible before survey", html.indexOf("24 October 2026") < html.indexOf('id="research-pulse-check"'));
log("sample timing column present", /Sample timing/.test(html));
log("before next handoff section", /Before the next handoff/.test(html));
log("transaction-specific panel", /Configurable for transaction-specific work/.test(html));
log("acceptance decision terminology", /Acceptance decision/.test(html));

log("fixture has checklist rows", derived.rowCount === 16, String(derived.rowCount));
log(
  "fixture counts 6/9 + 1 applicability",
  derived.complete === 6 && derived.action === 9 && derived.applicability === 1,
  JSON.stringify(derived),
);
log(
  "fixture core/condo split",
  derived.coreComplete === 4 &&
    derived.coreAction === 6 &&
    derived.condoComplete === 2 &&
    derived.condoAction === 3,
  JSON.stringify(derived),
);

for (const pattern of [
  /Blocked until review \+ outstanding items/i,
  /Blocks engagement send/i,
  /6 complete \/ 10 require action/i,
  /Blocked — 3 priority items require action/i,
  /68%/i,
]) {
  log(`no unsafe pattern ${pattern}`, !pattern.test(html), pattern.toString());
}

log(
  "safer readiness wording present",
  /Handoff gate/.test(html) && /Blocked/.test(html) && /Acceptance decision and onboarding review remain/.test(html),
);
log(
  "client ID onboarding wording",
  /Review documents requested under firm onboarding procedure/.test(html) &&
    /configured firm onboarding process/.test(compact),
);
log(
  "SIRS applicability wording",
  /SIRS \/ milestone inspection — firm review of applicability/.test(html) &&
    /Confirm whether this item is relevant to this matter/.test(html),
);
log(
  "condo optional framing",
  /Optional, firm-configured example for this fictional condominium purchase/.test(compact),
);
log(
  "conflict firm-review framing",
  /does not determine whether a conflict exists/i.test(compact) &&
    /Conflict review — assigned attorney/.test(html),
);
log(
  "local-only questionnaire privacy",
  /There is no research inbox on this page/.test(compact) &&
    /does not receive, store, analyse, or respond to these answers automatically/i.test(compact),
);
log("friction is multi-select", /type="checkbox" name="friction"/.test(html));
log("frequency question present", /name="frequency"/.test(html));
log(
  "research conversation optional",
  /Would you be open to a short, no-obligation research conversation about your current workflow\?/.test(
    compact,
  ) && !/name="open_to_conversation"[^>]*required/.test(html),
);
log(
  "role question wording",
  /What best describes your role in residential real-estate matters\?/.test(html),
);
log(
  "friction question wording",
  /Which areas create the most follow-up or uncertainty\? Select up to two\./.test(html),
);
log(
  "copy opens full workflow not remote demo popup",
  /Copy answers &amp; open full workflow/.test(html) &&
    !/window\.open\(DEMO_URL/.test(html),
);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
await page.goto(base + "/product/sample-workspace/", { waitUntil: "networkidle" });

log("preview section visible", await page.locator("#sample-workflow").isVisible());
log("survey section present", await page.locator("#research-pulse-check").count() === 1);
log("full workspace present", await page.locator("#full-fictional-workspace").count() === 1);
log(
  "checklist in full workspace",
  (await page.locator("#full-fictional-workspace #sw-checklist-body tr[data-status]").count()) === 16,
);

await page.locator('a.button[href="#sample-workflow"]').first().click();
await page.waitForFunction(() => {
  const el = document.getElementById("sample-workflow");
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
});
log("view sample workflow scrolls", true);

await page.locator('a[href="#research-pulse-check"]').first().click();
await page.waitForFunction(() => {
  const el = document.getElementById("research-pulse-check");
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
});
log("share feedback scrolls to survey", true);

await page.goto(base + "/product/sample-workspace/#research-pulse-check");
await page.waitForFunction(() => {
  const el = document.getElementById("research-pulse-check");
  return el && el.getBoundingClientRect().bottom > 0;
});

await page.click("#research-submit");
const invalid = await page.evaluate(() => !document.getElementById("research-form").checkValidity());
log("blocks when required empty", invalid);

await page.check('input[name="role"][value="Other"]');
await page.fill("#research-role-other", "Operations lead");
log("role other visible", await page.isVisible("#research-role-other-wrap"));

await page.check('input[name="status_tracking"][value="CRM"]');
await page.check('input[name="frequency"][value="Several times a week"]');

const friction1 = 'input[name="friction"][value="Knowing who owns the next action"]';
const friction2 =
  'input[name="friction"][value="Knowing whether the matter is ready for engagement, opening, or handoff"]';
const friction3 =
  'input[name="friction"][value="Tracking transaction-specific diligence, such as condo or association items"]';
const frictionNone =
  'input[name="friction"][value="We do not experience meaningful follow-up uncertainty"]';

await page.check(friction1);
await page.check(friction2);
log("two frictions allowed", (await page.locator('input[name="friction"]:checked').count()) === 2);
log("none disabled when others selected", await page.isDisabled(frictionNone));
log("third ordinary disabled at max", await page.isDisabled(friction3));

await page.locator(friction3).click({ force: true });
log(
  "third friction prevented",
  (await page.locator('input[name="friction"]:checked').count()) === 2 &&
    !(await page.isChecked(friction3)),
);

await page.uncheck(friction1);
await page.uncheck(friction2);
await page.check(frictionNone);
log(
  "none mutually exclusive",
  (await page.isChecked(frictionNone)) &&
    !(await page.isChecked(friction1)) &&
    !(await page.isChecked(friction2)),
);
log("others disabled when none selected", await page.isDisabled(friction1));

await page.uncheck(frictionNone);
await page.check(friction1);
await page.check('input[name="friction"][value="Other"]');
await page.fill("#research-friction-other", "Scheduling appraisals");
log("friction other visible", await page.isVisible("#research-friction-other-wrap"));

await page.check('input[name="open_to_conversation"][value="Not right now"]');
log("contact hidden for Not right now", await page.isHidden("#research-contact-wrap"));
await page.check('input[name="open_to_conversation"][value="Maybe"]');
log("contact visible for Maybe", await page.isVisible("#research-contact-wrap"));
await page.fill("#research-contact", "https://linkedin.com/in/example");
await page.fill("#research-comment", "Clearer next-action ownership before engagement.");

const requests = [];
page.on("request", (req) => {
  if (!req.url().startsWith(base)) requests.push(req.url());
});

const popupPromise = page.waitForEvent("popup", { timeout: 1500 }).catch(() => null);
await page.click("#research-submit");
const popup = await popupPromise;
log("no demo popup", !popup, popup ? popup.url() : "none");
if (popup) await popup.close();
log("page still mounted", await page.evaluate(() => !!document.getElementById("research-form")));
log("no remote survey submission", requests.length === 0, requests.join(", "));

await page.waitForFunction(() => {
  const el = document.getElementById("full-fictional-workspace");
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
});
log("copy scrolls to full workspace", true);

const clip = await page.evaluate(async () => navigator.clipboard.readText());
log("clipboard title", clip.startsWith("LawIntake workflow pulse check"), clip.split("\n")[0]);
log("clipboard role other", /Role: Other — Operations lead/.test(clip), clip);
log("clipboard tracking", /Current intake tracking: CRM/.test(clip));
log(
  "clipboard friction",
  /Knowing who owns the next action/.test(clip) && /Scheduling appraisals/.test(clip),
);
log("clipboard frequency", /How often this slows a new matter: Several times a week/.test(clip));
log("clipboard comment", /Hardest to see or chase: Clearer next-action ownership/.test(clip));
log("clipboard contact", /Contact: https:\/\/linkedin.com\/in\/example/.test(clip));
log(
  "notice updated",
  /copied on this device/i.test((await page.locator("#research-submit-notice").textContent()) || ""),
);

await page.locator('a.button[href="#research-pulse-check"]').last().click();
await page.waitForFunction(() => {
  const el = document.getElementById("research-pulse-check");
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
});
log("final CTA scrolls to survey", true);

await page.check('input[name="open_to_conversation"][value="Not right now"]');
log("contact wrap hidden again", await page.isHidden("#research-contact-wrap"));
await page.click("#research-submit");
const clip2 = await page.evaluate(async () => navigator.clipboard.readText());
log(
  "clipboard excludes contact when Not right now",
  !/Contact:/.test(clip2) && /Open to a short research conversation: Not right now/.test(clip2),
  clip2,
);

await page.evaluate(() => {
  document.querySelectorAll('input[name="open_to_conversation"]').forEach((el) => {
    el.checked = false;
  });
});
await page.click("#research-submit");
const clip3 = await page.evaluate(async () => navigator.clipboard.readText());
log(
  "conversation optional omitted from clipboard",
  !/Open to a short research conversation:/.test(clip3),
  clip3,
);

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

await mpage.goto(base + "/product/sample-workspace/workspace/", { waitUntil: "domcontentloaded" });
await mpage.waitForURL(/sample-workspace\/?(#|$)/);
log(
  "workspace route redirects to same page",
  /sample-workspace\/?(#full-fictional-workspace)?/.test(mpage.url()),
  mpage.url(),
);

await mobile.close();
await browser.close();

const failed = results.filter((r) => !r.pass);
console.log("\nSUMMARY", `${results.length - failed.length}/${results.length}`);
if (failed.length) {
  failed.forEach((f) => console.log("FAIL", f.name, f.detail));
  process.exit(1);
}
