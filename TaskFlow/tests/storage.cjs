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
  try {
    for (const [name, key, collection, open] of [
      ["TaskFlow", "taskflow.v1", "#tasks", "+ New task"],
    ]) {
      const page = await browser.newPage();
      page.setDefaultTimeout(10000);
      page.on("dialog", (d) => d.accept());
      await page.goto(process.env.BASE_URL || "http://127.0.0.1:8001/");
      for (const selector of ["#export", "#import", "#import-file", "#demo"])
        if (await page.locator(selector).count())
          throw Error("removed control is still present: " + selector);
      await page
        .locator(collection + " .item")
        .first()
        .waitFor();
      if ((await page.locator(collection + " .item").count()) !== 3)
        throw Error("first-visit sample tasks were not loaded");
      await page.getByRole("button", { name: open, exact: true }).click();
      await page.keyboard.press("Escape");
      if (await page.locator("dialog[open]").count())
        throw Error("Escape failed");
      await page.evaluate((key) => localStorage.setItem(key, "[]"), key);
      await page.reload();
      if (await page.locator(collection + " .item").count())
        throw Error("empty list was reseeded");
      await page.evaluate((key) => localStorage.setItem(key, "{broken"), key);
      await page.reload();
      await page
        .locator("#storage-warning")
        .filter({ hasText: "could not be read" })
        .waitFor();
      if (
        (await page.evaluate((key) => localStorage.getItem(key), key)) !==
        "{broken"
      )
        throw Error("corrupt data overwritten");
      await page.evaluate((key) => localStorage.setItem(key, "[]"), key);
      await page.addInitScript(() => {
        Storage.prototype.setItem = () => {
          throw new Error("storage blocked");
        };
      });
      await page.reload();
      await page.getByRole("button", { name: open, exact: true }).click();
      await page.getByLabel("Task title").fill("Unsaved task");
      await page.getByRole("button", { name: "Save task" }).click();
      await page
        .locator("#storage-warning")
        .filter({ hasText: "may be lost when this page closes" })
        .waitFor();
      await page
        .locator("#toast")
        .filter({ hasText: "may be lost when this page closes" })
        .waitFor();
      await page.emulateMedia({ reducedMotion: "reduce" });
      const duration = await page
        .locator(collection + " .item")
        .first()
        .evaluate((e) => getComputedStyle(e).animationDuration);
      if (duration !== "0s") throw Error("reduced motion not honored");
      for (const [width, height] of [
        [390, 844],
        [768, 1024],
        [1280, 900],
      ]) {
        await page.setViewportSize({ width, height });
        if (
          await page.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth,
          )
        )
          throw Error("layout overflow at " + width + "px");
      }
      await page.evaluate(
        () => (document.querySelector("#toast").textContent = ""),
      );
      await page.screenshot({
        path: "test-results/" + name.toLowerCase() + "-clean.png",
        fullPage: true,
      });
      await page.close();
      console.log(
        name +
          ": first-visit samples, removed controls, empty persistence, corrupt storage, storage failures, Escape and reduced motion passed",
      );
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
