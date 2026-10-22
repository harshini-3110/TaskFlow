export function validTasks(data) {
  return (
    Array.isArray(data) &&
    data.length <= 10000 &&
    new Set(data.map((t) => t?.id)).size === data.length &&
    data.every(
      (t) =>
        t &&
        typeof t.id === "string" &&
        typeof t.title === "string" &&
        t.title.trim().length > 0 &&
        t.title.length <= 120 &&
        typeof t.notes === "string" &&
        t.notes.length <= 2000 &&
        ["High", "Medium", "Low"].includes(t.priority) &&
        typeof t.done === "boolean" &&
        typeof t.due === "string" &&
        (!t.due || /^\d{4}-\d{2}-\d{2}$/.test(t.due)) &&
        Number.isFinite(t.created),
    )
  );
}
export function selectTasks(
  tasks,
  { query = "", status = "all", priority = "all", sort = "newest", today = "" },
) {
  return tasks
    .filter(
      (t) =>
        (t.title + " " + t.notes).toLowerCase().includes(query.toLowerCase()) &&
        (priority === "all" || t.priority === priority) &&
        (status === "all" ||
          (status === "done" && t.done) ||
          (status === "active" && !t.done) ||
          (status === "overdue" && !t.done && t.due && t.due < today)),
    )
    .sort((a, b) =>
      sort === "due"
        ? (a.due || "9999").localeCompare(b.due || "9999")
        : sort === "priority"
          ? ["High", "Medium", "Low"].indexOf(a.priority) -
            ["High", "Medium", "Low"].indexOf(b.priority)
          : b.created - a.created,
    );
}
export function summarize(tasks) {
  const done = tasks.filter((t) => t.done).length;
  return {
    done,
    active: tasks.length - done,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}
export function demoTasks(today) {
  return [
    {
      id: "demo-1",
      title: "Sketch the portfolio homepage",
      notes: "Start with typography and a simple layout. Keep the story clear.",
      priority: "High",
      due: today,
      done: false,
      created: 3,
    },
    {
      id: "demo-2",
      title: "Prepare for the design review",
      notes: "Gather three examples of work you are proud of.",
      priority: "Medium",
      due: "",
      done: false,
      created: 2,
    },
    {
      id: "demo-3",
      title: "Create a project moodboard",
      notes: "Restrained color. A little geometry. Plenty of space.",
      priority: "Low",
      due: "",
      done: true,
      created: 1,
    },
  ];
}
