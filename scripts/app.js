// Wait for the HTML document to be fully loaded before running script
document.addEventListener("DOMContentLoaded", () => {
  // Use the <body> id to determine which page's code to run
  // This is cleaner than checking document.title
  const page = document.body.id;

  // Initialize the app (check for existing data)
  initApp();

  // Page-specific router
  switch (page) {
    case "page-index":
      renderDashboard();
      break;
    case "page-expenses":
      setupExpensePage();
      break;
    case "page-goals":
      setupGoalPage();
      break;
    case "page-summary":
      renderSummaryPage();
      break;
    case "page-settings":
      setupSettingsPage();
      break;
  }
});

// --- DATABASE (LocalStorage) FUNCTIONS ---

/**
 * Initializes the app data in localStorage if it doesn't exist.
 */
function initApp() {
  if (!localStorage.getItem("budgetApp")) {
    const defaultData = {
      income: [],
      expenses: [],
      goals: [],
      settings: {
        alertThreshold: 100, // Default low-balance alert at $100
      },
    };
    saveData(defaultData);
  }
}

/**
 * Retrieves all app data from localStorage.
 * @returns {object} The complete application data object
 */
function getData() {
  return JSON.parse(localStorage.getItem("budgetApp"));
}

/**
 * Saves the complete data object back to localStorage.
 * @param {object} data The complete application data object
 */
function saveData(data) {
  localStorage.setItem("budgetApp", JSON.stringify(data));
}

/**
 * A utility function to generate a unique ID.
 * @returns {string} A unique identifier
 */
function generateId() {
  return "_" + Math.random().toString(36).substr(2, 9);
}

// --- SHARED CALCULATION FUNCTIONS ---

/**
 * Calculates total income, expenses, and current balance.
 * @returns {object} { totalIncome, totalExpenses, currentBalance }
 */
function getTotals() {
  const data = getData();
  const totalIncome = data.income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = data.expenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const currentBalance = totalIncome - totalExpenses;
  return { totalIncome, totalExpenses, currentBalance };
}

/**
 * Checks balance against the alert threshold and shows/hides the alert.
 * This is a "Deep Task" as it requires data from settings and tracking.
 */
function checkBalanceAlert() {
  const data = getData();
  const { currentBalance } = getTotals();
  const threshold = data.settings.alertThreshold;

  const alertBox = document.getElementById("balanceAlert");
  const balanceEl = document.getElementById("currentBalance");

  if (currentBalance < threshold) {
    if (alertBox) {
      alertBox.textContent = `⚠️ Warning: Your balance is below $${threshold}!`;
      alertBox.classList.remove("hidden");
    }
    if (balanceEl) {
      balanceEl.classList.add("balance-low");
    }
    // This is the alert you wanted
    // We only show it once per session to avoid annoyance
    if (!sessionStorage.getItem("alertShown")) {
      alert(
        `Your balance has dropped to $${currentBalance.toFixed(
          2
        )}, which is below your $${threshold} threshold.`
      );
      sessionStorage.setItem("alertShown", "true");
    }
  } else {
    if (alertBox) {
      alertBox.classList.add("hidden");
    }
    if (balanceEl) {
      balanceEl.classList.remove("balance-low");
    }
  }
}

// --- PAGE: index.html (Dashboard) ---

/**
 * Renders all components on the main dashboard page.
 */
