const STORAGE_KEY = "todo-list-items-v1";
const THEME_KEY = "todo-theme";

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const taskCount = document.getElementById("taskCount");
const remainingTasks = document.getElementById("remainingTasks");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const filterButtons = document.querySelectorAll(".filter-btn");
const themeToggle = document.getElementById("themeToggle");

let currentFilter = "all";
let tasks = loadTasks();
let currentTheme = localStorage.getItem(THEME_KEY) || "light";

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTasks() {
  try {
    const storedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(storedTasks) ? storedTasks : [];
  } catch (error) {
    console.error("Could not load tasks from local storage:", error);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function getFilteredTasks() {
  if (currentFilter === "active") {
    return tasks.filter((task) => !task.completed);
  }

  if (currentFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  if (filteredTasks.length === 0) {
    todoList.innerHTML = '<li class="empty-state">No tasks here yet. Add one above.</li>';
  } else {
    todoList.innerHTML = filteredTasks
      .map(
        (task) => `
          <li class="todo-item ${task.completed ? "completed" : ""}" data-id="${task.id}">
            <input
              class="todo-toggle"
              type="checkbox"
              ${task.completed ? "checked" : ""}
              aria-label="Mark ${task.text} as complete"
            />
            <div class="todo-main">
              <span class="todo-text">${task.text}</span>
              <span class="todo-meta">Created: ${formatDateTime(task.createdAt || new Date().toISOString())}</span>
            </div>
            <button class="edit-btn" type="button" data-action="edit" data-id="${task.id}">
              Edit
            </button>
            <button class="delete-btn" type="button" data-action="delete" data-id="${task.id}">
              Delete
            </button>
          </li>
        `
      )
      .join("");
  }

  const totalTasks = tasks.length;
  const remaining = tasks.filter((task) => !task.completed).length;

  taskCount.textContent = `${totalTasks} task${totalTasks === 1 ? "" : "s"}`;
  remainingTasks.textContent = `${remaining} remaining`;

  const clearCompletedDisabled = tasks.every((task) => !task.completed);
  clearCompletedBtn.disabled = clearCompletedDisabled;
  clearCompletedBtn.style.opacity = clearCompletedDisabled ? "0.5" : "1";
  clearCompletedBtn.style.cursor = clearCompletedDisabled ? "not-allowed" : "pointer";
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Just now";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function addTask(text) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    todoInput.focus();
    return;
  }

  tasks.unshift({
    id: generateId(),
    text: trimmedText,
    completed: false,
    createdAt: new Date().toISOString(),
  });

  saveTasks();
  renderTasks();
  todoForm.reset();
  todoInput.focus();
}

function toggleTask(taskId) {
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );

  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
}

function editTask(taskId) {
  const item = document.querySelector(`.todo-item[data-id="${taskId}"]`);
  const task = tasks.find((entry) => entry.id === taskId);

  if (!item || !task) return;

  const textSpan = item.querySelector(".todo-text");
  const editField = document.createElement("input");
  const saveButton = document.createElement("button");
  const cancelButton = document.createElement("button");

  editField.type = "text";
  editField.value = task.text;
  editField.className = "todo-edit-input";
  editField.setAttribute("aria-label", "Edit task text");

  saveButton.type = "button";
  saveButton.textContent = "Save";
  saveButton.className = "save-btn";
  saveButton.dataset.action = "save";
  saveButton.dataset.id = taskId;

  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";
  cancelButton.className = "cancel-btn";
  cancelButton.dataset.action = "cancel";
  cancelButton.dataset.id = taskId;

  const actions = item.querySelectorAll(".edit-btn, .delete-btn");
  actions.forEach((button) => button.remove());

  textSpan.replaceWith(editField);
  item.append(saveButton, cancelButton);
  editField.focus();
  editField.select();
}

function saveEditedTask(taskId, newText) {
  const trimmedText = newText.trim();
  if (!trimmedText) return;

  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, text: trimmedText } : task
  );

  saveTasks();
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
}

function applyTheme(theme) {
  currentTheme = theme;
  document.body.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  localStorage.setItem(THEME_KEY, theme);
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(todoInput.value);
});

todoList.addEventListener("change", (event) => {
  const target = event.target;

  if (target.matches(".todo-toggle")) {
    const item = target.closest(".todo-item");
    const taskId = item?.dataset.id;

    if (taskId) {
      toggleTask(taskId);
    }
  }
});

todoList.addEventListener("click", (event) => {
  const target = event.target;
  const deleteButton = target.closest("[data-action='delete']");
  const editButton = target.closest("[data-action='edit']");
  const saveButton = target.closest("[data-action='save']");
  const cancelButton = target.closest("[data-action='cancel']");

  if (deleteButton) {
    const taskId = deleteButton.dataset.id;
    if (taskId) {
      deleteTask(taskId);
    }
  }

  if (editButton) {
    const taskId = editButton.dataset.id;
    if (taskId) {
      editTask(taskId);
    }
  }

  if (saveButton) {
    const taskId = saveButton.dataset.id;
    const item = saveButton.closest(".todo-item");
    const input = item?.querySelector(".todo-edit-input");

    if (taskId && input) {
      saveEditedTask(taskId, input.value);
    }
  }

  if (cancelButton) {
    renderTasks();
  }
});

todoList.addEventListener("keydown", (event) => {
  if (event.target.matches(".todo-edit-input")) {
    if (event.key === "Enter") {
      const taskId = event.target.closest(".todo-item")?.dataset.id;
      saveEditedTask(taskId, event.target.value);
    }

    if (event.key === "Escape") {
      renderTasks();
    }
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach((btn) => {
      const isActive = btn === button;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });

    renderTasks();
  });
});

clearCompletedBtn.addEventListener("click", clearCompleted);

themeToggle.addEventListener("click", () => {
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

applyTheme(currentTheme);
renderTasks();
