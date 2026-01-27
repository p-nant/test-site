const API_BASE_URL = 'http://192.168.1.175:8000';

let isError = false;

// Clean number input fields
function cleanNumber(str) {
  return str.replace(/[^\d.]/g, '');
}

function isInvalidNumber(str) {
  return /\d+e\d+/i.test(str);
}

// Validation 
function validateExpense({date, person, description, amount}) {
  if (!date || !person || !description || amount <= 0) {
    alert('Please fill all required fields with valid data.');
    isError = true;
    return false;
  }
  return true;
}

// API helpers 
async function createExpense(data) {
  return fetch(`${API_BASE_URL}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

async function deleteExpense(id) {
  return fetch(`${API_BASE_URL}/api/expenses/${id}`, {
    method: 'DELETE'
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('expenseForm');
  const tbody = document.querySelector('#expensesTable tbody');

  // Load existing expenses on page load
  loadExpenses();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form values
    const date = form.date.value;
    const person = form.person.value.trim();
    const description = form.description.value.trim();
    isError = false;
    const rawAmount = cleanNumber(form.amount.value);
    if (isInvalidNumber(rawAmount)) {
      alert('Invalid amount format');
      return;
    }
    const amount = Number(rawAmount);
    const business_unit = form["business-unit"].value;
    const project = form["project"].value.trim() || null;

    // Basic validation
    if (!validateExpense({date, person, description, amount}) || isError) return; 

    // Submit to API
    try {
      const response = await createExpense({
        date,
        person,
        description,
        amount,
        business_unit,
        project
      })

      if (response.ok) {
        const expense = await response.json();
        addExpenseRow(expense);
        form.reset();
      } else {
        alert('Error adding expense. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to API. Make sure backend is running.');
    }
  });

  async function loadExpenses() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses`);
      if (response.ok) {
        const expenses = await response.json();
        expenses.forEach(expense => addExpenseRow(expense));
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  }

  function addExpenseRow(expense) {
    const tr = document.createElement('tr');
    tr.dataset.expenseId = expense.id;
    tr.dataset.amount = expense.amount;
    function createCell(text) {
      const td = document.createElement('td');
      td.textContent = text ?? '';
      return td;
    }

    const amountFormatted = parseFloat(expense.amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Highlight remittances with a different style
    if (expense.business_unit === 'Remittances') {
      tr.classList.add('remittance-row');
    }

    tr.append(
      createCell(expense.date),
      createCell(expense.person),
      createCell(expense.description),
      createCell(amountFormatted),
      createCell(expense.business_unit),
      createCell(expense.project || '-')
    );

    // Delete button

    const deleteTd = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteTd.appendChild(deleteBtn);
    tr.appendChild(deleteTd);

    tbody.prepend(tr);

    // Add delete functionality
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this expense?')) {
        try {
          const response = await deleteExpense(expense.id);
          if (response.ok) {
            tr.remove();
          }
        } catch (error) {
          console.error('Error deleting expense:', error);
          alert('Error deleting expense.');
        }
      }
    });
  }
  
})