function renderDashboard() {
  const data = getData();
  const { totalIncome, totalExpenses, currentBalance } = getTotals();

  // Task: View Current Balance
  document.getElementById("currentBalance").textContent =
    `$${currentBalance.toFixed(2)}`;
  document.getElementById(
    "incomeTotal"
  ).textContent = `+ Income: $${totalIncome.toFixed(2)}`;
  document.getElementById(
    "expenseTotal"
  ).textContent = `− Spent: $${totalExpenses.toFixed(2)}`;

  // Task: View Recent Expenses (last 5)
  const recentList = document.getElementById("recentExpensesList");
  recentList.innerHTML = ""; // Clear list
  const recentExpenses = [...data.expenses].reverse().slice(0, 5); // Get last 5

  if (recentExpenses.length === 0) {
    recentList.innerHTML = "<li>No expenses added yet.</li>";
  } else {
    recentExpenses.forEach((exp) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${exp.name} (${exp.category})</span>
        <span class="expense">-$${exp.amount.toFixed(2)}</span>
      `;
      recentList.appendChild(li);
    });
  }

  // Task: View Goal Progress
  const goalList = document.getElementById("goalProgressList");
  goalList.innerHTML = ""; // Clear list

  if (data.goals.length === 0) {
    goalList.innerHTML = "<li>No goals set up yet. Go to the Goals tab!</li>";
  } else {
    data.goals.forEach((goal) => {
      const li = document.createElement("li");
      const percent = (goal.current / goal.target) * 100;
      li.innerHTML = `
        <label>${goal.name} ($${goal.current.toFixed(
        2
      )} / $${goal.target.toFixed(2)})</label>
        <progress value="${goal.current}" max="${
        goal.target
      }" title="${percent.toFixed(1)}%"></progress>
      `;
      goalList.appendChild(li);
    });
  }

  // Task: Receive Low-Balance Alert
  checkBalanceAlert();
}

// --- PAGE: expenses.html ---

/**
 * Sets up event listeners and renders the list for the Expenses page.
 */
function setupExpensePage() {
  // Task: Add a New Expense
  const expenseForm = document.getElementById("expenseForm");
  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = getData();

    const newExpense = {
      id: generateId(),
      name: document.getElementById("expName").value,
      amount: parseFloat(document.getElementById("expAmt").value),
      category: document.getElementById("expCat").value,
      date: document.getElementById("expDate").value || new Date().toISOString().split("T")[0],
      source: document.getElementById("expSrc").value,
    };

    if (!newExpense.name || !newExpense.amount) {
      alert("Please enter a name and amount.");
      return;
    }

    data.expenses.push(newExpense);
    saveData(data);

    expenseForm.reset();
    renderExpenseList(); // Re-render the list on the same page
    checkBalanceAlert(); // Check balance immediately after adding
  });

  // Task: Delete an Expense (Shallow Task)
  const allExpensesList = document.getElementById("allExpensesList");
  allExpensesList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const id = e.target.dataset.id;
      if (confirm("Are you sure you want to delete this expense?")) {
        let data = getData();
        data.expenses = data.expenses.filter((exp) => exp.id !== id);
        saveData(data);
        renderExpenseList(); // Re-render list
        checkBalanceAlert(); // Re-check balance
      }
    }
  });

  // Task: View All Expenses
  renderExpenseList();
}

/**
 * Renders the full list of expenses on the Expenses page.
 */
function renderExpenseList() {
  const data = getData();
  const listEl = document.getElementById("allExpensesList");
  listEl.innerHTML = ""; // Clear list

  if (data.expenses.length === 0) {
    listEl.innerHTML = "<li>No expenses found.</li>";
    return;
  }

  // Sort by date, newest first
  const sortedExpenses = [...data.expenses].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  sortedExpenses.forEach((exp) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${exp.name}</strong> ($${exp.amount.toFixed(2)})
        <small>${exp.date} - ${exp.category}</small>
      </div>
      <button class="delete-btn" data-id="${exp.id}">Delete</button>
    `;
    listEl.appendChild(li);
  });
}

// --- PAGE: goals.html ---

/**
 * Sets up event listeners and renders the list for the Goals page.
 */
function setupGoalPage() {
  // Task: Add a New Goal
  const goalForm = document.getElementById("goalForm");
  goalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = getData();

    const newGoal = {
      id: generateId(),
      name: document.getElementById("goalName").value,
      target: parseFloat(document.getElementById("goalTarget").value),
      current: 0, // New goals start at 0
    };

    if (!newGoal.name || !newGoal.target) {
      alert("Please enter a goal name and target amount.");
      return;
    }

    data.goals.push(newGoal);
    saveData(data);

    goalForm.reset();
    renderGoalList(); // Re-render the list
  });

  // Task: Contribute to Goal (Deep Task)
  // Use event delegation to handle all "contribute" button clicks
  const allGoalsList = document.getElementById("allGoalsList");
  allGoalsList.addEventListener("submit", (e) => {
    e.preventDefault();
    if (e.target.classList.contains("contribute-form")) {
      const goalId = e.target.dataset.goalId;
      const amountInput = e.target.querySelector(".contribute-amount");
      const amount = parseFloat(amountInput.value);

      if (!amount || amount <= 0) {
        alert("Please enter a valid contribution amount.");
        return;
      }

      // This is the core "integration" step
      let data = getData();

      // 1. Find and update the goal
      let goal = data.goals.find((g) => g.id === goalId);
      if (goal) {
        goal.current += amount;
      } else {
        alert("Error: Goal not found.");
        return;
      }

      // 2. Create a corresponding expense
      const newExpense = {
        id: generateId(),
        name: `Contribution to "${goal.name}"`,
        amount: amount,
        category: "Goal Contribution",
        date: new Date().toISOString().split("T")[0],
        source: "Transfer",
      };
      data.expenses.push(newExpense);

      // 3. Save and re-render
      saveData(data);
      renderGoalList(); // Re-render goals
      checkBalanceAlert(); // Check balance, this contribution is an expense!
    }
  });

  // Task: View Goal Progress
  renderGoalList();
}

