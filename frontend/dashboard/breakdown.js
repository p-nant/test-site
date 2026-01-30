export function renderBreakdown({ summary, breakdownBody, escapeHtml, onToggle }) {
  breakdownBody.innerHTML = '';
  const entries = Object.entries(summary);

  if (entries.length === 0) {
    breakdownBody.innerHTML = '<tr><td colspan="3">No data</td></tr>';
    return;
  }

  entries.forEach(([centre, stats]) => {
    const tr = document.createElement('tr');
    tr.classList.add('business-unit-row');
    tr.dataset.businessUnit = centre;
    tr.style.cursor = 'pointer';
    tr.style.fontWeight = 'bold';
    tr.innerHTML = `
      <td>▶ ${escapeHtml(centre)}</td>
      <td>${stats.count.toLocaleString('en-US')}</td>
      <td>${stats.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    `;

    tr.addEventListener('click', () => onToggle(centre, tr));
    breakdownBody.appendChild(tr);
  });
}

export function toggleProjectBreakdown({ businessUnit, row, expensesToUse, escapeHtml }) {
  const existingProjectRows = row.parentElement.querySelectorAll(`.project-row[data-parent="${businessUnit}"]`);

  if (existingProjectRows.length > 0) {
    existingProjectRows.forEach(pr => pr.remove());
    row.querySelector('td').textContent = '▶ ' + businessUnit;
    return;
  }

  row.querySelector('td').textContent = '▼ ' + businessUnit;

  const unitExpenses = expensesToUse.filter(exp => exp.business_unit === businessUnit);

  const projectMap = {};
  unitExpenses.forEach(exp => {
    const projectName = exp.project || 'General';
    if (!projectMap[projectName]) {
      projectMap[projectName] = { count: 0, total: 0 };
    }
    projectMap[projectName].count += 1;
    projectMap[projectName].total += parseFloat(exp.amount) || 0;
  });

  const projectEntries = Object.entries(projectMap).sort((a, b) => b[1].total - a[1].total);
  projectEntries.forEach(([project, stats]) => {
    const projectRow = document.createElement('tr');
    projectRow.classList.add('project-row');
    projectRow.dataset.parent = businessUnit;
    projectRow.style.backgroundColor = '#f8f9fa';
    projectRow.innerHTML = `
      <td style="padding-left: 2rem;">└─ ${escapeHtml(project)}</td>
      <td>${stats.count.toLocaleString('en-US')}</td>
      <td>${stats.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    `;
    row.after(projectRow);
    row = projectRow;
  });
}
