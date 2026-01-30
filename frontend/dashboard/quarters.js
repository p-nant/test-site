export function populateQuarterSelector({ expenses, quarterSelector, onQuarterChange }) {
  const quarters = new Set();
  expenses.forEach(exp => {
    const date = new Date(exp.date);
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3);
    quarters.add(`${year}-Q${quarter + 1}`);
  });

  const sortedQuarters = Array.from(quarters).sort((a, b) => {
    const [aYear, aQ] = a.split('-Q').map(Number);
    const [bYear, bQ] = b.split('-Q').map(Number);
    if (aYear !== bYear) return bYear - aYear;
    return bQ - aQ;
  });

  quarterSelector.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Quarters';
  quarterSelector.appendChild(allOption);

  sortedQuarters.forEach((quarter, index) => {
    const option = document.createElement('option');
    option.value = quarter;
    option.textContent = quarter;
    if (index === 1) option.selected = true;
    quarterSelector.appendChild(option);
  });

  quarterSelector.addEventListener('change', () => {
    onQuarterChange(quarterSelector.value);
  });

  if (sortedQuarters.length > 1) {
    quarterSelector.value = sortedQuarters[1];
    onQuarterChange(sortedQuarters[1]);
  } else if (sortedQuarters.length === 1) {
    quarterSelector.value = sortedQuarters[0];
    onQuarterChange(sortedQuarters[0]);
  } else {
    onQuarterChange('all');
  }
}

export function renderCurrentQuarter(expenses, {
  currentQuarterExpensesSpan,
  currentQuarterRemittancesSpan,
  currentQuarterBalanceSpan
}) {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const currentYear = now.getFullYear();

  const currentQuarterStart = new Date(currentYear, currentQuarter * 3, 1);
  const currentQuarterEnd = new Date(currentYear, (currentQuarter + 1) * 3, 0);

  let currentQExpenses = 0, currentQRemittances = 0;

  expenses.forEach(exp => {
    const expDate = new Date(exp.date);
    const amount = parseFloat(exp.amount) || 0;

    if (expDate >= currentQuarterStart && expDate <= currentQuarterEnd) {
      if (exp.business_unit === 'Remittances') {
        currentQRemittances += amount;
      } else {
        currentQExpenses += amount;
      }
    }
  });

  const currentBalance = currentQRemittances - currentQExpenses;

  currentQuarterExpensesSpan.textContent = currentQExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  currentQuarterRemittancesSpan.textContent = currentQRemittances.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  currentQuarterBalanceSpan.textContent = currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function renderSelectedQuarter(expenses, quarterKey, {
  selectedQuarterTitleH4,
  selectedQuarterExpensesSpan,
  selectedQuarterRemittancesSpan,
  selectedQuarterBalanceSpan
}) {
  if (quarterKey === 'all') {
    let allExpenses = 0, allRemittances = 0;

    expenses.forEach(exp => {
      const amount = parseFloat(exp.amount) || 0;
      if (exp.business_unit === 'Remittances') {
        allRemittances += amount;
      } else {
        allExpenses += amount;
      }
    });

    const allBalance = allRemittances - allExpenses;

    selectedQuarterTitleH4.textContent = 'All Quarters';
    selectedQuarterExpensesSpan.textContent = allExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    selectedQuarterRemittancesSpan.textContent = allRemittances.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    selectedQuarterBalanceSpan.textContent = allBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return;
  }

  const [year, qNum] = quarterKey.split('-Q').map(Number);
  const quarter = qNum - 1;

  const quarterStart = new Date(year, quarter * 3, 1);
  const quarterEnd = new Date(year, (quarter + 1) * 3, 0);

  let selectedQExpenses = 0, selectedQRemittances = 0;

  expenses.forEach(exp => {
    const expDate = new Date(exp.date);
    const amount = parseFloat(exp.amount) || 0;

    if (expDate >= quarterStart && expDate <= quarterEnd) {
      if (exp.business_unit === 'Remittances') {
        selectedQRemittances += amount;
      } else {
        selectedQExpenses += amount;
      }
    }
  });

  const selectedBalance = selectedQRemittances - selectedQExpenses;

  selectedQuarterTitleH4.textContent = quarterKey;
  selectedQuarterExpensesSpan.textContent = selectedQExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  selectedQuarterRemittancesSpan.textContent = selectedQRemittances.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  selectedQuarterBalanceSpan.textContent = selectedBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
