import {
  $,
  esc,
  toast,
  load,
  save,
  today,
  bindDialogs,
} from "./utils.js";
import { validTasks, selectTasks, summarize, demoTasks } from "./model.js";
const KEY = "taskflow.v1";
let tasks = load(KEY, () => demoTasks(today()), validTasks);
const form = $("#task-form"),
  dialog = $("#task-dialog");
bindDialogs();
function render() {
  const s = summarize(tasks);
  $("#active-count").textContent = s.active;
  $("#done-count").textContent = s.done;
  $("#percent").textContent = s.percent + "%";
  $("#progress").value = s.percent;
  const visible = selectTasks(tasks, {
    query: $("#search").value,
    status: $("#status").value,
    priority: $("#priority-filter").value,
    sort: $("#sort").value,
    today: today(),
  });
  $("#result-count").textContent = `${visible.length} of ${tasks.length} tasks`;
  $("#tasks").innerHTML = visible.length
    ? visible
        .map(
          (t) =>
            `<article class="item ${t.done ? "done" : ""}"><input type="checkbox" data-toggle="${esc(t.id)}" aria-label="Complete ${esc(t.title)}" ${t.done ? "checked" : ""}><div class="content"><h3>${esc(t.title)}</h3><div class="row"><span class="tag ${t.priority === "High" ? "high" : ""}">${t.priority} priority</span>${t.due ? `<small>${!t.done && t.due < today() ? "Overdue · " : ""}${esc(t.due)}</small>` : ""}</div>${t.notes ? `<p>${esc(t.notes)}</p>` : ""}</div><div class="actions"><button data-edit="${esc(t.id)}">Edit<span class="sr-only"> ${esc(t.title)}</span></button><button class="danger" data-delete="${esc(t.id)}">Delete<span class="sr-only"> ${esc(t.title)}</span></button></div></article>`,
        )
        .join("")
    : '<div class="empty"><strong>A little breathing room.</strong>No tasks match this view. Add a task or adjust your filters.</div>';
}
function commit(message) {
  const saved = save(KEY, tasks);
  render();
  if (message && saved) toast(message);
}
function edit(id) {
  form.reset();
  const t = tasks.find((t) => t.id === id);
  for (const key of ["id", "title", "notes", "priority", "due"])
    form.elements[key].value = t?.[key] ?? (key === "priority" ? "Medium" : "");
  $("#dialog-title").textContent = t ? "Edit task" : "New task";
  dialog.showModal();
  form.elements.title.focus();
}
$("#new-task").onclick = () => edit();
form.onsubmit = (e) => {
  e.preventDefault();
  const title = form.elements.title.value.trim();
  if (!title) {
    form.elements.title.setCustomValidity("Enter a title.");
    form.elements.title.reportValidity();
    return;
  }
  const id = form.elements.id.value,
    old = tasks.find((t) => t.id === id);
  const task = {
    id: id || crypto.randomUUID(),
    title,
    notes: form.elements.notes.value.trim(),
    priority: form.elements.priority.value,
    due: form.elements.due.value,
    done: old?.done ?? false,
    created: old?.created ?? Date.now(),
  };
  tasks = old ? tasks.map((t) => (t.id === id ? task : t)) : [task, ...tasks];
  commit(old ? "Task updated" : "Task added");
  dialog.close();
};
form.elements.title.oninput = () => form.elements.title.setCustomValidity("");
$("#tasks").onclick = (e) => {
  const b = e.target.closest("button");
  if (b?.dataset.edit) edit(b.dataset.edit);
  if (b?.dataset.delete && confirm("Delete this task?")) {
    tasks = tasks.filter((t) => t.id !== b.dataset.delete);
    commit("Task deleted");
  }
};
$("#tasks").onchange = (e) => {
  if (e.target.dataset.toggle) {
    tasks = tasks.map((t) =>
      t.id === e.target.dataset.toggle ? { ...t, done: e.target.checked } : t,
    );
    commit("Progress saved");
  }
};
for (const id of ["search", "status", "priority-filter", "sort"])
  $("#" + id).addEventListener("input", render);
window.addEventListener("storage", (e) => {
  if (e.key === KEY) {
    tasks = load(KEY, () => [], validTasks);
    render();
    toast("Updated from another tab");
  }
});
render();
