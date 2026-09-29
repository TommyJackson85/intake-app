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

const landingHtml = fs.readFileSync("product/sample-workspace/index.html", "utf8");
const workspaceHtml = fs.readFileSync(
  "product/sample-workspace/workspace/index.html",
  "utf8",
);
const landingCompact = landingHtml.replace(/\s+/g, " ");
const workspaceCompact = workspaceHtml.replace(/\s+/g, " ");
const derived = deriveCountsFromHtml(workspaceHtml);

log(
  "landing has research questionnaire near top",
  /id="research-questionnaire"/.test(landingHtml) &&
    landingHtml.indexOf('id="research-questionnaire"') <
      landingHtml.indexOf("See the workflow concept"),
);
log(
  "landing has no checklist body",
  !/#sw-checklist-body/.test(landingHtml) && !/sw-checklist-body/.test(landingHtml),
);
log(
  "landing research-first hero copy",
  /Where do Florida real-estate firms lose time between enquiry and matter handoff\?/.test(
    landingHtml,
  ),
);
log(
  "landing workspace CTA",
  /href="\.\/workspace\/"/.test(landingHtml) &&
    /Explore the fictional workspace/.test(landingHtml),
);

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
  log(
    `no unsafe pattern ${pattern}`,
    !pattern.test(workspaceHtml) && !pattern.test(landingHtml),
    pattern.toString(),
  );
}

log(
  "safer readiness wording present",
  /Not marked ready for handoff — 3 priority review items remain open/.test(workspaceHtml),
);
log(
  "client ID onboarding wording",
  /Review documents requested under firm onboarding procedure/.test(workspaceHtml) &&
    /configured firm onboarding process/.test(workspaceCompact),
);
log(
  "SIRS applicability wording",
  /SIRS \/ milestone inspection — firm review of applicability/.test(workspaceHtml) &&
    /Confirm whether this item is relevant to this matter/.test(workspaceHtml),
);
log(
  "condo optional framing",
  /not mandatory for every firm, property, building, or transaction/i.test(workspaceCompact) ||
    /not required for every firm, property, or transaction/i.test(workspaceCompact),
);
log(
  "conflict firm-review framing",
  /does not determine whether a conflict exists/i.test(workspaceCompact) &&
    /Conflict-screening review — firm-authorised reviewer/.test(workspaceHtml),
);
log(
  "workspace survey back-link",
  /href="\.\.\/#research-questionnaire"/.test(workspaceHtml) &&
    /Share 60-second feedback/.test(workspaceHtml),
);
log(
  "local-only questionnaire privacy",
  /There is no research inbox on this page/.test(landingCompact) &&
    /does not receive, store, analyse, or respond to these answers automatically/i.test(
      landingCompact,
    ),
);
log("friction is multi-select", /type="checkbox" name="friction"/.test(landingHtml));
log("frequency question present", /name="frequency"/.test(landingHtml));
log(
  "research conversation optional",
  /Would you be open to a short, no-obligation research conversation about your current workflow\?/.test(
    landingCompact,
  ) && !/name="open_to_conversation"[^>]*required/.test(landingHtml),
);
log(
  "role question wording",
  /What best describes your role in residential real-estate matters\?/.test(landingHtml),
);
log(
  "friction question wording",
  /Which areas create the most follow-up or uncertainty\? Select up to two\./.test(landingHtml),
);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

await page.goto(base + "/product/sample-workspace/", { waitUntil: "networkidle" });
log(
  "landing survey visible without deep scroll past workspace",
  await page.locator("#research-questionnaire").isVisible(),
);
log(
  "landing has no glance checklist",
  (await page.locator("#sw-checklist-summary").count()) === 0,
);

const heroFeedback = page.locator('a.button[href="#research-questionnaire"]').first();
await heroFeedback.click();
await page.waitForFunction(() => {
  const el = document.getElementById("research-questionnaire");
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
});
log("share feedback scrolls to survey", true);

await page.goto(base + "/product/sample-workspace/workspace/", { waitUntil: "networkidle" });
const renderedSummary = ((await page.locator("#sw-checklist-summary").textContent()) || "").trim();
const expectedSummary = `${derived.complete} complete / ${derived.action} require action · ${derived.applicability} applicability review`;
log("rendered summary matches fixture", renderedSummary === expectedSummary, renderedSummary);
log("no 68% primary", (await page.getByText(/68%/).count()) === 0);
log(
  "safer readiness visible",
  (await page.getByText("Not marked ready for handoff — 3 priority review items remain open").count()) >
    0,
);
log(
  "divider present",
  (await page.getByText(/Matter-specific condominium examples/i).count()) > 0,
);
log(
  "engagement awaiting firm decision",
  (await page.getByText(/Draft ready — awaiting firm decision/i).count()) > 0,
);

const workspaceSurveyLinks = await page
  .locator('a[href*="#research-questionnaire"]')
  .count();
log("workspace feedback CTAs present", workspaceSurveyLinks >= 2, String(workspaceSurveyLinks));

await page.goto(base + "/product/sample-workspace/", { waitUntil: "networkidle" });
const demoHrefs = await page.locator('a[href*="intake-app-dun.vercel.app/demo"]').count();
log("interactive demo CTAs present", demoHrefs >= 1, String(demoHrefs));
const fictionHrefs = await page.locator('a[href="./workspace/"]').count();
log("fictional workspace CTAs present", fictionHrefs >= 2, String(fictionHrefs));

await page.goto(base + "/product/sample-workspace/#research-questionnaire");
await page.waitForFunction(() => {
  const el = document.getElementById("research-questionnaire");
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
log(
  "none disabled when others selected",
  await page.isDisabled(frictionNone),
);

await page.locator(friction3).click({ force: true });
log(
  "third friction prevented",
  (await page.locator('input[name="friction"]:checked').count()) === 2 &&
    !(await page.isChecked(friction3)),
);
log(
  "max-two validation message",
  /up to two/i.test((await page.locator("#research-friction-error").textContent()) || ""),
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
log(
  "others disabled when none selected",
  await page.isDisabled(friction1),
);

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

const popupPromise = page.waitForEvent("popup", { timeout: 5000 }).catch(() => null);
await page.click("#research-submit");
const popup = await popupPromise;
log("demo popup", !!popup, popup ? popup.url() : "none");
if (popup) await popup.close();
log("page still mounted", await page.evaluate(() => !!document.getElementById("research-form")));
log(
  "no remote survey submission",
  requests.every((url) => /intake-app-dun\.vercel\.app\/demo/.test(url)),
  requests.join(", "),
);

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
  /copied to the clipboard/i.test((await page.locator("#research-submit-notice").textContent()) || "") &&
    /not sent to LawIntake automatically/i.test(
      (await page.locator("#research-submit-notice").textContent()) || "",
    ),
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
  !/Contact:/.test(clip2) && /Open to a short research conversation: Not right now/.test(clip2),
  clip2,
);

await page.evaluate(() => {
  document.querySelectorAll('input[name="open_to_conversation"]').forEach((el) => {
    el.checked = false;
  });
});
const popupPromise3 = page.waitForEvent("popup", { timeout: 5000 }).catch(() => null);
await page.click("#research-submit");
const popup3 = await popupPromise3;
if (popup3) await popup3.close();
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
log("mobile landing no overflow", !overflow);

await mpage.goto(base + "/product/sample-workspace/workspace/", { waitUntil: "networkidle" });
const workspaceOverflow = await mpage.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
);
log("mobile workspace no overflow", !workspaceOverflow);
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
