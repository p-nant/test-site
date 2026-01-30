export function renderChart({ chartCanvas, summary, chartInstance, currentChartView, onBusinessUnitClick }) {
  if (!chartCanvas) return chartInstance;
  const ChartLib = window.Chart;
  if (!ChartLib) return chartInstance;

  const entries = Object.entries(summary).filter(([centre]) => centre !== 'Remittances');

  if (entries.length === 0) {
    if (chartInstance) {
      chartInstance.destroy();
    }
    return null;
  }

  const labels = entries.map(([centre]) => centre);
  const data = entries.map(([, stats]) => stats.total);

  const palette = [
    '#2ba0d6','#71e8e2','#ffb347','#ff7f7f','#8fd19e',
    '#c39bd3','#f7dc6f','#85c1e9','#f1948a','#7fb3d5'
  ];

  if (chartInstance) {
    chartInstance.destroy();
  }

  return new ChartLib(chartCanvas, {
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
        if (elements.length > 0 && currentChartView === 'business-units') {
          const index = elements[0].index;
          const clickedLabel = labels[index];
          onBusinessUnitClick?.(clickedLabel);
        }
      }
    }
  });
}

export function renderMonthlyTrend(expenses, monthlyTrendCanvas, monthlyChartInstance) {
  if (!monthlyTrendCanvas) return monthlyChartInstance;
  const ChartLib = window.Chart;
  if (!ChartLib) return monthlyChartInstance;

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

  return new ChartLib(monthlyTrendCanvas, {
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
