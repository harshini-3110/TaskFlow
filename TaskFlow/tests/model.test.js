import test from "node:test";
import assert from "node:assert/strict";
import { validTasks, selectTasks, summarize, demoTasks } from "../model.js";
test("demo is valid and summary counts completion", () => {
  const tasks = demoTasks("2026-10-22");
  assert.ok(validTasks(tasks));
  assert.deepEqual(summarize(tasks), { done: 1, active: 2, percent: 33 });
  assert.equal(summarize([]).percent, 0);
});
test("combined search, status and priority filters", () => {
  const tasks = demoTasks("2026-10-21");
  assert.equal(
    selectTasks(tasks, {
      query: "TYPOGRAPHY",
      status: "overdue",
      priority: "High",
      today: "2026-10-22",
    }).length,
    1,
  );
  assert.equal(
    selectTasks(tasks, { status: "done", priority: "High" }).length,
    0,
  );
});
test("due sorting puts undated tasks last", () =>
  assert.equal(
    selectTasks(demoTasks("2026-10-22"), { sort: "due" })[0].id,
    "demo-1",
  ));
test("rejects malformed and duplicate saved tasks", () => {
  assert.equal(validTasks({}), false);
  const tasks = demoTasks("2026-10-22");
  assert.equal(validTasks([...tasks, tasks[0]]), false);
  assert.equal(validTasks([{ ...tasks[0], title: " " }]), false);
});
