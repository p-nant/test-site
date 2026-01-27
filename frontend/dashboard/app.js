const API_BASE_URL = 'http://192.168.1.175:8000';

document.addEventListener('DOMContentLoaded', () => {
  const totalExpensesSpan = document.getElementById('dashTotalExpenses');
  const totalRemittancesSpan = document.getElementById('dashTotalRemittances');
  const netBalanceSpan = document.getElementById('dashNetBalance');
  const countSpan = document.getElementById('dashExpenseCount');
  const breakdownBody = document.getElementById('dashCostCentreBody');
  const chartCanvas = document.getElementById('costCentreChart');
  const monthlyTrendCanvas = document.getElementById('monthlyTrendChart');
  
  const currentQuarterExpensesSpan = document.getElementById('currentQuarterExpenses');
  const currentQuarterRemittancesSpan = document.getElementById('currentQuarterRemittances');
  // previousQuarterExpenses
  // previousQuarterRemittances
  const currentQuarterBalanceSpan = document.getElementById('currentQuarterBalance');
  const selectedQuarterExpensesSpan = document.getElementById('selectedQuarterExpenses');
  const selectedQuarterRemittancesSpan = document.getElementById('selectedQuarterRemittances');
  const selectedQuarterBalanceSpan = document.getElementById('selectedQuarterBalance');
  const selectedQuarterTitleH4 = document.getElementById('selectedQuarterTitle');
  const quarterSelector = document.getElementById('quarterSelector');
  const chartTitle = document.getElementById('chartTitle');
  const chartBackBtn = document.getElementById('chartBackBtn');
  
  let allExpenses = [];
  let currentChartView = 'business-units'; // or 'projects'
  let currentBusinessUnit = null;
  
  let chartInstance = null;
  let monthlyChartInstance = null;

  // Back button handler
  chartBackBtn.addEventListener('click', () => {
    currentChartView = 'business-units';
    currentBusinessUnit = null;
    chartBackBtn.style.display = 'none';
    chartTitle.textContent = 'Business Unit Share';
    
    // Re-aggregate by business unit
    const summary = {};
    allExpenses.forEach(exp => {
      const key = exp.business_unit || 'N/A';
      if (!summary[key]) {
        summary[key] = { count: 0, total: 0 };
      }
      summary[key].count += 1;
      summary[key].total += parseFloat(exp.amount) || 0;
    });
    
    renderChart(summary);
  });

  loadSummary();

  async function loadSummary() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses`);
      if (!response.ok) {
        throw new Error('Failed to load expenses');
      }

      const expenses = await response.json();
        allExpenses = expenses;
      
      // Separate remittances from expenses
      const remittances = expenses.filter(exp => exp.business_unit === 'Remittances');
      const actualExpenses = expenses.filter(exp => exp.business_unit !== 'Remittances');
      
      const totalRemittances = remittances.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
      const totalExpenses = actualExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
      const netBalance = totalRemittances - totalExpenses;
      
      totalRemittancesSpan.textContent = totalRemittances.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      totalExpensesSpan.textContent = totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      netBalanceSpan.textContent = netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      countSpan.textContent = expenses.length.toLocaleString('en-US');

      // Aggregate by business unit (include all for breakdown)
      const summary = {};
      expenses.forEach(exp => {
        const key = exp.business_unit || 'N/A';
        if (!summary[key]) {
          summary[key] = { count: 0, total: 0 };
        }
        summary[key].count += 1;
        summary[key].total += parseFloat(exp.amount) || 0;
      });

      renderBreakdown(summary);
      renderChart(summary);
      renderMonthlyTrend(expenses);
      populateQuarterSelector(expenses);
      renderCurrentQuarter(expenses);
    } catch (error) {
      console.error('Dashboard load error:', error);
      totalExpensesSpan.textContent = '—';
      totalRemittancesSpan.textContent = '—';
      netBalanceSpan.textContent = '—';
      countSpan.textContent = '—';
      breakdownBody.innerHTML = '<tr><td colspan="3">Error loading data</td></tr>';
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    }
  }

  function renderBreakdown(summary) {
    breakdownBody.innerHTML = '';
    const entries = Object.entries(summary);
    if (entries.length === 0) {
      breakdownBody.innerHTML = '<tr><td colspan="3">No data</td></tr>';
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
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
      
      // Add click handler for expansion
      tr.addEventListener('click', () => toggleProjectBreakdown(centre, tr));
      
      breakdownBody.appendChild(tr);
    });
  }
  
  function toggleProjectBreakdown(businessUnit, row) {
    // Check if already expanded
    const existingProjectRows = row.parentElement.querySelectorAll(`.project-row[data-parent="${businessUnit}"]`);
    
    if (existingProjectRows.length > 0) {
      // Collapse - remove project rows
      existingProjectRows.forEach(pr => pr.remove());
      row.querySelector('td').textContent = '▶ ' + businessUnit;
      return;
    }
    
    // Expand - show projects
    row.querySelector('td').textContent = '▼ ' + businessUnit;
    
    // Filter expenses for this business unit
    const unitExpenses = allExpenses.filter(exp => exp.business_unit === businessUnit);
    
    // Group by project
    const projectMap = {};
    unitExpenses.forEach(exp => {
      const projectName = exp.project || 'General';
      if (!projectMap[projectName]) {
        projectMap[projectName] = { count: 0, total: 0 };
      }
      projectMap[projectName].count += 1;
      projectMap[projectName].total += parseFloat(exp.amount) || 0;
    });
    
    // Insert project rows after the business unit row
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
      // Update reference for next insertion
      row = projectRow;
    });
  }
  
  function drillDownToProjects(businessUnit) {
    currentChartView = 'projects';
    currentBusinessUnit = businessUnit;
    
    // Show back button and update title
    chartBackBtn.style.display = 'inline-block';
    chartTitle.textContent = `${businessUnit} - Projects`;
    
    // Filter expenses for this business unit
    const unitExpenses = allExpenses.filter(exp => exp.business_unit === businessUnit);
    
    // Group by project
    const projectMap = {};
    unitExpenses.forEach(exp => {
      const projectName = exp.project || 'General';
      if (!projectMap[projectName]) {
        projectMap[projectName] = { count: 0, total: 0 };
      }
      projectMap[projectName].count += 1;
      projectMap[projectName].total += parseFloat(exp.amount) || 0;
    });
    
    // Render chart with projects
    renderChart(projectMap);
  }

  function renderChart(summary) {
    if (!chartCanvas) return;
    
    // Filter out remittances from the chart (expenses only)
    const entries = Object.entries(summary).filter(([centre]) => centre !== 'Remittances');
    
    if (entries.length === 0) {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      return;
    }

    const labels = entries.map(([centre]) => centre);
    const data = entries.map(([, stats]) => stats.total);

    // pleasant palette
    const palette = [
      '#2ba0d6','#71e8e2','#ffb347','#ff7f7f','#8fd19e',
      '#c39bd3','#f7dc6f','#85c1e9','#f1948a','#7fb3d5'
    ];

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(chartCanvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: labels.map((_, i) => palette[i % palette.length]),
          borderWidth: 1,
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed;
                return `${ctx.label}: ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          }
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const clickedLabel = labels[index];
            
            if (currentChartView === 'business-units') {
              // Drill down to projects for this business unit
              const businessUnit = clickedLabel;
              drillDownToProjects(businessUnit);
              
              // Also expand table row
              const row = Array.from(breakdownBody.querySelectorAll('.business-unit-row'))
                .find(r => r.dataset.businessUnit === businessUnit);
              
              if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.style.backgroundColor = '#fff3cd';
                setTimeout(() => {
                  row.style.backgroundColor = '';
                }, 1500);
                
                const existingProjectRows = row.parentElement.querySelectorAll(`.project-row[data-parent="${businessUnit}"]`);
                if (existingProjectRows.length === 0) {
                  toggleProjectBreakdown(businessUnit, row);
                }
              }
            }
          }
        }
      }
    });
  }

  function renderMonthlyTrend(expenses) {
    if (!monthlyTrendCanvas) return;
    
    // Group expenses by month
    const monthlyData = {};
    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { expenses: 0, remittances: 0 };
      }
      
      const amount = parseFloat(exp.amount) || 0;
      if (exp.business_unit === 'Remittances') {
        monthlyData[monthKey].remittances += amount;
      } else {
        monthlyData[monthKey].expenses += amount;
      }
    });
    
    // Sort by month and get last 6 months
    const sortedMonths = Object.keys(monthlyData).sort();
    const last6Months = sortedMonths.slice(-6);
    
    const labels = last6Months.map(key => {
      const [year, month] = key.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    
    const expensesData = last6Months.map(key => monthlyData[key].expenses);
    const remittancesData = last6Months.map(key => monthlyData[key].remittances);
    
    if (monthlyChartInstance) {
      monthlyChartInstance.destroy();
    }
    
    monthlyChartInstance = new Chart(monthlyTrendCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Expenses',
            data: expensesData,
            borderColor: '#ff7f7f',
            backgroundColor: 'rgba(255, 127, 127, 0.1)',
            tension: 0.3
          },
          {
            label: 'Remittances',
            data: remittancesData,
            borderColor: '#8fd19e',
            backgroundColor: 'rgba(143, 209, 158, 0.1)',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                return `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UGX`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => value.toLocaleString('en-US')
            }
          }
        }
      }
    });
  }

  function populateQuarterSelector(expenses) {
    // Extract all unique quarters from expenses
    const quarters = new Set();
    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const year = date.getFullYear();
      const quarter = Math.floor(date.getMonth() / 3);
      quarters.add(`${year}-Q${quarter + 1}`);
    });
    
    // Sort quarters in descending order (newest first)
    const sortedQuarters = Array.from(quarters).sort((a, b) => {
      const [aYear, aQ] = a.split('-Q').map(Number);
      const [bYear, bQ] = b.split('-Q').map(Number);
      if (aYear !== bYear) return bYear - aYear;
      return bQ - aQ;
    });
    
    quarterSelector.innerHTML = '';
    
    // Add "All Quarters" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Quarters';
    quarterSelector.appendChild(allOption);
    
    sortedQuarters.forEach((quarter, index) => {
      const option = document.createElement('option');
      option.value = quarter;
      option.textContent = quarter;
      if (index === 1) option.selected = true; // Select previous quarter by default
      quarterSelector.appendChild(option);
    });
    
    // Add event listener for quarter changes
    quarterSelector.addEventListener('change', () => {
      renderSelectedQuarter(allExpenses, quarterSelector.value);
    });
    
    // Initial render
    if (sortedQuarters.length > 1) {
      renderSelectedQuarter(expenses, sortedQuarters[1]);
    } else if (sortedQuarters.length === 1) {
      renderSelectedQuarter(expenses, sortedQuarters[0]);
    }
  }
  
  function renderCurrentQuarter(expenses) {
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
  
  function renderSelectedQuarter(expenses, quarterKey) {
    // Handle "All Quarters" selection
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

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