/**
 * Renders the list of goals, each with a contribution form.
 */
function renderGoalList() {
  const data = getData();
  const listEl = document.getElementById("allGoalsList");
  listEl.innerHTML = ""; // Clear list

  if (data.goals.length === 0) {
    listEl.innerHTML = "<li>No goals set up. Add one above!</li>";
    return;
  }

  data.goals.forEach((goal) => {
    const li = document.createElement("li");
    const percent = (goal.current / goal.target) * 100;
    const isComplete = goal.current >= goal.target;

    li.innerHTML = `
      <h3>${goal.name} ${isComplete ? "(Completed! 🎉)" : ""}</h3>
      <p>$${goal.current.toFixed(2)} saved of $${goal.target.toFixed(2)}</p>
      <progress value="${goal.current}" max="${
      goal.target
    }" title="${percent.toFixed(1)}%"></progress>
      
      ${
        !isComplete
          ? `
      <form class="contribute-form" data-goal-id="${goal.id}">
        <label>Contribute:</label>
        <input type="number" class="contribute-amount" placeholder="e.g., 50" min="0.01" step="0.01" required>
        <button type="submit">Add</button>
      </form>
      `
          : ""
      }
    `;
    listEl.appendChild(li);
  });
}

// --- PAGE: summary.html ---

/**
 * Renders the category-based spending summary.
 */
function renderSummaryPage() {
  // Task: View Spending by Category
  const data = getData();
  const listEl = document.getElementById("categorySummaryList");
  listEl.innerHTML = "";

  if (data.expenses.length === 0) {
    listEl.innerHTML = "<li>No expenses to summarize.</li>";
    return;
  }

  const { totalExpenses } = getTotals();

  // Group expenses by category
  const byCategory = data.expenses.reduce((acc, exp) => {
    const cat = exp.category;
    if (!acc[cat]) {
      acc[cat] = 0;
    }
    acc[cat] += exp.amount;
    return acc;
  }, {});

  // Sort categories by amount, highest first
  const sortedCategories = Object.entries(byCategory).sort(
    (a, b) => b[1] - a[1]
  );

  sortedCategories.forEach(([category, amount]) => {
    const li = document.createElement("li");
    const percent = (amount / totalExpenses) * 100;
    li.innerHTML = `
      <div class="summary-item">
        <span>${category}</span>
        <span>$${amount.toFixed(2)} (${percent.toFixed(1)}%)</span>
      </div>
      <progress value="${amount}" max="${totalExpenses}"></progress>
    `;
    listEl.appendChild(li);
  });
}

// --- PAGE: settings.html ---

/**
 * Sets up event listeners and loads current settings for the Settings page.
 */
function setupSettingsPage() {
  const data = getData();

  // Task: Add Income
  const incomeForm = document.getElementById("incomeForm");
  incomeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newIncome = {
      id: generateId(),
      name: document.getElementById("incomeName").value,
      amount: parseFloat(document.getElementById("incomeAmt").value),
      date: document.getElementById("incomeDate").value || new Date().toISOString().split("T")[0],
    };

    if (!newIncome.name || !newIncome.amount) {
      alert("Please enter a name and amount.");
      return;
    }

    let data = getData();
    data.income.push(newIncome);
    saveData(data);
    incomeForm.reset();
    alert("Income added!");
    checkBalanceAlert(); // Check balance in case this puts user over threshold
  });

  // Task: Set Low-Balance Threshold
  const settingsForm = document.getElementById("settingsForm");
  const thresholdInput = document.getElementById("alertThreshold");
  // Load current setting
  thresholdInput.value = data.settings.alertThreshold;

  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newThreshold = parseFloat(thresholdInput.value);
    if (newThreshold < 0) {
      alert("Please enter a positive number.");
      return;
    }
    let data = getData();
    data.settings.alertThreshold = newThreshold;
    saveData(data);
    alert("Settings saved!");
    checkBalanceAlert(); // Re-check alert with new threshold
  });

  // Task: Reset All Data
  const resetButton = document.getElementById("resetDataButton");
  resetButton.addEventListener("click", () => {
    if (
      confirm(
        "ARE YOU SURE?\nThis will delete all income, expenses, and goals."
      )
    ) {
      localStorage.removeItem("budgetApp");
      sessionStorage.removeItem("alertShown"); // Also reset session alert
      initApp(); // Re-initialize with empty data
      alert("All data has been reset.");
      // Reload all pages to reflect change
      window.location.href = "index.html";
    }
  });
}