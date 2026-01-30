import { fetchExpenses } from './api.js';
import { renderChart, renderMonthlyTrend } from './charts.js';
import { renderBreakdown, toggleProjectBreakdown } from './breakdown.js';
import { populateQuarterSelector, renderCurrentQuarter, renderSelectedQuarter } from './quarters.js';
import { escapeHtml, aggregateByBusinessUnit, splitRemittances } from './utils.js';

const API_BASE_URL = 'http://localhost:8000';

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
  const currentQuarterBalanceSpan = document.getElementById('currentQuarterBalance');
  const selectedQuarterExpensesSpan = document.getElementById('selectedQuarterExpenses');
  const selectedQuarterRemittancesSpan = document.getElementById('selectedQuarterRemittances');
  const selectedQuarterBalanceSpan = document.getElementById('selectedQuarterBalance');
  const selectedQuarterTitleH4 = document.getElementById('selectedQuarterTitle');
  const quarterSelector = document.getElementById('quarterSelector');
  const chartTitle = document.getElementById('chartTitle');
  const chartBackBtn = document.getElementById('chartBackBtn');

  let allExpenses = [];
  let currentChartView = 'business-units';
  let currentBusinessUnit = null;
  let filteredExpenses = [];

  let chartInstance = null;
  let monthlyChartInstance = null;

  const getExpensesToUse = () => (filteredExpenses.length > 0 ? filteredExpenses : allExpenses);

  function handleBackClick() {
    currentChartView = 'business-units';
    currentBusinessUnit = null;
    chartBackBtn.style.display = 'none';
    chartTitle.textContent = 'Business Unit Share';

    const expensesToUse = getExpensesToUse();
    const summary = aggregateByBusinessUnit(expensesToUse);
    chartInstance = renderChart({
      chartCanvas,
      summary,
      chartInstance,
      currentChartView,
      onBusinessUnitClick: handleBusinessUnitClick
    });
  }

  chartBackBtn.addEventListener('click', handleBackClick);

  loadSummary();

  async function loadSummary() {
    try {
      const expenses = await fetchExpenses(API_BASE_URL);
      allExpenses = expenses;

      const { remittances, actualExpenses } = splitRemittances(expenses);
      const totalRemittances = remittances.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
      const totalExpenses = actualExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
      const netBalance = totalRemittances - totalExpenses;

      totalRemittancesSpan.textContent = totalRemittances.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      totalExpensesSpan.textContent = totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      netBalanceSpan.textContent = netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      countSpan.textContent = expenses.length.toLocaleString('en-US');

      const summary = aggregateByBusinessUnit(expenses);
      renderBreakdown({
        summary,
        breakdownBody,
        escapeHtml,
        onToggle: handleToggle
      });

      chartInstance = renderChart({
        chartCanvas,
        summary,
        chartInstance,
        currentChartView,
        onBusinessUnitClick: handleBusinessUnitClick
      });

      monthlyChartInstance = renderMonthlyTrend(expenses, monthlyTrendCanvas, monthlyChartInstance);

      populateQuarterSelector({
        expenses,
        quarterSelector,
        onQuarterChange: handleQuarterChange
      });

      renderCurrentQuarter(expenses, {
        currentQuarterExpensesSpan,
        currentQuarterRemittancesSpan,
        currentQuarterBalanceSpan
      });
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
      if (monthlyChartInstance) {
        monthlyChartInstance.destroy();
        monthlyChartInstance = null;
      }
    }
  }

  function handleToggle(businessUnit, row) {
    const expensesToUse = getExpensesToUse();
    toggleProjectBreakdown({
      businessUnit,
      row,
      expensesToUse,
      escapeHtml
    });
  }

  function handleBusinessUnitClick(businessUnit) {
    if (currentChartView !== 'business-units') return;
    drillDownToProjects(businessUnit);

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
        handleToggle(businessUnit, row);
      }
    }
  }

  function drillDownToProjects(businessUnit) {
    currentChartView = 'projects';
    currentBusinessUnit = businessUnit;
    chartBackBtn.style.display = 'inline-block';
    chartTitle.textContent = `${businessUnit} - Projects`;

    const expensesToUse = getExpensesToUse();
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

    chartInstance = renderChart({
      chartCanvas,
      summary: projectMap,
      chartInstance,
      currentChartView,
      onBusinessUnitClick: handleBusinessUnitClick
    });
  }

  function handleQuarterChange(quarterKey) {
    renderSelectedQuarter(allExpenses, quarterKey, {
      selectedQuarterTitleH4,
      selectedQuarterExpensesSpan,
      selectedQuarterRemittancesSpan,
      selectedQuarterBalanceSpan
    });

    let nextFiltered = allExpenses;
    if (quarterKey !== 'all') {
      const [year, qNum] = quarterKey.split('-Q').map(Number);
      const quarter = qNum - 1;
      const quarterStart = new Date(year, quarter * 3, 1);
      const quarterEnd = new Date(year, (quarter + 1) * 3, 0);

      nextFiltered = allExpenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= quarterStart && expDate <= quarterEnd;
      });
    }

    filteredExpenses = nextFiltered;
    const summary = aggregateByBusinessUnit(filteredExpenses);
    renderBreakdown({
      summary,
      breakdownBody,
      escapeHtml,
      onToggle: handleToggle
    });

    chartInstance = renderChart({
      chartCanvas,
      summary,
      chartInstance,
      currentChartView,
      onBusinessUnitClick: handleBusinessUnitClick
    });
  }
});
