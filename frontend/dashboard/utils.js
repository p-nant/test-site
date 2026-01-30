export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

export function aggregateByBusinessUnit(expenses) {
  const summary = {};
  expenses.forEach(exp => {
    const key = exp.business_unit || 'N/A';
    if (!summary[key]) {
      summary[key] = { count: 0, total: 0 };
    }
    summary[key].count += 1;
    summary[key].total += parseFloat(exp.amount) || 0;
  });
  return summary;
}

export function splitRemittances(expenses) {
  const remittances = expenses.filter(exp => exp.business_unit === 'Remittances');
  const actualExpenses = expenses.filter(exp => exp.business_unit !== 'Remittances');
  return { remittances, actualExpenses };
}
