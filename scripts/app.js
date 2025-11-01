document.addEventListener("DOMContentLoaded", () => {
  if (document.title.includes("Summary")) renderSummary();
  if (document.title.includes("Expenses")) renderExpenses();
  if (document.title.includes("Goals")) renderGoals();
});

function getData() {
  const defaultData = {
    totalBudget: 5000,
    expenses: [{ name: "Groceries", amount: 300 }, { name: "Internet", amount: 50 }],
    goals: [
      { name: "Emergency Fund", target: 1000, current: 250 },
      { name: "Vacation", target: 1500, current: 400 }
    ]
  };
  return JSON.parse(localStorage.getItem("budgetData")) || defaultData;
}

function saveData(data) {
  localStorage.setItem("budgetData", JSON.stringify(data));
}

function renderExpenses() {
  const data = getData();
  const list = document.getElementById("expenseList");
  list.innerHTML = "";
  data.expenses.forEach(e => {
    const li = document.createElement("li");
    li.textContent = `${e.name}: $${e.amount}`;
    list.appendChild(li);
  });
}

function renderGoals() {
  const data = getData();
  const list = document.getElementById("goalList");
  list.innerHTML = "";
  data.goals.forEach(g => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${g.name}</strong><br>
    <progress value="${g.current}" max="${g.target}"></progress>
    <p>${((g.current/g.target)*100).toFixed(1)}% of $${g.target}</p>`;
    list.appendChild(li);
  });
}

function renderSummary() {
  const data = getData();
  const totalSpent = data.expenses.reduce((s,e)=>s+e.amount,0);
  const remaining = data.totalBudget - totalSpent;
  const content = document.getElementById("summaryContent");
  content.innerHTML = `
    <p><strong>Total Budget:</strong> $${data.totalBudget}</p>
    <p><strong>Total Spent:</strong> $${totalSpent}</p>
    <p><strong>Remaining:</strong> $${remaining}</p>`;
}
