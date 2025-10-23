// =============================
// Load & Save Data
// =============================
async function loadData() {
  const saved = localStorage.getItem("budgetData");
  if (saved) {
    return JSON.parse(saved);
  } else {
    const res = await fetch("data/mock_data.json");
    const json = await res.json();
    localStorage.setItem("budgetData", JSON.stringify(json));
    return json;
  }
}

function saveData() {
  localStorage.setItem("budgetData", JSON.stringify(data));
}

let data = {};

async function init() {
  data = await loadData();
  renderAll();
  addEventListeners();
}

// =============================
// Render Functions
// =============================
function renderOverview() {
  const totalSpent = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = data.totalBudget - totalSpent;

  document.getElementById("totalBudget").textContent = `$${data.totalBudget}`;
  document.getElementById("totalSpent").textContent = `$${totalSpent}`;
  document.getElementById("remaining").textContent = `$${remaining}`;
}

function renderGoals() {
  const goalList = document.getElementById("goalList");
  goalList.innerHTML = "";
  data.goals.forEach((goal) => {
    const percent = ((goal.current / goal.target) * 100).toFixed(1);
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${goal.name}</strong><br>
      <progress value="${goal.current}" max="${goal.target}"></progress>
      <p>${percent}% of $${goal.target}</p>
    `;
    goalList.appendChild(li);
  });
}

function renderExpenses() {
  const expenseList = document.getElementById("expenseList");
  expenseList.innerHTML = "";
  data.expenses.forEach((exp) => {
    const li = document.createElement("li");
    li.textContent = `${exp.name}: $${exp.amount}`;
    expenseList.appendChild(li);
  });
}

function renderAll() {
  renderOverview();
  renderGoals();
  renderExpenses();
}

// =============================
// Render Spending Summary (Neil's task)
// =============================
function renderSummary() {
  const summaryContent = document.getElementById("summaryContent");
  const totalSpent = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = data.totalBudget - totalSpent;
  const total = data.totalBudget;

  let html = `
    <p><strong>Total Budget:</strong> $${total}</p>
    <p><strong>Total Spent:</strong> $${totalSpent}</p>
    <p><strong>Remaining:</strong> $${remaining}</p>
    <hr>
    <h4>Expenses by Category</h4>
  `;

  const colors = ["bar1", "bar2", "bar3", "bar4", "bar5"];
  data.expenses.forEach((exp, i) => {
    const width = ((exp.amount / total) * 100).toFixed(1);
    const colorClass = colors[i % colors.length];
    html += `
      <div class="summary-label">${exp.name} — $${exp.amount} (${width}%)</div>
      <div class="summary-bar">
        <div class="summary-fill ${colorClass}" style="width:${width}%;"></div>
      </div>
    `;
  });

  summaryContent.innerHTML = html;
}

// =============================
// Event Listeners
// =============================
function addEventListeners() {
  const goalModal = document.getElementById("goalModal");
  const expenseModal = document.getElementById("expenseModal");
  const summaryModal = document.getElementById("summaryModal");

  // Open modals
  document.getElementById("btnAddGoal").addEventListener("click", () => {
    goalModal.classList.remove("hidden");
  });

  document.getElementById("btnAddExpense").addEventListener("click", () => {
    expenseModal.classList.remove("hidden");
  });

  // ---- Neil's View Summary ----
  const btnSummary = document.getElementById("btnSummary");
  const closeSummary = document.getElementById("closeSummary");

  if (btnSummary) {
    btnSummary.addEventListener("click", () => {
      renderSummary();
      summaryModal.classList.remove("hidden");
    });
  }

  if (closeSummary) {
    closeSummary.addEventListener("click", () => {
      summaryModal.classList.add("hidden");
    });
  }

  // Close modals
  document.getElementById("cancelGoal").addEventListener("click", () => {
    goalModal.classList.add("hidden");
  });
  document.getElementById("cancelExpense").addEventListener("click", () => {
    expenseModal.classList.add("hidden");
  });

  // Save goal
  document.getElementById("saveGoal").addEventListener("click", () => {
    const name = document.getElementById("goalName").value.trim();
    const target = parseFloat(document.getElementById("goalTarget").value);
    const current = parseFloat(document.getElementById("goalCurrent").value);

    if (!name || isNaN(target)) return alert("Please enter valid values.");
    data.goals.push({ name, target, current: current || 0 });
    saveData();
    renderAll();
    goalModal.classList.add("hidden");
  });

  // Save expense
  document.getElementById("saveExpense").addEventListener("click", () => {
    const name = document.getElementById("expenseName").value.trim();
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    if (!name || isNaN(amount)) return alert("Please enter valid values.");
    data.expenses.push({ name, amount });
    saveData();
    renderAll();
    expenseModal.classList.add("hidden");
  });
}

// =============================
// Start App
// =============================
init();
