document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('expenseForm');
  const tbody = document.querySelector('#expensesTable tbody');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form values
    const date = form.date.value;
    const person = form.person.value.trim();
    const description = form.description.value.trim();
    const amount = parseFloat(form.amount.value) || 0;
    const category = form.category.value;

    // Basic validation
    if (!date || !person || !description || amount <= 0) {
      alert('Please fill all required fields with valid data.');
      return;
    }

    // Create and append table row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(date)}</td>
      <td>${escapeHtml(person)}</td>
      <td>${escapeHtml(description)}</td>
      <td>${amount.toFixed(2)}</td>
      <td>${escapeHtml(category)}</td>
    `;

    tbody.appendChild(tr);

    // Reset form
    form.reset();
  });

  // Simple XSS protection helper
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
