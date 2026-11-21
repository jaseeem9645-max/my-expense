const KEY = "myExpenseTransactions";

let transactions = JSON.parse(
  localStorage.getItem(KEY) || "[]"
);
let editingId = null;

const money = n => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR"
}).format(n);

const main = document.querySelector("main");

const section = document.createElement("section");
section.className = "form-section";

section.innerHTML = `
  <h3>Add Transaction</h3>
  <form id="expense-form">
    <select id="type">
      <option value="expense">Expense</option>
      <option value="income">Income</option>
    </select>
    <input id="amount" type="number" min="0.01"
      step="0.01" placeholder="Amount (₹)" required>
    <select id="category">
      <option>Food</option>
      <option>Travel</option>
      <option>Shopping</option>
      <option>Recharge</option>
      <option>Bills</option>
      <option>Health</option>
      <option>Education</option>
      <option>Salary</option>
      <option>Work</option>
      <option>Other</option>
    </select>
    <input id="date" type="date" required>
    <input id="note" placeholder="Description (optional)">
    <button id="save-button" type="submit">
      + Add Transaction
    </button>
  </form>
`;

const searchSection = document.createElement("section");
searchSection.className = "search-section";
searchSection.innerHTML = `
  <h3>Search Transactions</h3>
  <input id="search" placeholder="Search transactions...">
`;

const reportSection = document.createElement("section");
reportSection.className = "report-section";
reportSection.innerHTML = `
  <h3>This Month</h3>
  <p>Income: <strong id="month-income">₹0</strong></p>
  <p>Expense: <strong id="month-expense">₹0</strong></p>
`;

const recent = document.querySelector(".transactions");

main.insertBefore(section, recent);
main.insertBefore(searchSection, recent);
main.insertBefore(reportSection, recent);

const dateInput = document.getElementById("date");

function today() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

dateInput.value = today();

function save() {
  localStorage.setItem(KEY, JSON.stringify(transactions));
}

document.getElementById("expense-form")
.addEventListener("submit", e => {
  e.preventDefault();

  const amount = Number(
    document.getElementById("amount").value
  );

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Enter a valid amount");
    return;
  }

  const item = {
    id: editingId ?? Date.now(),
    type: document.getElementById("type").value,
    amount,
    category: document.getElementById("category").value,
    date: dateInput.value,
    note: document.getElementById("note").value.trim()
  };

  if (editingId !== null) {
    transactions = transactions.map(t =>
      t.id === editingId ? item : t
    );
  } else {
    transactions.push(item);
  }

  editingId = null;
  save();
  e.target.reset();
  dateInput.value = today();
  document.getElementById("save-button").textContent =
    "+ Add Transaction";
  render();
});

function editTransaction(id) {
  const t = transactions.find(x => x.id === id);
  if (!t) return;

  editingId = id;

  document.getElementById("type").value = t.type;
  document.getElementById("amount").value = t.amount;
  document.getElementById("category").value = t.category;
  dateInput.value = t.date;
  document.getElementById("note").value = t.note;

  document.getElementById("save-button").textContent =
    "Update Transaction";

  section.scrollIntoView({ behavior: "smooth" });
}

function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;

  transactions = transactions.filter(t => t.id !== id);

  if (editingId === id) {
    editingId = null;
    document.getElementById("expense-form").reset();
    dateInput.value = today();
    document.getElementById("save-button").textContent =
      "+ Add Transaction";
  }

  save();
  render();
}

function render() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  document.getElementById("balance").textContent =
    money(income - expense);

  document.getElementById("income").textContent =
    money(income);

  document.getElementById("expense").textContent =
    money(expense);

  const month = today().slice(0, 7);
  const monthly = transactions.filter(t =>
    t.date.startsWith(month)
  );

  document.getElementById("month-income").textContent =
    money(monthly.filter(t => t.type === "income")
      .reduce((s, t) => s + t.amount, 0));

  document.getElementById("month-expense").textContent =
    money(monthly.filter(t => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0));

  renderTransactions();
}

function renderTransactions() {
  const list = document.getElementById("transaction-list");
  const q = document.getElementById("search").value.toLowerCase();

  const results = [...transactions]
    .filter(t =>
      t.category.toLowerCase().includes(q) ||
      t.note.toLowerCase().includes(q)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  list.replaceChildren();

  if (!results.length) {
    list.textContent = "No transactions yet.";
    return;
  }

  results.forEach(t => {
    const item = document.createElement("div");
    item.className = "transaction-item";

    const info = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = t.category;

    const note = document.createElement("p");
    note.textContent = t.note || t.date;

    info.append(name, note);

    const amount = document.createElement("strong");
    amount.textContent =
      (t.type === "income" ? "+" : "-") + money(t.amount);
    amount.style.color =
      t.type === "income" ? "#40c98b" : "#ff7777";

    const actions = document.createElement("div");
    actions.className = "transaction-actions";

    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.onclick = () => editTransaction(t.id);

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = () => deleteTransaction(t.id);

    actions.append(edit, del);
    item.append(info, amount, actions);
    list.append(item);
  });
}

document.getElementById("search")
.addEventListener("input", renderTransactions);

render();
