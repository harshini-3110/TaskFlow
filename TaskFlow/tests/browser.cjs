const fs = require("node:fs");
fs.mkdirSync("test-results", { recursive: true });
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("dialog", (d) => d.accept());
  await page.goto(process.env.BASE_URL || "http://127.0.0.1:8001/");
  for (const selector of ["#export", "#import", "#import-file", "#demo"])
    if (await page.locator(selector).count())
      throw Error("removed control is still present: " + selector);
  await page.getByRole("button", { name: "+ New task" }).click();
  await page.getByLabel("Task title").fill("Browser test task");
  await page
    .getByLabel("Notes", { exact: true })
    .fill("<img src=x onerror=alert(1)>");
  await page.getByRole("button", { name: "Save task" }).click();
  await page.getByRole("heading", { name: "Browser test task" }).waitFor();
  console.log("created");
  await page.reload();
  console.log("reloaded");
  await page.getByRole("heading", { name: "Browser test task" }).waitFor();
  await page.getByLabel("Complete Browser test task").check();
  console.log("checked");
  await page.locator("#status").selectOption("done");
  await page
    .getByRole("button", { name: "Edit Browser test task", exact: true })
    .click();
  await page.getByLabel("Task title").fill("Edited task");
  await page.getByRole("button", { name: "Save task" }).click();
  await page
    .getByRole("button", { name: "Delete Edited task", exact: true })
    .waitFor();
  await page.reload();
  await page
    .getByRole("button", { name: "Delete Edited task", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Delete Edited task", exact: true })
    .click();
  if (await page.getByRole("heading", { name: "Edited task" }).count())
    throw Error("delete failed");
  await page.reload();
  if (await page.getByRole("heading", { name: "Edited task" }).count())
    throw Error("deleted task returned after reload");
  await page.locator("#status").selectOption("all");
  await page.screenshot({
    path: "test-results/taskflow-desktop.png",
    fullPage: true,
  });
  for (const [name, width, height] of [
    ["mobile", 390, 844],
    ["tablet", 768, 1024],
    ["desktop", 1280, 900],
  ]) {
    await page.setViewportSize({ width, height });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      )
    )
      throw Error(name + " overflow");
    if (name === "mobile")
      await page.screenshot({
        path: "test-results/taskflow-mobile.png",
        fullPage: true,
      });
  }
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "TaskFlow browser: CRUD, persistence, filters, removed controls, responsive layouts and console checks passed",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
